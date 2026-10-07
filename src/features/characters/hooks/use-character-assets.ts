import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCharacterSkillIcon,
  getCharacterSkinAsset,
  getTalentIcon,
  probeIllustrations,
  resolveManifestIllustrations,
  resolveIllustrations,
  type Illustration,
} from '@/assets';
import type { Character } from '@/features/characters/types';
import { CharacterSkinContext } from '@/contexts';
import { useAssetManifest } from '@/hooks/use-asset-manifest';

const EMPTY_SKILL_ICONS = new Map<string, string>();

interface UseCharacterAssetsResult {
  illustrations: Illustration[];
  illustrationsLoading: boolean;
  skinOptions: Array<{ value: string; label: string }>;
  selectedSkinSlug: string | null;
  fullBodySrc: string | null;
  setSelectedSkinSlug: (slug: string | null) => void;
  talentIcon: string | undefined;
  skillIcons: Map<string, string>;
  setSelectedIllustration: (illustration: Illustration | null) => void;
  activeIllustration: Illustration | null;
  activeIllustrationIndex: number;
  hasMultipleIllustrations: boolean;
  showPreviousIllustration: () => void;
  showNextIllustration: () => void;
}

export function useCharacterAssets(
  character: Character | null | undefined,
  characterAssetKey?: string,
): UseCharacterAssetsResult {
  const { getDisplaySkin, setSelectedSkin } = useContext(CharacterSkinContext);
  const assetManifest = useAssetManifest();
  const illustrationCandidates = useMemo(
    () =>
      character
        ? resolveIllustrations(
            character.slug,
            characterAssetKey,
            character.skins,
          )
        : [],
    [character, characterAssetKey],
  );
  const illustrationCandidatesKey = useMemo(
    () => illustrationCandidates.map((candidate) => candidate.src).join('|'),
    [illustrationCandidates],
  );
  const [probeResult, setProbeResult] = useState<{
    key: string;
    illustrations: Illustration[];
  }>({ key: '', illustrations: [] });
  useEffect(() => {
    if (!assetManifest.error) return;
    let cancelled = false;
    probeIllustrations(illustrationCandidates).then((available) => {
      if (!cancelled) {
        setProbeResult({
          key: illustrationCandidatesKey,
          illustrations: available,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [assetManifest.error, illustrationCandidates, illustrationCandidatesKey]);
  const manifestIllustrations = useMemo(
    () =>
      resolveManifestIllustrations(
        illustrationCandidates,
        assetManifest.data.assets,
      ),
    [assetManifest.data.assets, illustrationCandidates],
  );
  const fallbackLoading =
    Boolean(assetManifest.error) &&
    probeResult.key !== illustrationCandidatesKey;
  const illustrationsLoading = assetManifest.loading || fallbackLoading;
  const availableIllustrations = useMemo(() => {
    if (illustrationsLoading) return [];
    return assetManifest.error
      ? probeResult.illustrations
      : manifestIllustrations;
  }, [
    assetManifest.error,
    illustrationsLoading,
    manifestIllustrations,
    probeResult.illustrations,
  ]);
  const characterSlug = character?.slug ?? null;
  const availableSkinSlugs = useMemo(
    () =>
      new Set(
        availableIllustrations.flatMap((illustration) =>
          illustration.skinSlug ? [illustration.skinSlug] : [],
        ),
      ),
    [availableIllustrations],
  );
  const skinOptions = useMemo(() => {
    const options = (character?.skins ?? [])
      .filter((skin) => availableSkinSlugs.has(skin.slug))
      .map((skin) => ({ value: skin.slug, label: skin.name }));
    return options;
  }, [availableSkinSlugs, character?.skins]);
  // Tracks a skin explicitly picked in this browsing session, which takes
  // priority over the toggle-gated default so users can still preview any
  // skin regardless of the "Show character skins" setting. Reset whenever
  // the viewed character changes, adjusted during render per React's
  // guidance for resetting state when a value changes.
  const [sessionSkinOverride, setSessionSkinOverride] = useState<{
    characterSlug: string;
    skinSlug: string;
  } | null>(null);
  if (
    sessionSkinOverride &&
    sessionSkinOverride.characterSlug !== characterSlug
  ) {
    setSessionSkinOverride(null);
  }
  const savedSkinSlug =
    sessionSkinOverride?.characterSlug === characterSlug
      ? sessionSkinOverride.skinSlug
      : characterSlug
        ? getDisplaySkin(characterSlug)
        : null;
  const selectedSkinSlug = availableSkinSlugs.has(savedSkinSlug ?? '')
    ? savedSkinSlug
    : (skinOptions[0]?.value ?? null);
  const fullBodySrc = useMemo(() => {
    if (!character || !selectedSkinSlug || assetManifest.loading) return null;

    const characterKey = characterAssetKey?.trim() || character.slug;
    const src = getCharacterSkinAsset(
      characterKey,
      selectedSkinSlug,
      'full_body',
    );
    if (!src) return null;

    // When the manifest is unavailable, SafeImage performs the compatibility
    // probe by quietly hiding a missing optional file after its request fails.
    if (assetManifest.error) return src;

    const assetPath = `character/${characterKey}/skins/${selectedSkinSlug}/full_body.png`;
    const entry = assetManifest.data.assets[assetPath];
    return entry ? `${src}?v=${entry.sha256.slice(0, 12)}` : null;
  }, [
    assetManifest.data.assets,
    assetManifest.error,
    assetManifest.loading,
    character,
    characterAssetKey,
    selectedSkinSlug,
  ]);
  const setSelectedSkinSlug = useCallback(
    (skinSlug: string | null) => {
      if (!characterSlug || !skinSlug) return;
      setSelectedSkin(characterSlug, skinSlug);
      setSessionSkinOverride({ characterSlug, skinSlug });
    },
    [characterSlug, setSelectedSkin],
  );
  const illustrations = useMemo(
    () =>
      availableIllustrations.filter(
        (illustration) => illustration.skinSlug === selectedSkinSlug,
      ),
    [availableIllustrations, selectedSkinSlug],
  );
  // Sentinel `null` (never a real illustrations array, even an empty one) ensures the
  // reset below also runs on the very first render, not just on later changes.
  const [illustrationsForSelection, setIllustrationsForSelection] = useState<
    Illustration[] | null
  >(null);
  const [selectedIllustration, setSelectedIllustration] =
    useState<Illustration | null>(null);
  const [talentIcon, setTalentIcon] = useState<string | undefined>();
  const [skillIcons, setSkillIcons] = useState<Map<string, string>>(new Map());

  // Reset the selection to the default illustration whenever the character (and thus
  // its illustration list) changes. Adjusted during render, per React's guidance for
  // resetting state when a value changes, rather than in an effect.
  if (illustrations !== illustrationsForSelection) {
    setIllustrationsForSelection(illustrations);
    const defaultImage =
      illustrations.find((img) => img.isDefault) ?? illustrations[0];
    setSelectedIllustration(defaultImage ?? null);
  }

  useEffect(() => {
    let isCancelled = false;

    if (!character) {
      return;
    }

    getTalentIcon(character.slug, characterAssetKey)
      .then((icon) => {
        if (!isCancelled) {
          setTalentIcon(icon);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          console.error(`Failed to load talent icon for "${character.name}"`);
          setTalentIcon(undefined);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [character, characterAssetKey]);

  useEffect(() => {
    let isCancelled = false;

    if (!character || !character.skills) {
      return;
    }

    Promise.all(
      character.skills.map(async (skill): Promise<[string, string] | null> => {
        const typeKey = (skill.type ?? '')
          .replace(/ Skill$/i, '')
          .toLowerCase();
        if (typeKey === 'divine') return null;
        const icon = await getCharacterSkillIcon(
          character.slug,
          typeKey,
          characterAssetKey,
        );
        return icon ? [skill.type ?? typeKey, icon] : null;
      }),
    )
      .then((results) => {
        if (isCancelled) return;

        const icons = new Map<string, string>();
        for (const entry of results) {
          if (entry) {
            icons.set(entry[0], entry[1]);
          }
        }
        setSkillIcons(icons);
      })
      .catch(() => {
        if (!isCancelled) {
          console.error(`Failed to load skill icons for "${character.name}"`);
          setSkillIcons(new Map());
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [character, characterAssetKey]);

  const activeIllustration = useMemo(
    () =>
      (selectedIllustration
        ? illustrations.find(
            (illustration) => illustration.src === selectedIllustration.src,
          )
        : null) ??
      illustrations[0] ??
      null,
    [selectedIllustration, illustrations],
  );

  const activeIllustrationIndex = useMemo(() => {
    if (!activeIllustration) {
      return -1;
    }

    return illustrations.findIndex(
      (illustration) => illustration.src === activeIllustration.src,
    );
  }, [activeIllustration, illustrations]);

  const displayTalentIcon = character ? talentIcon : undefined;
  const displaySkillIcons =
    character && character.skills ? skillIcons : EMPTY_SKILL_ICONS;

  const showPreviousIllustration = useCallback(() => {
    if (illustrations.length === 0 || activeIllustrationIndex < 0) return;

    const nextIndex =
      (activeIllustrationIndex - 1 + illustrations.length) %
      illustrations.length;
    setSelectedIllustration(illustrations[nextIndex]);
  }, [illustrations, activeIllustrationIndex]);

  const showNextIllustration = useCallback(() => {
    if (illustrations.length === 0 || activeIllustrationIndex < 0) return;

    const nextIndex = (activeIllustrationIndex + 1) % illustrations.length;
    setSelectedIllustration(illustrations[nextIndex]);
  }, [illustrations, activeIllustrationIndex]);

  return {
    illustrations,
    illustrationsLoading,
    skinOptions,
    selectedSkinSlug,
    fullBodySrc,
    setSelectedSkinSlug,
    talentIcon: displayTalentIcon,
    skillIcons: displaySkillIcons,
    setSelectedIllustration,
    activeIllustration,
    activeIllustrationIndex,
    hasMultipleIllustrations: illustrations.length > 1,
    showPreviousIllustration,
    showNextIllustration,
  };
}
