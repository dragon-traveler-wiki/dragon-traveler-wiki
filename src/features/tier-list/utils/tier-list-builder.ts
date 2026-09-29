import { normalizeContentType } from '../../../constants/content-types.ts';
import { DEFAULT_TIER_DEFINITIONS } from '../../../constants/tier-colors.ts';
import type { Quality } from '@/types/quality';
import type { TierList, TierListEntityType } from '@/features/tier-list/types';
import { normalizeOptionalNote } from '../../../utils/normalize-note.ts';
import { toQuality } from '../../../utils/quality.ts';
import { isRecord } from '../../../utils/type-guards.ts';
import { resolvePastedPatch } from '../../../utils/pasted-json.ts';
import { toEntitySlug } from '../../../utils/entity-slug.ts';

interface LegacyTierEntry {
  character_slug?: string;
  character_name?: string;
  character_quality?: Quality;
  noble_phantasm_slug?: string;
  tier: string;
  note?: string;
}

type TierListPatch = Partial<Omit<TierList, 'entries'>> & {
  entries?: LegacyTierEntry[];
};

export function isTierEntryLike(value: unknown): value is LegacyTierEntry {
  if (!isRecord(value)) return false;

  const hasSlug = typeof value.character_slug === 'string';
  const hasLegacyName = typeof value.character_name === 'string';
  const hasNoblePhantasmSlug = typeof value.noble_phantasm_slug === 'string';
  if (
    (!hasSlug && !hasLegacyName && !hasNoblePhantasmSlug) ||
    typeof value.tier !== 'string'
  ) {
    return false;
  }

  if (
    value.character_quality === undefined ||
    value.character_quality === null
  ) {
    return true;
  }

  return toQuality(value.character_quality) !== undefined;
}

export function getPastedTierListPatch(value: unknown): TierListPatch | null {
  // normalizeTierListFromPartial re-validates every field, so this cast is safe.
  return resolvePastedPatch(
    value,
    isTierEntryLike,
    'entries',
  ) as TierListPatch | null;
}

export function normalizeTierListFromPartial(
  partial: TierListPatch,
  fallback: TierList,
): TierList {
  const inferredEntityType: TierListEntityType =
    partial.entity_type === 'character' ||
    partial.entity_type === 'noble_phantasm'
      ? partial.entity_type
      : partial.entries && partial.entries.length > 0
        ? partial.entries.some(
            (entry) => typeof entry.noble_phantasm_slug === 'string',
          )
          ? 'noble_phantasm'
          : 'character'
        : (fallback.entity_type ?? 'character');
  const getEntryIdentity = (entry: {
    character_slug?: string;
    character_name?: string;
    character_quality?: string;
    noble_phantasm_slug?: string;
  }): string => {
    if (inferredEntityType === 'noble_phantasm') {
      return (entry.noble_phantasm_slug ?? '').toLowerCase();
    }
    const slug =
      entry.character_slug ?? toEntitySlug(entry.character_name ?? '');
    return `${slug}__${entry.character_quality ?? ''}`.toLowerCase();
  };

  const normalizedTiers = Array.isArray(partial.tiers)
    ? partial.tiers
        .filter(
          (tierDef) => isRecord(tierDef) && typeof tierDef.name === 'string',
        )
        .map((tierDef) => {
          const normalizedTierNote = normalizeOptionalNote(tierDef.note);
          return {
            name: tierDef.name,
            ...(normalizedTierNote ? { note: normalizedTierNote } : {}),
          };
        })
    : fallback.tiers;

  const normalizedEntries = Array.isArray(partial.entries)
    ? (() => {
        const seenEntities = new Set<string>();
        const entries: TierList['entries'] = [];
        for (const entry of partial.entries) {
          if (!isTierEntryLike(entry)) continue;
          if (
            inferredEntityType === 'noble_phantasm' &&
            typeof entry.noble_phantasm_slug !== 'string'
          ) {
            continue;
          }
          if (
            inferredEntityType === 'character' &&
            typeof entry.noble_phantasm_slug === 'string'
          ) {
            continue;
          }
          const identity = getEntryIdentity(entry);
          if (!identity || seenEntities.has(identity)) continue;
          seenEntities.add(identity);
          const normalizedEntryNote = normalizeOptionalNote(entry.note);
          if (inferredEntityType === 'noble_phantasm') {
            entries.push({
              noble_phantasm_slug: entry.noble_phantasm_slug as string,
              tier: entry.tier,
              ...(normalizedEntryNote ? { note: normalizedEntryNote } : {}),
            });
            continue;
          }
          const normalizedQuality = toQuality(entry.character_quality);
          const slug =
            entry.character_slug ?? toEntitySlug(entry.character_name ?? '');
          if (!slug) continue;
          entries.push({
            character_slug: slug,
            ...(normalizedQuality
              ? { character_quality: normalizedQuality }
              : {}),
            tier: entry.tier,
            ...(normalizedEntryNote ? { note: normalizedEntryNote } : {}),
          });
        }
        return entries;
      })()
    : fallback.entries;

  return {
    ...fallback,
    ...(typeof partial.name === 'string' ? { name: partial.name } : {}),
    slug:
      typeof partial.slug === 'string'
        ? partial.slug
        : fallback.slug ||
          toEntitySlug(
            typeof partial.name === 'string' ? partial.name : fallback.name,
          ),
    entity_type: inferredEntityType,
    ...(typeof partial.author === 'string' ? { author: partial.author } : {}),
    ...(typeof partial.description === 'string'
      ? { description: partial.description }
      : {}),
    content_type: normalizeContentType(
      partial.content_type,
      fallback.content_type,
    ),
    ...(normalizedTiers ? { tiers: normalizedTiers } : {}),
    entries: normalizedEntries,
    last_updated:
      typeof partial.last_updated === 'number'
        ? partial.last_updated
        : fallback.last_updated,
  };
}

const TIER_LIST_MIGRATION_FALLBACK: TierList = {
  name: '',
  slug: '',
  entity_type: 'character',
  author: '',
  content_type: 'All',
  description: '',
  tiers: DEFAULT_TIER_DEFINITIONS.map((t) => ({ name: t.name })),
  entries: [],
  last_updated: 0,
};

/** Migrates a stored tier list from any legacy format to the current schema. */
export function migrateStoredTierList(partial: Partial<TierList>): TierList {
  return normalizeTierListFromPartial(partial, TIER_LIST_MIGRATION_FALLBACK);
}
