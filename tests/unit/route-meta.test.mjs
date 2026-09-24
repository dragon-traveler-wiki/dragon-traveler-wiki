import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  ROUTE_CATALOG,
  ROUTE_META,
  getNavigationPatterns,
} from '../../src/constants/route-meta.ts';
import { LEGACY_ROUTE_ALIASES } from '../../scripts/generate-route-pages.mjs';

const normalizePattern = (pattern) => pattern.replace(/:[^/]+/g, ':param');

test('route metadata patterns are unique and complete', () => {
  const ids = ROUTE_CATALOG.map(({ id }) => id);
  const patterns = ROUTE_META.map(({ pattern }) => pattern);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(patterns).size, patterns.length);
  for (const { pattern, meta } of ROUTE_META) {
    assert.ok(pattern.length > 0);
    assert.ok(meta.title.length > 0);
    assert.ok(meta.description.length > 0);
  }
});

test('every metadata route has a matching application route', async () => {
  const source = await readFile('src/routes/AppRoutes.tsx', 'utf8');
  const applicationRouteIds = new Set(
    [...source.matchAll(/<Route\s+path=\{ROUTE_PATH\.([A-Za-z]+)\}/g)].map(
      (match) => match[1],
    ),
  );

  for (const { id } of ROUTE_CATALOG) {
    assert.ok(applicationRouteIds.has(id), `Missing route id: ${id}`);
  }
});

test('every application content route has metadata or a documented fallback', async () => {
  const source = await readFile('src/routes/AppRoutes.tsx', 'utf8');
  const applicationPatterns = [
    ...source.matchAll(/<Route\s+path="([^"]+)"/g),
  ].map((match) => normalizePattern(match[1]));
  const metadataPatterns = new Set(
    ROUTE_META.map(({ pattern }) => normalizePattern(pattern)),
  );
  const supportedLegacyPatterns = new Set(['/useful-links', '/guides/*']);

  for (const pattern of applicationPatterns) {
    assert.ok(
      metadataPatterns.has(pattern) || supportedLegacyPatterns.has(pattern),
      `Application route has no embed policy: ${pattern}`,
    );
  }

  for (const [aliasPath, targetPath] of LEGACY_ROUTE_ALIASES) {
    assert.ok(
      metadataPatterns.has(targetPath),
      `Invalid alias target: ${targetPath}`,
    );
    assert.ok(aliasPath.startsWith('/'), `Invalid alias path: ${aliasPath}`);
  }
});

test('catalog navigation relationships and search entries are valid', () => {
  const routeIds = new Set(ROUTE_CATALOG.map(({ id }) => id));

  for (const route of ROUTE_CATALOG) {
    if ('navigationParent' in route) {
      assert.ok(routeIds.has(route.navigationParent));
      assert.ok(
        getNavigationPatterns(route.navigationParent).includes(route.pattern),
      );
    }
    if ('searchKeywords' in route) {
      assert.ok(!route.pattern.includes(':'));
      assert.ok(route.searchKeywords.length > 0);
    }
  }
});
