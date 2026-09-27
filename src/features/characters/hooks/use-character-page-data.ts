import { useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { GEAR_TYPE_ICON_MAP, getGearIcon, getPortrait } from '@/assets';
import { getSubclassIcon } from '@/assets';
import {
  CharacterOwnershipContext,
  TierListReferenceContext,
} from '@/contexts';
import type { ChangesFile } from '@/types/changes';
import type {
  ActivatedSetBonus,
  Character,
  RecommendedGearDetail,
  RecommendedGearEntry,
  RecommendedGearLoadout,
  RecommendedGearLoadoutData,
  RecommendedGearSlot,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { Gear, GearSet } from '@/features/wiki/gear/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import type { Team } from '@/features/teams/types';
import {
  getTierListEntityType,
  isCharacterTierEntry,
} from '@/features/tier-list/types';
import {
  getCharacterIdentityKey,
  getCharacterRoutePath,
  getCharacterRouteSlug,
  resolveCharacterRoute,
} from '@/features/characters/utils/character-route';
import { compareCharactersByQualityThenName } from '@/features/characters/filters';
import { useCharacterResolution } from './use-character-resolution';
import { useCharacterChanges, useCharacters } from './use-characters-data';
import { useTeams } from '@/features/teams/hooks/use-teams-data';
import {
  useGear,
  useGearSets,
  useNoblePhantasms,
  useStatusEffects,
  useSubclasses,
} from '@/features/wiki/hooks/use-wiki-data';

const GEAR_SLOT_CONFIG: Array<{
  slot: RecommendedGearSlot;
  label: string;
  type: RecommendedGearEntry['type'];
  fallbackIcon: string;
}> = [
  {
    slot: 'headgear',
    label: 'Headgear',
    type: 'Headgear',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Headgear,
  },
  {
    slot: 'chestplate',
    label: 'Chestplate',
    type: 'Chestplate',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Chestplate,
  },
  {
    slot: 'bracers',
    label: 'Bracers',
    type: 'Bracers',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Bracers,
  },
  {
    slot: 'boots',
    label: 'Boots',
    type: 'Boots',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Boots,
  },
  {
    slot: 'weapon',
    label: 'Weapon',
    type: 'Weapon',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Weapon,
  },
  {
    slot: 'accessory',
    label: 'Accessory',
    type: 'Accessory',
    fallbackIcon: GEAR_TYPE_ICON_MAP.Accessory,
  },
];

export interface CharacterPageData {
  loading: boolean;
  character: Character | null | undefined;
  sameNameVariants: Character[];
  routeBaseSlug: string | null;
  characterAssetKey: string | undefined;
  isPreferredCharacterForNameReferences: boolean;
  tierLabel: string | null;
  tierListCharacterNote: string | null;
  selectedTierListName: string | null;
  linkedNoblePhantasms: NoblePhantasm[];
  subclassBySlug: Map<string, Subclass>;
  recommendedGearLoadouts: RecommendedGearLoadoutData[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  teams: Team[];
  statusEffects: StatusEffect[];
  changesData: ChangesFile;
  previousCharacter: Character | null;
  nextCharacter: Character | null;
  orderedCharacters: Character[];
}

export function useCharacterPageData(
  name: string | undefined,
): CharacterPageData {
  const navigate = useNavigate();
  const { selectedTierList: referenceTierList } = useContext(
    TierListReferenceContext,
  );
  const selectedTierListName = referenceTierList?.name ?? null;
  const { showCharacterTiers } = useContext(CharacterOwnershipContext);

  const { data: characters, loading } = useCharacters();
  const { data: statusEffects } = useStatusEffects();
  const { data: noblePhantasms } = useNoblePhantasms();
  const { data: subclasses } = useSubclasses();
  const { data: gear } = useGear();
  const { data: gearSets } = useGearSets();
  const { data: teams } = useTeams();
  const { data: changesData } = useCharacterChanges();

  const {
    preferredByName: preferredCharacterByName,
    byIdentity: characterByIdentity,
  } = useCharacterResolution(characters);

  const routeMatch = useMemo(
    () => resolveCharacterRoute(characters, name),
    [characters, name],
  );

  const character = routeMatch.character;

  const sameNameVariants = useMemo(
    () => [...routeMatch.variants].sort(compareCharactersByQualityThenName),
    [routeMatch.variants],
  );

  useEffect(() => {
    if (!name) return;

    if (character) {
      const canonicalSlug = getCharacterRouteSlug(character);
      if (routeMatch.incomingSlug === canonicalSlug) return;
      navigate(`/characters/${canonicalSlug}`, { replace: true });
      return;
    }

    if (sameNameVariants.length > 1 && routeMatch.baseSlug) {
      if (routeMatch.incomingSlug === routeMatch.baseSlug) return;
      navigate(`/characters/${routeMatch.baseSlug}`, { replace: true });
    }
  }, [
    character,
    name,
    navigate,
    routeMatch.baseSlug,
    routeMatch.incomingSlug,
    sameNameVariants.length,
  ]);

  const selectedTierList = useMemo(
    () =>
      referenceTierList &&
      getTierListEntityType(referenceTierList) === 'character'
        ? referenceTierList
        : null,
    [referenceTierList],
  );

  const isPreferredCharacterForNameReferences = useMemo(() => {
    if (!character) return false;
    const preferred = preferredCharacterByName.get(character.name);
    if (!preferred) return false;
    return (
      getCharacterIdentityKey(preferred) === getCharacterIdentityKey(character)
    );
  }, [character, preferredCharacterByName]);

  const selectedTierListEntry = useMemo(() => {
    if (
      !selectedTierList ||
      !character ||
      !isPreferredCharacterForNameReferences
    )
      return null;
    return (
      selectedTierList.entries.find(
        (entry) =>
          isCharacterTierEntry(entry) &&
          characterByIdentity.get(entry.character_slug) === character,
      ) ?? null
    );
  }, [
    selectedTierList,
    character,
    characterByIdentity,
    isPreferredCharacterForNameReferences,
  ]);

  const tierLabel = useMemo(() => {
    if (
      !showCharacterTiers ||
      !selectedTierListName ||
      !selectedTierList ||
      !character
    )
      return null;
    return selectedTierListEntry?.tier ?? 'N/A';
  }, [
    showCharacterTiers,
    selectedTierListName,
    selectedTierList,
    selectedTierListEntry,
    character,
  ]);

  const tierListCharacterNote = useMemo(() => {
    const note = selectedTierListEntry?.note?.trim();
    return note ? note : null;
  }, [selectedTierListEntry]);

  // Match list page order: sort by quality, then name
  const orderedCharacters = useMemo(
    () => [...characters].sort(compareCharactersByQualityThenName),
    [characters],
  );

  const characterIndex = useMemo(() => {
    if (!character) return -1;
    const identity = getCharacterIdentityKey(character);
    return orderedCharacters.findIndex(
      (entry) => getCharacterIdentityKey(entry) === identity,
    );
  }, [orderedCharacters, character]);

  const previousCharacter =
    characterIndex > 0 ? orderedCharacters[characterIndex - 1] : null;
  const nextCharacter =
    characterIndex >= 0 && characterIndex < orderedCharacters.length - 1
      ? orderedCharacters[characterIndex + 1]
      : null;

  const characterAssetKey = useMemo(() => {
    if (!character) return undefined;
    return getCharacterRouteSlug(character);
  }, [character]);

  const linkedNoblePhantasms = useMemo(() => {
    const references = character?.recommended_noble_phantasm ?? [];
    const noblePhantasmByReference = new Map(
      noblePhantasms.flatMap((noblePhantasm) => [
        [noblePhantasm.slug, noblePhantasm] as const,
        ...(noblePhantasm.legacy_slug
          ? ([[noblePhantasm.legacy_slug, noblePhantasm]] as const)
          : []),
      ]),
    );

    return references.flatMap((reference) => {
      const noblePhantasm = noblePhantasmByReference.get(reference);
      return noblePhantasm ? [noblePhantasm] : [];
    });
  }, [character, noblePhantasms]);

  const subclassBySlug = useMemo(() => {
    const map = new Map<string, Subclass>();
    for (const subclass of subclasses) {
      map.set(subclass.slug, subclass);
    }
    return map;
  }, [subclasses]);

  const recommendedSubclassEntries = useMemo<RecommendedSubclassEntry[]>(() => {
    return (character?.recommended_subclasses ?? [])
      .map((subclassSlug) => subclassSlug.trim())
      .filter((subclassSlug) => subclassSlug.length > 0)
      .map((subclassSlug) => {
        const details = subclassBySlug.get(subclassSlug);
        return {
          name: details?.name ?? subclassSlug,
          icon: getSubclassIcon(details?.slug ?? subclassSlug, details?.class),
          tier: details?.tier,
          className: details?.class,
          bonuses: details?.bonuses ?? [],
          effect: details?.effect,
        };
      });
  }, [character, subclassBySlug]);

  const gearBySlug = useMemo(() => {
    const map = new Map<string, Gear>();
    for (const item of gear) {
      map.set(item.slug, item);
    }
    return map;
  }, [gear]);

  const gearSetByName = useMemo(() => {
    const map = new Map<string, GearSet>();
    for (const item of gearSets) {
      map.set(item.slug, item);
    }
    return map;
  }, [gearSets]);

  const resolveLoadoutDetails = useCallback(
    (loadout: RecommendedGearLoadout): RecommendedGearDetail[] => {
      const entries: Array<
        RecommendedGearEntry & { label: string; icon: string; slotIcon: string }
      > = [];
      for (const cfg of GEAR_SLOT_CONFIG) {
        const gearSlug = (loadout.slots[cfg.slot] ?? '').trim();
        if (!gearSlug) continue;
        entries.push({
          slot: cfg.slot,
          type: cfg.type,
          name: gearSlug,
          label: cfg.label,
          icon: getGearIcon(cfg.type, gearSlug) ?? cfg.fallbackIcon,
          slotIcon: cfg.fallbackIcon,
        });
      }
      return entries.map((entry) => {
        const gearItem = gearBySlug.get(entry.name);
        const setName = gearItem?.set?.trim() ?? '';
        const setData = setName ? gearSetByName.get(setName) : null;
        const setBonus = setData?.set_bonus ?? gearItem?.set_bonus ?? null;
        return {
          ...entry,
          name: gearItem?.name ?? entry.name,
          setName: setName || null,
          setDisplayName: setData?.name ?? null,
          setBonus,
          quality: gearItem?.quality,
          lore: gearItem?.lore,
          stats: gearItem?.stats,
        };
      });
    },
    [gearBySlug, gearSetByName],
  );

  const resolveActivatedSetBonuses = useCallback(
    (details: RecommendedGearDetail[]): ActivatedSetBonus[] => {
      const sets = new Map<
        string,
        {
          setName: string;
          setDisplayName: string | null;
          pieces: number;
          requiredPieces: number;
          description: string;
        }
      >();

      for (const entry of details) {
        if (!entry.setName) continue;
        const key = entry.setName.toLowerCase();
        const existing = sets.get(key);
        const requiredPieces = entry.setBonus?.quantity ?? 0;
        const description = (entry.setBonus?.description ?? '').trim();

        if (!existing) {
          sets.set(key, {
            setName: entry.setName,
            setDisplayName: entry.setDisplayName,
            pieces: 1,
            requiredPieces,
            description,
          });
        } else {
          existing.pieces += 1;
          if (existing.requiredPieces <= 0 && requiredPieces > 0)
            existing.requiredPieces = requiredPieces;
          if (!existing.description && description)
            existing.description = description;
        }
      }

      return [...sets.values()]
        .map((entry) => ({
          ...entry,
          activations:
            entry.requiredPieces > 0
              ? Math.floor(entry.pieces / entry.requiredPieces)
              : 0,
        }))
        .filter(
          (entry) => entry.activations > 0 && entry.description.length > 0,
        )
        .sort((a, b) => {
          if (b.activations !== a.activations)
            return b.activations - a.activations;
          if (b.pieces !== a.pieces) return b.pieces - a.pieces;
          return a.setName.localeCompare(b.setName);
        });
    },
    [],
  );

  const recommendedGearLoadouts = useMemo<RecommendedGearLoadoutData[]>(() => {
    const loadouts = character?.recommended_gear ?? [];
    return loadouts.map((loadout) => {
      const details = resolveLoadoutDetails(loadout);
      return {
        loadout,
        details,
        activatedSetBonuses: resolveActivatedSetBonuses(details),
      };
    });
  }, [character, resolveLoadoutDetails, resolveActivatedSetBonuses]);

  return {
    loading,
    character,
    sameNameVariants,
    routeBaseSlug: routeMatch.baseSlug,
    characterAssetKey,
    isPreferredCharacterForNameReferences,
    tierLabel,
    tierListCharacterNote,
    selectedTierListName,
    linkedNoblePhantasms,
    subclassBySlug,
    recommendedGearLoadouts,
    recommendedSubclassEntries,
    teams,
    statusEffects,
    changesData,
    previousCharacter,
    nextCharacter,
    orderedCharacters,
  };
}

/** Returns the route paths for prev/next character navigation. */
export function getCharacterNavPaths(
  previousCharacter: Character | null,
  nextCharacter: Character | null,
  getDisplaySkin: (characterSlug: string) => string = () => 'default',
) {
  return {
    previousItem: previousCharacter
      ? {
          label: previousCharacter.name,
          path: getCharacterRoutePath(previousCharacter),
          iconSrc: getPortrait(
            previousCharacter.slug,
            previousCharacter.slug,
            getDisplaySkin(previousCharacter.slug),
          ),
        }
      : null,
    nextItem: nextCharacter
      ? {
          label: nextCharacter.name,
          path: getCharacterRoutePath(nextCharacter),
          iconSrc: getPortrait(
            nextCharacter.slug,
            nextCharacter.slug,
            getDisplaySkin(nextCharacter.slug),
          ),
        }
      : null,
  };
}
