import { useCallback, useMemo } from 'react';
import type { Character } from '@/features/characters/types';
import {
  getCharacterIdentityKey,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import {
  isCharacterTierEntry,
  isNoblePhantasmTierEntry,
  type TierList as TierListType,
  type TierListRankableEntity,
} from '@/features/tier-list/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';

export function useResolveTierEntryEntity(
  characterByName: Map<string, Character>,
  characterByIdentity: Map<string, Character>,
  noblePhantasms: NoblePhantasm[],
) {
  const noblePhantasmBySlug = useMemo(() => {
    const result = new Map(noblePhantasms.map((item) => [item.slug, item]));
    for (const item of noblePhantasms) {
      if (item.legacy_slug) result.set(item.legacy_slug, item);
    }
    return result;
  }, [noblePhantasms]);

  const resolveTierEntryCharacter = useCallback(
    (entry: TierListType['entries'][number]) =>
      isCharacterTierEntry(entry)
        ? resolveCharacterByNameAndQuality(
            entry.character_slug,
            entry.character_quality,
            characterByName,
            characterByIdentity,
          )
        : null,
    [characterByName, characterByIdentity],
  );

  return useCallback(
    (
      entry: TierListType['entries'][number],
    ): TierListRankableEntity | undefined => {
      if (isNoblePhantasmTierEntry(entry)) {
        const noblePhantasm = noblePhantasmBySlug.get(
          entry.noble_phantasm_slug,
        );
        return noblePhantasm
          ? {
              key: noblePhantasm.slug,
              entityType: 'noble_phantasm',
              noblePhantasm,
            }
          : undefined;
      }
      const character = resolveTierEntryCharacter(entry);
      return character
        ? {
            key: getCharacterIdentityKey(character),
            entityType: 'character',
            character,
          }
        : undefined;
    },
    [noblePhantasmBySlug, resolveTierEntryCharacter],
  );
}
