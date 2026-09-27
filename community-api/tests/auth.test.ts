import { describe, expect, it } from 'vitest';
import { isModerator } from '../src/auth';
import type { Env } from '../src/types';

function envWith(moderatorIdentities: string): Env {
  return { MODERATOR_IDENTITIES: moderatorIdentities } as Env;
}

describe('isModerator', () => {
  it('matches an exact provider:id pair', () => {
    const env = envWith('github:123,discord:456');
    expect(isModerator(env, 'github', '123')).toBe(true);
    expect(isModerator(env, 'discord', '456')).toBe(true);
  });

  it('rejects a non-matching id on the same provider', () => {
    const env = envWith('github:123');
    expect(isModerator(env, 'github', '999')).toBe(false);
  });

  it('does not cross-match providers', () => {
    const env = envWith('github:123');
    expect(isModerator(env, 'discord', '123')).toBe(false);
  });

  it('tolerates whitespace around entries', () => {
    const env = envWith(' github:123 , discord:456 ');
    expect(isModerator(env, 'github', '123')).toBe(true);
    expect(isModerator(env, 'discord', '456')).toBe(true);
  });

  it('returns false when the list is empty', () => {
    const env = envWith('');
    expect(isModerator(env, 'github', '123')).toBe(false);
  });
});
