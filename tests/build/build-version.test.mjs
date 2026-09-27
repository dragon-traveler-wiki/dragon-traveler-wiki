import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {
  buildVersionPlugin,
  injectBuildMetadata,
  resolveBuildId,
} from '../../scripts/build-version.mjs';

const indexPath = new URL('../../index.html', import.meta.url);

async function runBuildRecovery({ currentBuild, deployedBuild, href }) {
  const html = injectBuildMetadata(
    await readFile(indexPath, 'utf8'),
    currentBuild,
    '/',
  );
  const recoveryScript = html.match(
    /<body>\s*<script>([\s\S]*?)<\/script>/,
  )?.[1];
  assert.ok(recoveryScript, 'recovery script was not found in index.html');

  const listeners = new Map();
  let replacedUrl = null;
  let cleanedUrl = null;
  const location = {
    origin: 'https://dtwiki.org',
    href,
    replace(url) {
      replacedUrl = String(url);
    },
  };
  const context = {
    URL,
    HTMLScriptElement: class HTMLScriptElement {},
    fetch: async () => ({
      ok: true,
      json: async () => ({ buildId: deployedBuild }),
    }),
    window: {
      location,
      history: {
        replaceState(_state, _unused, url) {
          cleanedUrl = String(url);
        },
      },
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
    },
  };

  vm.runInNewContext(recoveryScript, context);
  await new Promise((resolve) => setImmediate(resolve));

  return { cleanedUrl, listeners, replacedUrl };
}

test('build metadata is injected as safe JavaScript string values', () => {
  const html = 'var build = __DT_BUILD_ID__; var base = __DT_APP_BASE__;';

  assert.equal(
    injectBuildMetadata(html, "build'id", '/wiki/'),
    `var build = "build'id"; var base = "/wiki/";`,
  );
});

test('CI run identity takes precedence and local builds remain stable', () => {
  assert.equal(
    resolveBuildId({
      VITE_BUILD_ID: 'commit-run-attempt',
      GITHUB_RUN_ID: 'run',
      GITHUB_SHA: 'commit',
    }),
    'commit-run-attempt',
  );
  assert.equal(resolveBuildId({}), 'development');
});

test('build version plugin emits the deployed version marker', () => {
  const emitted = [];
  const plugin = buildVersionPlugin('build-123', '/');

  plugin.generateBundle.call({
    emitFile(file) {
      emitted.push(file);
    },
  });

  assert.deepEqual(emitted, [
    {
      type: 'asset',
      fileName: 'version.json',
      source: '{"buildId":"build-123"}\n',
    },
  ]);
});

test('stale pages automatically request the current deployed build', async () => {
  const result = await runBuildRecovery({
    currentBuild: 'old-build',
    deployedBuild: 'new-build',
    href: 'https://dtwiki.org/characters/loki_ssr_ex?tab=builds',
  });

  assert.equal(
    result.replacedUrl,
    'https://dtwiki.org/characters/loki_ssr_ex?tab=builds&__dt_build=new-build',
  );
  assert.ok(result.listeners.has('vite:preloadError'));
  assert.ok(result.listeners.has('error'));
});

test('current pages remove the temporary recovery parameter', async () => {
  const result = await runBuildRecovery({
    currentBuild: 'new-build',
    deployedBuild: 'new-build',
    href: 'https://dtwiki.org/events?__dt_build=new-build',
  });

  assert.equal(result.replacedUrl, null);
  assert.equal(result.cleanedUrl, 'https://dtwiki.org/events');
});
