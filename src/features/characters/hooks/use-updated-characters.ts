import {
  useCharacterChanges,
  useCharacters,
} from '@/features/characters/hooks/use-characters-data';
import { getNewestUpdatedCharacterKeys } from '@/features/characters/utils/new-character-keys';
import { useMemo } from 'react';

/**
 * Returns the active character slugs whose most recent content edit falls in
 * the newest such batch. `newCharacterKeys` is excluded so a character
 * doesn't get both the "new" and "updated" badge at once.
 */
export function useUpdatedCharacters(
  newCharacterKeys: ReadonlySet<string>,
): Set<string> {
  const { data: changes } = useCharacterChanges();
  const { data: characters } = useCharacters();

  return useMemo(
    () =>
      getNewestUpdatedCharacterKeys(
        changes,
        characters.map(({ slug }) => slug),
        newCharacterKeys,
      ),
    [changes, characters, newCharacterKeys],
  );
}
