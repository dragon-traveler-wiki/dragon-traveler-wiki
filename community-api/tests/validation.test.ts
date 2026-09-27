import { describe, expect, it } from 'vitest';
import { parsePayload, slugify } from '../src/validation';

describe('community payload validation', () => {
  it('accepts a valid team and rejects duplicate positions', () => {
    const base = {
      name: 'Test Team',
      content_type: 'PvE',
      faction: 'arcane_wisdom',
      members: [
        { character_slug: 'zeus_ssr_ex', position: { row: 0, col: 0 } },
      ],
    };
    expect(parsePayload('team', base).name).toBe('Test Team');
    expect(() =>
      parsePayload('team', {
        ...base,
        members: [
          ...base.members,
          { character_slug: 'loki_ssr_ex', position: { row: 0, col: 0 } },
        ],
      }),
    ).toThrow(/positions/i);
  });

  it('requires tier entries to match the declared entity type', () => {
    expect(() =>
      parsePayload('tier_list', {
        name: 'Bad list',
        entity_type: 'noble_phantasm',
        content_type: 'All',
        tiers: [{ name: 'S' }],
        entries: [{ character_slug: 'zeus_ssr_ex', tier: 'S' }],
      }),
    ).toThrow(/entity type/i);
  });

  it('creates safe cosmetic slugs', () => {
    expect(slugify('  S+ PvE Teams! ')).toBe('s_pve_teams');
  });
});
