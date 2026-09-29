import {
  Bounds,
  Center,
  OrbitControls,
  PerformanceMonitor,
  useBounds,
  useGLTF,
} from '@react-three/drei';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import {
  Box,
  Button,
  Loader,
  Stack,
  Text,
  useMantineTheme,
} from '@mantine/core';
import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  BackSide,
  Mesh,
  Object3D,
  PerspectiveCamera,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
} from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { getVersionedAssetUrl } from '@/assets';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useDarkMode } from '@/hooks';
import type { AssetManifestEntry } from '@/types/asset-manifest';
import {
  useModelAnimation,
  type AnimationProgress,
  type AnimationSeekRequest,
} from '../hooks/use-model-animation';
import type { ModelMetadata } from './character-model-metadata';
import {
  fragmentShader,
  neutralTexture,
  outlineFragmentShader,
  outlineVertexShader,
  vertexShader,
} from './character-model-shaders';
import {
  CAMERA_FIT_MARGIN,
  CAMERA_VIEW_DIRECTION,
  primaryActorBounds,
  projectedFitDistance,
} from './character-model-camera-math';

interface CharacterModelSceneProps {
  metadata: ModelMetadata;
  rootPath: string;
  entries: Record<string, AssetManifestEntry>;
  selectedAnimation: string;
  animationRun: number;
  paused: boolean;
  seekRequest: AnimationSeekRequest | null;
  cameraFitRequest: number;
  accent: string;
  onAnimationFinished: () => void;
  onProgress: (progress: AnimationProgress) => void;
}

function CharacterModel({
  metadata,
  modelUrl,
  textureSemantics,
  textureUrls,
  framingModelRef,
  selectedAnimation,
  animationRun,
  paused,
  seekRequest,
  onAnimationFinished,
  onProgress,
}: Omit<
  CharacterModelSceneProps,
  'rootPath' | 'entries' | 'cameraFitRequest' | 'accent'
> & {
  modelUrl: string;
  textureSemantics: string[];
  textureUrls: string[];
  framingModelRef: RefObject<Object3D | null>;
}) {
  const loadedTextures = useLoader(TextureLoader, textureUrls);
  const { animations, scene } = useGLTF(modelUrl);
  const fallbackTextures = useMemo(
    () => ({
      emission: neutralTexture(0, 0, 0),
      mra: neutralTexture(0, 180, 0),
    }),
    [],
  );
  const textureMap = useMemo(() => {
    const result: Record<string, Texture> = {};
    textureSemantics.forEach((semantic, index) => {
      result[semantic] = loadedTextures[index];
    });
    return result;
  }, [loadedTextures, textureSemantics]);
  const baseMap = textureMap.base;
  const shadeMap = textureMap.shade ?? baseMap;
  const emissionMap = textureMap.emission ?? fallbackTextures.emission;
  const mraMap = textureMap.mra ?? fallbackTextures.mra;
  const { material, outlineMaterial, model } = useMemo(() => {
    for (const texture of [baseMap, shadeMap, emissionMap, mraMap]) {
      texture.flipY = false;
    }
    for (const texture of [baseMap, shadeMap, emissionMap]) {
      texture.colorSpace = SRGBColorSpace;
    }
    const toonMaterial = new ShaderMaterial({
      name: 'Dragon Traveler actor toon material',
      uniforms: {
        baseMap: { value: baseMap },
        shadeMap: { value: shadeMap },
        emissionMap: { value: emissionMap },
        mraMap: { value: mraMap },
        lightDirection: { value: new Vector3(0.7, 1, 0.8).normalize() },
        emissionStrength: { value: metadata.material.emissionStrength },
        indirectLight: { value: metadata.material.indirectLight },
        shadowThreshold: { value: metadata.material.shadowThreshold },
        shadowSoftness: { value: metadata.material.shadowSoftness },
      },
      vertexShader,
      fragmentShader,
    });
    const silhouetteMaterial = new ShaderMaterial({
      name: 'Dragon Traveler subtle silhouette outline',
      uniforms: {
        outlineWidth: { value: metadata.material.outline },
      },
      vertexShader: outlineVertexShader,
      fragmentShader: outlineFragmentShader,
      side: BackSide,
    });
    const clone = cloneSkeleton(scene);
    const meshes: Mesh[] = [];
    clone.traverse((child: Object3D) => {
      if (child instanceof Mesh) {
        child.material = toonMaterial;
        meshes.push(child);
      }
    });
    for (const mesh of meshes) {
      const outline = mesh.clone();
      outline.name = `${mesh.name || 'mesh'} outline`;
      outline.material = silhouetteMaterial;
      outline.renderOrder = -1;
      mesh.parent?.add(outline);
    }
    return {
      material: toonMaterial,
      outlineMaterial: silhouetteMaterial,
      model: clone,
    };
  }, [baseMap, emissionMap, metadata.material, mraMap, scene, shadeMap]);
  useModelAnimation({
    clips: animations,
    root: model,
    animations: metadata.animations,
    selectedAnimation,
    animationRun,
    paused,
    seekRequest,
    onFinished: onAnimationFinished,
    onProgress,
  });
  useEffect(
    () => () => {
      material.dispose();
      outlineMaterial.dispose();
    },
    [material, outlineMaterial],
  );
  useEffect(
    () => () => {
      fallbackTextures.emission.dispose();
      fallbackTextures.mra.dispose();
    },
    [fallbackTextures],
  );

  return (
    <Center top>
      <primitive ref={framingModelRef} object={model} />
    </Center>
  );
}

