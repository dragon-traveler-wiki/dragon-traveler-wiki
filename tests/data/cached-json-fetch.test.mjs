import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearCachedJson,
  fetchJsonCached,
  hasCachedJson,
} from '../../src/utils/cached-json-fetch.ts';

test('cached JSON requests share in-flight work and retain successful data', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
    clearCachedJson('shared.json');
  });

  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({ value: 1 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const firstRequest = fetchJsonCached('shared.json', '/shared.json');
  const secondRequest = fetchJsonCached('shared.json', '/shared.json');
  assert.deepEqual(await Promise.all([firstRequest, secondRequest]), [
    { value: 1 },
    { value: 1 },
  ]);
  assert.deepEqual(
    await fetchJsonCached('shared.json', '/different-url.json'),
    { value: 1 },
  );
  assert.equal(fetchCount, 1);
  assert.equal(hasCachedJson('shared.json'), true);
});

test('clearing cached JSON retries the source and failures remain retryable', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
    clearCachedJson('retry.json');
  });

  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    if (fetchCount === 1) {
      return new Response(null, { status: 503, statusText: 'Unavailable' });
    }
    return new Response(JSON.stringify({ recovered: true }), { status: 200 });
  };

  await assert.rejects(
    fetchJsonCached('retry.json', '/retry.json'),
    /HTTP 503: Unavailable/,
  );
  assert.equal(hasCachedJson('retry.json'), false);
  assert.deepEqual(await fetchJsonCached('retry.json', '/retry.json'), {
    recovered: true,
  });
  assert.equal(fetchCount, 2);

  clearCachedJson('retry.json');
  await fetchJsonCached('retry.json', '/retry.json');
  assert.equal(fetchCount, 3);
});
