import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useTeamsFull } from '@/features/teams/hooks/use-teams-data';
import { useTierListsFull } from '@/features/tier-list/hooks/use-tier-list-data';
import {
  useArtifacts,
  useCodes,
  useEvents,
  useGear,
  useHowlkins,
  useNoblePhantasms,
  useRelics,
  useResources,
  useStatusEffects,
  useSubclasses,
  useUsefulLinks,
  useWyrms,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import { createElement, useMemo, type ReactNode } from 'react';
import { SearchDataContext } from './search-data';

export function SearchDataProvider({ children }: { children: ReactNode }) {
  const characterResult = useCharacters();
  const artifactResult = useArtifacts();
  const gearResult = useGear();
  const howlkinResult = useHowlkins();
  const relicResult = useRelics();
  const resourceResult = useResources();
  const statusEffectResult = useStatusEffects();
  const subclassResult = useSubclasses();
  const wyrmspellResult = useWyrmspells();
  const noblePhantasmResult = useNoblePhantasms();
  const wyrmResult = useWyrms();
  const teamResult = useTeamsFull();
  const codeResult = useCodes();
  const eventResult = useEvents();
  const usefulLinkResult = useUsefulLinks();
  const tierListResult = useTierListsFull();

  const loading =
    characterResult.loading ||
    artifactResult.loading ||
    gearResult.loading ||
    howlkinResult.loading ||
    relicResult.loading ||
    resourceResult.loading ||
    statusEffectResult.loading ||
    subclassResult.loading ||
    wyrmspellResult.loading ||
    noblePhantasmResult.loading ||
    wyrmResult.loading ||
    teamResult.loading ||
    codeResult.loading ||
    eventResult.loading ||
    usefulLinkResult.loading ||
    tierListResult.loading;

  const characters = characterResult.data;
  const artifacts = artifactResult.data;
  const gear = gearResult.data;
  const howlkins = howlkinResult.data;
  const relics = relicResult.data;
  const resources = resourceResult.data;
  const statusEffects = statusEffectResult.data;
  const subclasses = subclassResult.data;
  const wyrmspells = wyrmspellResult.data;
  const noblePhantasms = noblePhantasmResult.data;
  const wyrms = wyrmResult.data;
  const teams = teamResult.data;
  const codes = codeResult.data;
  const events = eventResult.data;
  const usefulLinks = usefulLinkResult.data;
  const tierLists = tierListResult.data;

  const value = useMemo(
    () => ({
      characters,
      artifacts,
      gear,
      howlkins,
      relics,
      resources,
      statusEffects,
      subclasses,
      wyrms,
      wyrmspells,
      noblePhantasms,
      teams,
      codes,
      events,
      usefulLinks,
      tierLists,
      loading,
      errors: [
        characterResult.error,
        artifactResult.error,
        gearResult.error,
        howlkinResult.error,
        relicResult.error,
        resourceResult.error,
        statusEffectResult.error,
        subclassResult.error,
        wyrmspellResult.error,
        noblePhantasmResult.error,
        wyrmResult.error,
        teamResult.error,
        codeResult.error,
        eventResult.error,
        usefulLinkResult.error,
        tierListResult.error,
      ].filter((e): e is Error => e !== null),
    }),
    [
      characters,
      artifacts,
      gear,
      howlkins,
      relics,
      resources,
      statusEffects,
      subclasses,
      wyrms,
      wyrmspells,
      noblePhantasms,
      teams,
      codes,
      events,
      usefulLinks,
      tierLists,
      loading,
      characterResult.error,
      artifactResult.error,
      gearResult.error,
      howlkinResult.error,
      relicResult.error,
      resourceResult.error,
      statusEffectResult.error,
      subclassResult.error,
      wyrmspellResult.error,
      noblePhantasmResult.error,
      wyrmResult.error,
      teamResult.error,
      codeResult.error,
      eventResult.error,
      usefulLinkResult.error,
      tierListResult.error,
    ],
  );

  return createElement(SearchDataContext.Provider, { value }, children);
}
