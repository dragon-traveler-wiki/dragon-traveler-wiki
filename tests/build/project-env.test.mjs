import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { loadProjectEnv } from '../../scripts/project-env.mjs';

test('project env loads local files relative to the project root', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'dragon-traveler-wiki-'));
  try {
    await writeFile(
      path.join(root, '.env.local'),
      'DATA_DIR=../data-repo/data\nASSETS_DIR=../data-repo/assets\n',
    );
    const result = loadProjectEnv('development', root);
    assert.equal(result.dataDir, path.resolve(root, '../data-repo/data'));
    assert.equal(result.assetsDir, path.resolve(root, '../data-repo/assets'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
