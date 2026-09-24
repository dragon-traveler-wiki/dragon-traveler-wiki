import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const detailPagePath = new URL(
  '../../src/pages/characters/DetailPage.tsx',
  import.meta.url,
);
const launcherPath = new URL(
  '../../src/features/characters/components/CharacterModelLauncher.tsx',
  import.meta.url,
);
const viewerPath = new URL(
  '../../src/features/characters/components/CharacterModelViewer.tsx',
  import.meta.url,
);
const scenePath = new URL(
  '../../src/features/characters/components/CharacterModelScene.tsx',
  import.meta.url,
);
const viteConfigPath = new URL('../../vite.config.ts', import.meta.url);

test('the character model runtime stays behind the model-button interaction', async () => {
  const [detailPage, launcher, viewer, scene] = await Promise.all([
    readFile(detailPagePath, 'utf8'),
    readFile(launcherPath, 'utf8'),
    readFile(viewerPath, 'utf8'),
    readFile(scenePath, 'utf8'),
  ]);

  assert.match(detailPage, /CharacterModelLauncher/);
  assert.doesNotMatch(detailPage, /components\/CharacterModelViewer/);
  assert.match(
    launcher,
    /lazy\(\(\) => import\('\.\/CharacterModelViewer'\)\)/,
  );
  assert.match(viewer, /CharacterModelScene/);
  assert.match(scene, /from '@react-three\/fiber'/);
  assert.doesNotMatch(launcher, /from '@react-three\//);
  assert.doesNotMatch(launcher, /from 'three'/);
});

test('Three.js dependencies use explicit cacheable production chunks', async () => {
  const config = await readFile(viteConfigPath, 'utf8');

  assert.match(config, /vite\/preload-helper.*vite-runtime/);
  assert.match(config, /three\/build\/three\.core\.js.*three-core/s);
  assert.match(config, /three\/build\/three\.module\.js.*three-renderer/s);
  assert.match(config, /node_modules\/@react-three\/.*react-three/s);
});
