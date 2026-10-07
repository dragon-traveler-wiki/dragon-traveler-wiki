import {
  DEFAULT_BANNER_ORIGINAL_WIDTH,
  DEFAULT_BANNER_SRC,
  DEFAULT_BANNER_SRC_SET,
} from '@/constants/banner';
import SafeVideo from '@/components/ui/SafeVideo';
import { getHomeHeroPlaceholderGradient } from '@/constants/home-styles';
import { TRANSITION } from '@/constants/ui';
import { BannerContext, UiOpacityContext } from '@/contexts';
import { useDarkMode } from '@/hooks';
import { Box } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
} from 'react';

const measuredHeightBySource = new Map<string, number>();
const PARALLAX_RATE = 0.14;
const MAX_PARALLAX_OFFSET = 220;
const FALLBACK_BANNER_HEIGHT = 350;

type MeasuredMedia = {
  src: string;
  height: number;
} | null;

type BannerGeometry = {
  outerStyle: CSSProperties;
  stageStyle: CSSProperties;
  driftingStyle: CSSProperties;
};

function getNormalizedImageHeight(
  el: HTMLImageElement,
  src: string | undefined,
) {
  if (el.naturalHeight <= 0) return 0;
  if (src === DEFAULT_BANNER_SRC && el.naturalWidth > 0) {
    return el.naturalHeight * (DEFAULT_BANNER_ORIGINAL_WIDTH / el.naturalWidth);
  }
  return el.naturalHeight;
}

function getMediaHeight(src: string | undefined, measuredMedia: MeasuredMedia) {
  if (!src) return 0;
  return (
    measuredHeightBySource.get(src) ??
    (measuredMedia?.src === src ? measuredMedia.height : 0)
  );
}

function getBannerGeometry(
  height: number,
  parallaxEnabled: boolean,
  scrollY: number,
): BannerGeometry {
  const parallaxOffset = parallaxEnabled
    ? Math.min(scrollY * PARALLAX_RATE, MAX_PARALLAX_OFFSET)
    : 0;

  if (!parallaxEnabled) {
    return {
      outerStyle: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      },
      stageStyle: {
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
      },
      driftingStyle: {
        position: 'absolute',
        inset: 0,
      },
    };
  }

  return {
    outerStyle: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 0,
    },
    stageStyle: {
      position: 'sticky',
      top: 0,
      height: `max(${height}px, 100dvh)`,
      overflow: 'hidden',
    },
    driftingStyle: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: -MAX_PARALLAX_OFFSET,
      left: 0,
      transform: `translate3d(0, -${parallaxOffset}px, 0)`,
      willChange: 'transform',
    },
  };
}

