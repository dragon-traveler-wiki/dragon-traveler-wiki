import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withEdgeCache } from '../src/helpers';
import type { ApiContext } from '../src/helpers';

function fakeContext(
  cookieHeader: string | undefined,
  url = 'https://api.test/v1/teams',
) {
  const waitUntil = vi.fn();
  const context = {
    req: {
      url,
      header: (name: string) => (name === 'Cookie' ? cookieHeader : undefined),
    },
    executionCtx: { waitUntil },
  } as unknown as ApiContext;
  return { context, waitUntil };
}

describe('withEdgeCache', () => {
  let match: ReturnType<typeof vi.fn>;
  let put: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    match = vi.fn().mockResolvedValue(undefined);
    put = vi.fn().mockResolvedValue(undefined);
    // vi.stubGlobal (restored below) keeps this from leaking into other test
    // files sharing the same worker process — a plain `globalThis.caches = ...`
    // assignment would replace the real cache for everything else too.
    vi.stubGlobal('caches', { default: { match, put } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('never reads or writes the cache when a session cookie is present', async () => {
    const { context } = fakeContext('dt_session=abc123');
    const handler = vi
      .fn()
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }));

    const response = await withEdgeCache(context, 30, handler);

    expect(await response.text()).toBe('{"ok":true}');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(match).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('serves an anonymous request from the cache on a hit, without calling the handler', async () => {
    const cached = new Response('{"from":"cache"}', { status: 200 });
    match.mockResolvedValue(cached);
    const { context } = fakeContext(undefined);
    const handler = vi
      .fn()
      .mockResolvedValue(new Response('{"from":"handler"}', { status: 200 }));

    const response = await withEdgeCache(context, 30, handler);

    expect(await response.text()).toBe('{"from":"cache"}');
    expect(handler).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('runs the handler on a miss and stores the result with the given TTL', async () => {
    const { context, waitUntil } = fakeContext(undefined);
    const handler = vi
      .fn()
      .mockResolvedValue(new Response('{"from":"handler"}', { status: 200 }));

    const response = await withEdgeCache(context, 45, handler);

    expect(await response.text()).toBe('{"from":"handler"}');
    expect(handler).toHaveBeenCalledTimes(1);
    // put() is scheduled via waitUntil, not awaited inline.
    expect(waitUntil).toHaveBeenCalledTimes(1);
    await waitUntil.mock.calls[0][0];
    expect(put).toHaveBeenCalledTimes(1);
    const [, storedResponse] = put.mock.calls[0];
    expect(storedResponse.headers.get('Cache-Control')).toBe(
      'public, max-age=45',
    );
  });

  it('never caches a non-ok response', async () => {
    const { context, waitUntil } = fakeContext(undefined);
    const handler = vi
      .fn()
      .mockResolvedValue(new Response('{"error":"nope"}', { status: 404 }));

    const response = await withEdgeCache(context, 30, handler);

    expect(response.status).toBe(404);
    expect(waitUntil).not.toHaveBeenCalled();
    expect(put).not.toHaveBeenCalled();
  });

  it('still serves the fresh response if the cache itself throws', async () => {
    match.mockRejectedValue(new Error('cache unavailable'));
    put.mockRejectedValue(new Error('cache unavailable'));
    const { context } = fakeContext(undefined);
    const handler = vi
      .fn()
      .mockResolvedValue(new Response('{"ok":true}', { status: 200 }));

    const response = await withEdgeCache(context, 30, handler);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"ok":true}');
  });
});
