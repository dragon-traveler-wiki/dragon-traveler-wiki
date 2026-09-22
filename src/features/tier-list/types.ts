import type { ContentType } from '@/constants/content-types';
import type { Character } from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { Quality } from '@/types/quality';
import type { CommunityMeta } from '@/features/community/types';

export type Tier = string;
export type TierListEntityType = 'character' | 'noble_phantasm';

export interface TierDefinition {
  name: string;
  note?: string;
}

export interface CharacterTierEntry {
  character_slug: string;
  character_quality?: Quality;
  tier: Tier;
  note?: string;
}

export interface NoblePhantasmTierEntry {
  noble_phantasm_slug: string;
  tier: Tier;
  note?: string;
}

export type TierEntry = CharacterTierEntry | NoblePhantasmTierEntry;

export interface TierList {
  name: string;
  slug: string;
  /** Missing on legacy character tier lists and saved drafts. */
  entity_type?: TierListEntityType;
  author?: string;
  content_type: ContentType;
  description?: string;
  /** Custom tier order and notes. Defaults to S+/S/A/B/C/D if absent. */
  tiers?: TierDefinition[];
  entries: TierEntry[];
  last_updated: number;
  community?: CommunityMeta;
}

export interface TierListRankableEntity {
  key: string;
  entityType: TierListEntityType;
  character?: Character;
  noblePhantasm?: NoblePhantasm;
}

export function getTierListEntityType(
  tierList: Pick<TierList, 'entity_type'>,
): TierListEntityType {
  return tierList.entity_type ?? 'character';
}

export function isCharacterTierEntry(
  entry: TierEntry,
): entry is CharacterTierEntry {
  return 'character_slug' in entry;
}

export function isNoblePhantasmTierEntry(
  entry: TierEntry,
): entry is NoblePhantasmTierEntry {
  return 'noble_phantasm_slug' in entry;
}

export function getTierEntrySlug(entry: TierEntry): string {
  return isNoblePhantasmTierEntry(entry)
    ? entry.noble_phantasm_slug
    : entry.character_slug;
}
