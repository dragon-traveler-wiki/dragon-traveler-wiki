import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const sourceRoot = fileURLToPath(new URL('../../src', import.meta.url));
const sharedBoundaryPath = path.join(
  sourceRoot,
  'components',
  'ui',
  'ErrorBoundary.tsx',
);

async function findTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findTypeScriptFiles(entryPath)
        : /\.(?:ts|tsx)$/.test(entry.name)
          ? [entryPath]
          : [];
    }),
  );
  return files.flat();
}

test('shared error boundaries declare their visual and reset scope', async () => {
  const files = await findTypeScriptFiles(sourceRoot);
  let usageCount = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/<ErrorBoundary\b[\s\S]*?>/g)) {
      usageCount += 1;
      assert.match(match[0], /\bscope=/, `${file} is missing scope`);
      assert.match(match[0], /\bname=/, `${file} is missing name`);
      assert.match(match[0], /\bresetKeys=/, `${file} is missing resetKeys`);
    }

    if (file !== sharedBoundaryPath) {
      assert.doesNotMatch(
        source,
        /class\s+\w*ErrorBoundary\b/,
        `${file} defines a private error boundary`,
      );
    }
  }

  assert.ok(usageCount > 0, 'no shared error-boundary usages were found');
});
