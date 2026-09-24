import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const SOURCE_ROOT = path.resolve('src');
const SOURCE_EXTENSION = /\.(?:ts|tsx)$/;
const IMPORT_SPECIFIER =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listSourceFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat().filter((file) => SOURCE_EXTENSION.test(file));
}

function resolveSourceImport(importer, specifier, sourceFiles) {
  let basePath;
  if (specifier.startsWith('@/')) {
    basePath = path.join(SOURCE_ROOT, specifier.slice(2));
  } else if (specifier.startsWith('.')) {
    basePath = path.resolve(path.dirname(importer), specifier);
  } else {
    return null;
  }

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  return candidates.find((candidate) => sourceFiles.has(candidate)) ?? null;
}

test('source modules do not contain circular imports', async () => {
  const files = await listSourceFiles(SOURCE_ROOT);
  const sourceFiles = new Set(files.map((file) => path.normalize(file)));
  const graph = new Map();

  for (const file of sourceFiles) {
    const source = await readFile(file, 'utf8');
    const dependencies = [...source.matchAll(IMPORT_SPECIFIER)]
      .map((match) => resolveSourceImport(file, match[1], sourceFiles))
      .filter(Boolean);
    graph.set(file, dependencies);
  }

  const visited = new Set();
  const active = new Set();
  const stack = [];

  function visit(file) {
    if (active.has(file)) {
      const cycleStart = stack.indexOf(file);
      const cycle = [...stack.slice(cycleStart), file]
        .map((entry) => path.relative(SOURCE_ROOT, entry).replaceAll('\\', '/'))
        .join(' -> ');
      assert.fail(`Circular import detected: ${cycle}`);
    }
    if (visited.has(file)) return;

    active.add(file);
    stack.push(file);
    for (const dependency of graph.get(file) ?? []) visit(dependency);
    stack.pop();
    active.delete(file);
    visited.add(file);
  }

  for (const file of sourceFiles) visit(file);
});
