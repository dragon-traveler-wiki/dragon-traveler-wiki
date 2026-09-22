import { z } from 'zod';
import type { CommunityKind, Env } from './types';

const slug = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_]+$/);
const quality = z.string().trim().min(1).max(20).optional();
const note = z.string().trim().max(500).optional();
const contentType = z.enum(['All', 'PvP', 'PvE', 'Boss']);

const teamMember = z.object({
  character_slug: slug,
  character_quality: quality,
  overdrive_order: z.number().int().min(1).max(6).nullable().optional(),
  note,
  position: z
    .object({
      row: z.number().int().min(0).max(2),
      col: z.number().int().min(0).max(2),
    })
    .optional(),
});

const teamSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    author: z.string().trim().max(100).optional(),
    content_type: contentType,
    description: z.string().trim().max(2000).optional(),
    faction: slug,
    members: z.array(teamMember).min(1).max(6),
    bench: z
      .array(
        z.object({ character_slug: slug, character_quality: quality, note }),
      )
      .max(12)
      .optional(),
    wyrmspells: z
      .object({
        breach: slug.optional(),
        refuge: slug.optional(),
        wildcry: slug.optional(),
        dragons_call: slug.optional(),
      })
      .optional(),
    last_updated: z.number().int().nonnegative().optional(),
  })
  .superRefine((team, ctx) => {
    const positions = team.members.flatMap((member) =>
      member.position ? [`${member.position.row}:${member.position.col}`] : [],
    );
    if (new Set(positions).size !== positions.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Team positions must be unique',
        path: ['members'],
      });
  });

const tierDefinition = z.object({
  name: z.string().trim().min(1).max(20),
  note,
});
const characterEntry = z.object({
  character_slug: slug,
  character_quality: quality,
  tier: z.string().trim().min(1).max(20),
  note,
});
const nobleEntry = z.object({
  noble_phantasm_slug: slug,
  tier: z.string().trim().min(1).max(20),
  note,
});

const tierListSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: slug.optional(),
    entity_type: z.enum(['character', 'noble_phantasm']).default('character'),
    author: z.string().trim().max(100).optional(),
    content_type: contentType,
    description: z.string().trim().max(2000).optional(),
    tiers: z.array(tierDefinition).min(1).max(20).optional(),
    entries: z
      .array(z.union([characterEntry, nobleEntry]))
      .min(1)
      .max(300),
    last_updated: z.number().int().nonnegative().optional(),
  })
  .superRefine((tierList, ctx) => {
    const names = tierList.tiers?.map((tier) => tier.name) ?? [
      'S+',
      'S',
      'A',
      'B',
      'C',
      'D',
    ];
    if (new Set(names).size !== names.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Tier names must be unique',
        path: ['tiers'],
      });
    const validTiers = new Set(names);
    const identities = new Set<string>();
    tierList.entries.forEach((entry, index) => {
      if (!validTiers.has(entry.tier))
        ctx.addIssue({
          code: 'custom',
          message: 'Entry references an unknown tier',
          path: ['entries', index, 'tier'],
        });
      const isCharacter = 'character_slug' in entry;
      if ((tierList.entity_type === 'character') !== isCharacter)
        ctx.addIssue({
          code: 'custom',
          message: 'Entry type does not match tier list entity type',
          path: ['entries', index],
        });
      const identity = isCharacter
        ? `${entry.character_slug}:${entry.character_quality ?? ''}`
        : entry.noble_phantasm_slug;
      if (identities.has(identity))
        ctx.addIssue({
          code: 'custom',
          message: 'Duplicate entity',
          path: ['entries', index],
        });
      identities.add(identity);
    });
  });

export type TeamPayload = z.infer<typeof teamSchema>;
export type TierListPayload = z.infer<typeof tierListSchema>;
export type CommunityPayload = TeamPayload | TierListPayload;

export function parsePayload(
  kind: CommunityKind,
  value: unknown,
): CommunityPayload {
  return (kind === 'team' ? teamSchema : tierListSchema).parse(value);
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'item'
  );
}

interface CatalogEntry {
  slug?: string;
  quality?: string;
}

async function fetchCatalog(env: Env, path: string): Promise<CatalogEntry[]> {
  const url = `${env.CATALOG_BASE_URL.replace(/\/$/, '')}/${path}`;
  const response = await fetch(url, {
    cf: { cacheTtl: 300, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`Catalog unavailable: ${path}`);
  const value: unknown = await response.json();
  if (!Array.isArray(value))
    throw new Error(`Invalid catalog response: ${path}`);
  return value as CatalogEntry[];
}

export async function validateCatalogReferences(
  env: Env,
  kind: CommunityKind,
  payload: CommunityPayload,
): Promise<void> {
  const [characters, noblePhantasms, wyrmspells, factions] = await Promise.all([
    fetchCatalog(env, 'enUS/characters.json'),
    kind === 'tier_list'
      ? fetchCatalog(env, 'enUS/noble-phantasm.json')
      : Promise.resolve([]),
    kind === 'team'
      ? fetchCatalog(env, 'enUS/wyrmspells.json')
      : Promise.resolve([]),
    kind === 'team'
      ? fetchCatalog(env, 'enUS/factions.json')
      : Promise.resolve([]),
  ]);
  const characterKeys = new Set(
    characters.map((entry) => `${entry.slug}:${entry.quality ?? ''}`),
  );
  const characterSlugs = new Set(characters.map((entry) => entry.slug));
  const checkCharacter = (entry: {
    character_slug: string;
    character_quality?: string;
  }) => {
    const valid = entry.character_quality
      ? characterKeys.has(`${entry.character_slug}:${entry.character_quality}`)
      : characterSlugs.has(entry.character_slug);
    if (!valid)
      throw new Error(`Unknown character reference: ${entry.character_slug}`);
  };
  if (kind === 'team') {
    const team = payload as TeamPayload;
    [...team.members, ...(team.bench ?? [])].forEach(checkCharacter);
    const factionSlugs = new Set(factions.map((entry) => entry.slug));
    if (!factionSlugs.has(team.faction))
      throw new Error(`Unknown faction reference: ${team.faction}`);
    const spellSlugs = new Set(wyrmspells.map((entry) => entry.slug));
    Object.values(team.wyrmspells ?? {}).forEach((value) => {
      if (value && !spellSlugs.has(value))
        throw new Error(`Unknown wyrmspell reference: ${value}`);
    });
    return;
  }
  const tierList = payload as TierListPayload;
  const nobleSlugs = new Set(noblePhantasms.map((entry) => entry.slug));
  tierList.entries.forEach((entry) => {
    if ('character_slug' in entry) checkCharacter(entry);
    else if (!nobleSlugs.has(entry.noble_phantasm_slug))
      throw new Error(
        `Unknown Noble Phantasm reference: ${entry.noble_phantasm_slug}`,
      );
  });
}
