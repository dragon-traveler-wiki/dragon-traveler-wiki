import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers/harness';

let h: Harness;

beforeAll(async () => {
  h = await createHarness();
});

afterAll(async () => {
  await h.dispose();
});

describe('CORS', () => {
  it('echoes the origin back when it is allowed', async () => {
    const res = await h.request('/v1/health', {
      headers: { Origin: h.env.APP_ORIGIN },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      h.env.APP_ORIGIN,
    );
  });

  it('sends no Access-Control-Allow-Origin header for a disallowed origin', async () => {
    const res = await h.request('/v1/health', {
      headers: { Origin: 'https://evil.test' },
    });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