function CameraFit({
  request,
  fitKey,
  framingModelRef,
  framingVertexCount,
  onReady,
}: {
  request: number;
  fitKey: string;
  framingModelRef: RefObject<Object3D | null>;
  framingVertexCount?: number;
  onReady: () => void;
}) {
  const bounds = useBounds();
  const camera = useThree((state) => state.camera);
  const get = useThree((state) => state.get);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const fittedPose = useRef<{
    fitKey: string;
    width: number;
    height: number;
    position: Vector3;
    target: Vector3;
  } | null>(null);

  useEffect(() => {
    let resetFrame = 0;
    let readyFrame = 0;
    const reset = () => {
      const controls = get().controls as unknown as {
        target: Vector3;
        update: () => void;
      } | null;
      if (!controls) {
        resetFrame = requestAnimationFrame(reset);
        return;
      }

      const cachedPose = fittedPose.current;
      if (
        cachedPose?.fitKey === fitKey &&
        cachedPose.width === width &&
        cachedPose.height === height
      ) {
        camera.up.set(0, 1, 0);
        camera.position.copy(cachedPose.position);
        controls.target.copy(cachedPose.target);
        controls.update();
        bounds.clip();
        readyFrame = requestAnimationFrame(onReady);
        return;
      }

      if (framingVertexCount && !framingModelRef.current) {
        resetFrame = requestAnimationFrame(reset);
        return;
      }

      const { box: fullBox, distance: boundsDistance } = bounds
        .refresh()
        .getSize();
      const box =
        framingVertexCount && framingModelRef.current
          ? (primaryActorBounds(framingModelRef.current, framingVertexCount) ??
            fullBox)
          : fullBox;
      const center = box.getCenter(new Vector3());
      const distance =
        camera instanceof PerspectiveCamera
          ? projectedFitDistance(box, center, CAMERA_VIEW_DIRECTION, camera)
          : boundsDistance;

      camera.up.set(0, 1, 0);
      camera.position
        .copy(center)
        .addScaledVector(CAMERA_VIEW_DIRECTION, distance);
      controls.target.copy(center);
      controls.update();
      fittedPose.current = {
        fitKey,
        width,
        height,
        position: camera.position.clone(),
        target: controls.target.clone(),
      };
      bounds.clip();
      readyFrame = requestAnimationFrame(onReady);
    };
    resetFrame = requestAnimationFrame(reset);
    return () => {
      cancelAnimationFrame(resetFrame);
      cancelAnimationFrame(readyFrame);
    };
  }, [
    bounds,
    camera,
    fitKey,
    framingModelRef,
    framingVertexCount,
    get,
    height,
    onReady,
    request,
    width,
  ]);

  return null;
}

