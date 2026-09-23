import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, routeKind } from '../src/index';

describe('cursor encoding', () => {
  it('round-trips score, created_at, and id', () => {
    const row = { score: 42, created_at: 1_700_000_000, id: 'abc-123' };
    const cursor = encodeCursor(row);
    expect(decodeCursor(cursor)).toEqual([row.score, row.created_at, row.id]);
  });

  it('produces a URL-safe cursor with no padding', () => {
    const cursor = encodeCursor({
      score: 0,
      created_at: 0,
      id: 'id-with-special-000',
    });
    expect(cursor).not.toMatch(/[+/=]/);
  });

  it('returns null for a missing cursor', () => {
    expect(decodeCursor(undefined)).toBeNull();
  });

  it('returns null for a malformed cursor', () => {
    expect(decodeCursor('not-valid-base64!!')).toBeNull();
  });

  it('returns null for a well-formed but wrong-shaped payload', () => {
    const bogus = btoa(JSON.stringify([1, 2]))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
    expect(decodeCursor(bogus)).toBeNull();
  });
});

describe('routeKind', () => {
  it('maps teams and tier-lists to their kind', () => {
    expect(routeKind('teams')).toBe('team');
    expect(routeKind('tier-lists')).toBe('tier_list');
  });

  it('throws a 404 HTTPException for an unknown collection', () => {
    expect(() => routeKind('bogus')).toThrow();
  });
});