export default function BannerBackground() {
  const isDark = useDarkMode();
  const reduceMotion = useReducedMotion();
  const { selectedBanner, bannerLoaded, setBannerLoaded, slowScrollEnabled } =
    useContext(BannerContext);
  const { bannerMediaOpacity, bannerOverlayOpacity } =
    useContext(UiOpacityContext);
  const selectedBannerSrc = selectedBanner?.src;
  const responsiveBannerProps =
    selectedBannerSrc === DEFAULT_BANNER_SRC
      ? {
          srcSet: DEFAULT_BANNER_SRC_SET,
          sizes: '100vw',
        }
      : {};
  const [measuredMedia, setMeasuredMedia] = useState<MeasuredMedia>(null);
  const [scrollY, setScrollY] = useState(0);
  const [failedMedia, setFailedMedia] = useState<string | null>(null);
  const parallaxEnabled = slowScrollEnabled && !reduceMotion;

  useEffect(() => {
    if (!parallaxEnabled) return;

    if (typeof window === 'undefined') return;

    let frameId = 0;
    const update = () => {
      frameId = 0;
      setScrollY(window.scrollY || window.pageYOffset || 0);
    };
    const handleScroll = () => {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [parallaxEnabled]);

  const updateMeasuredHeight = useCallback(
    (height: number) => {
      if (height <= 0) return;
      if (!selectedBannerSrc) return;
      const measured = measuredHeightBySource.get(selectedBannerSrc);
      if (
        measured === height &&
        measuredMedia?.src === selectedBannerSrc &&
        measuredMedia.height === height
      ) {
        return;
      }
      measuredHeightBySource.set(selectedBannerSrc, height);
      setMeasuredMedia({ src: selectedBannerSrc, height });
    },
    [measuredMedia, selectedBannerSrc],
  );

  const imgRef = useCallback(
    (el: HTMLImageElement | null) => {
      if (!el) return;
      const update = () => {
        updateMeasuredHeight(getNormalizedImageHeight(el, selectedBannerSrc));
      };
      const markLoaded = () => setBannerLoaded(true);
      if (el.complete) {
        update();
        markLoaded();
      }
      el.addEventListener('load', update, { once: true });
      el.addEventListener('load', markLoaded, { once: true });
    },
    [selectedBannerSrc, setBannerLoaded, updateMeasuredHeight],
  );

  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return;
      const update = () => {
        if (el.videoHeight > 0) updateMeasuredHeight(el.videoHeight);
      };
      const markLoaded = () => setBannerLoaded(true);
      if (el.readyState >= 1) update();
      if (el.readyState >= 2) markLoaded();
      el.addEventListener('loadedmetadata', update, { once: true });
      el.addEventListener('loadeddata', markLoaded, { once: true });
    },
    [setBannerLoaded, updateMeasuredHeight],
  );

  const mediaHeight = getMediaHeight(selectedBannerSrc, measuredMedia);
  const height = mediaHeight > 0 ? mediaHeight : FALLBACK_BANNER_HEIGHT;
  const mediaFailed = failedMedia === selectedBannerSrc;

  // Static mode clips the banner to the media height. Slow-scroll mode instead
  // covers the full page and lets a sticky stage drift the media underneath it.
  const { outerStyle, stageStyle, driftingStyle } = getBannerGeometry(
    height,
    parallaxEnabled,
    scrollY,
  );

  return (
    <Box style={outerStyle}>
      <Box style={stageStyle}>
        <Box style={driftingStyle}>
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: getHomeHeroPlaceholderGradient(isDark),
            }}
          />
          {selectedBanner?.type === 'video' ? (
            <SafeVideo
              ref={videoRef}
              src={selectedBanner.src}
              autoPlay
              loop
              muted
              onLoadedData={() => setBannerLoaded(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: bannerLoaded ? bannerMediaOpacity : 0,
                transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
              }}
            />
          ) : selectedBanner && !mediaFailed ? (
            <img
              ref={imgRef}
              src={selectedBanner.src}
              {...responsiveBannerProps}
              alt=""
              fetchPriority="high"
              onError={() => setFailedMedia(selectedBanner.src)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: bannerLoaded ? bannerMediaOpacity : 0,
                transition: `opacity ${TRANSITION.SLOW} ${TRANSITION.EASE}`,
              }}
            />
          ) : null}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: isDark
                ? `rgba(0, 0, 0, ${bannerOverlayOpacity})`
                : `rgba(255, 255, 255, ${bannerOverlayOpacity})`,
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 340,
              height: 340,
              top: -130,
              left: -80,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, var(--dt-surface-glow-a) 0%, transparent var(--dt-gradient-radial-falloff))',
              filter: 'blur(4px)',
              pointerEvents: 'none',
              animation: reduceMotion
                ? 'none'
                : 'blobDriftA 22s ease-in-out infinite',
              willChange: 'transform',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              width: 360,
              height: 360,
              bottom: -170,
              right: -90,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, var(--dt-surface-glow-b) 0%, transparent var(--dt-gradient-radial-falloff))',
              filter: 'blur(6px)',
              pointerEvents: 'none',
              animation: reduceMotion
                ? 'none'
                : 'blobDriftB 18s ease-in-out -6s infinite',
              willChange: 'transform',
            }}
          />
        </Box>
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to bottom, transparent var(--dt-gradient-overlay-mid), var(--mantine-color-body) 100%)',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to right, var(--mantine-color-body) 0%, transparent var(--dt-gradient-fade-edge-start), transparent var(--dt-gradient-fade-edge-end), var(--mantine-color-body) 100%)',
          }}
        />
      </Box>
    </Box>
  );
}