function CharacterModelScene({
  metadata,
  rootPath,
  entries,
  selectedAnimation,
  animationRun,
  paused,
  seekRequest,
  cameraFitRequest,
  accent,
  onAnimationFinished,
  onProgress,
}: CharacterModelSceneProps) {
  const isDark = useDarkMode();
  const theme = useMantineTheme();
  const maximumDpr = Math.min(window.devicePixelRatio || 1, 2);
  const backgroundColor = isDark ? theme.colors.dark[8] : theme.colors.gray[1];
  const modelPath = `${rootPath}/${metadata.model}`;
  const modelUrl = getVersionedAssetUrl(modelPath, entries[modelPath]);
  const textureSemantics = useMemo(
    () => Object.keys(metadata.textures),
    [metadata.textures],
  );
  const textureUrls = useMemo(
    () =>
      textureSemantics.map((semantic) => {
        const path = `${rootPath}/${metadata.textures[semantic]}`;
        return getVersionedAssetUrl(path, entries[path]);
      }),
    [entries, metadata.textures, rootPath, textureSemantics],
  );
  const [dpr, setDpr] = useState(maximumDpr);
  const [modelReady, setModelReady] = useState(false);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const [renderRun, setRenderRun] = useState(0);
  const framingModelRef = useRef<Object3D>(null);

  const handleReady = useCallback(() => setModelReady(true), []);
  const handleRenderError = useCallback((error: Error) => {
    setModelReady(false);
    setRenderError(error);
  }, []);
  const retry = useCallback(() => {
    useGLTF.clear(modelUrl);
    for (const textureUrl of textureUrls) {
      useLoader.clear(TextureLoader, textureUrl);
    }
    setRenderError(null);
    setModelReady(false);
    setRenderRun((run) => run + 1);
  }, [modelUrl, textureUrls]);

  if (renderError) {
    return (
      <Stack align="center" justify="center" mih={{ base: 440, sm: 620 }}>
        <Text fw={600}>The model assets could not be loaded</Text>
        <Text c="dimmed" maw={420} size="sm" ta="center">
          {renderError.message}
        </Text>
        <Button color={accent} onClick={retry} size="xs" variant="light">
          Try again
        </Button>
      </Stack>
    );
  }

  return (
    <Box h={{ base: 440, sm: 620 }} pos="relative">
      {!modelReady && (
        <Stack
          align="center"
          gap="xs"
          inset={0}
          justify="center"
          pos="absolute"
        >
          <Loader color={accent} size="sm" />
          <Text c="dimmed" size="sm">
            Preparing viewer…
          </Text>
        </Stack>
      )}
      <ErrorBoundary
        scope="section"
        name="3D model canvas"
        resetKeys={[metadata.model, renderRun]}
        onError={handleRenderError}
        fallback={() => null}
      >
        <Canvas
          camera={{ position: [0, 0.9, 2.2], fov: 32 }}
          dpr={dpr}
          style={{ opacity: modelReady ? 1 : 0 }}
        >
          <color attach="background" args={[backgroundColor]} />
          <OrbitControls makeDefault enablePan={false} minDistance={0.5} />
          <PerformanceMonitor
            flipflops={3}
            onChange={({ factor }) => setDpr(Math.max(1, maximumDpr * factor))}
            onFallback={() => setDpr(1)}
          />
          <Suspense fallback={null}>
            <Bounds clip observe margin={CAMERA_FIT_MARGIN}>
              <CharacterModel
                metadata={metadata}
                modelUrl={modelUrl}
                textureSemantics={textureSemantics}
                textureUrls={textureUrls}
                framingModelRef={framingModelRef}
                selectedAnimation={selectedAnimation}
                animationRun={animationRun}
                paused={paused}
                seekRequest={seekRequest}
                onAnimationFinished={onAnimationFinished}
                onProgress={onProgress}
              />
              <CameraFit
                request={cameraFitRequest}
                fitKey={modelUrl}
                framingModelRef={framingModelRef}
                framingVertexCount={metadata.framingVertexCount}
                onReady={handleReady}
              />
            </Bounds>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </Box>
  );
}

export default memo(CharacterModelScene);
