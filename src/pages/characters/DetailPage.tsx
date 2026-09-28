import { Box, Container, Grid, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import EntityNotFound from '@/components/ui/EntityNotFound';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CharacterDetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import FullBleedSection from '@/components/layout/FullBleedSection';
import { BREAKPOINTS } from '@/constants/ui';
import { useCharacterAssets } from '@/features/characters/hooks/use-character-assets';
import { useStarLevels } from '@/features/wiki/hooks/use-wiki-data';
import { useMobileTooltip } from '@/hooks';
import {
  BannerContext,
  CharacterOwnershipContext,
  CharacterSkinContext,
  FavoriteIllustrationsContext,
} from '@/contexts';
import { getCharacterIdentityKey } from '@/features/characters/utils/character-route';
import { buildStarLevels } from '@/features/wiki/star-levels/star-levels';
import {
  getCharacterNavPaths,
  useCharacterPageData,
} from '@/features/characters/hooks/use-character-page-data';
import CharacterBuildSection from '@/features/characters/components/CharacterBuildSection';
import CharacterHeroSection from '@/features/characters/components/CharacterHeroSection';
import CharacterIllustrationPanel from '@/features/characters/components/CharacterIllustrationPanel';
import CharacterProgressPanel from '@/features/characters/components/CharacterProgressPanel';
import IllustrationPreviewModal from '@/components/common/IllustrationPreviewModal';
import CharacterSkillsSection from '@/features/characters/components/CharacterSkillsSection';
import CharacterSubclassPanel from '@/features/characters/components/CharacterSubclassPanel';
import CharacterVariantSelector from '@/features/characters/components/CharacterVariantSelector';
import { useNewCharacters } from '@/features/characters/hooks/use-new-characters';

const CharacterModelLauncher = lazy(
  () => import('@/features/characters/components/CharacterModelLauncher'),
);

export default function CharacterPage() {
  const tooltipProps = useMobileTooltip();
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);
  const { name } = useParams<{ name: string }>();
  const { getCharacterStarLevel, setCharacterStarLevel } = useContext(
    CharacterOwnershipContext,
  );
  const { isFavoriteIllustration, toggleFavoriteIllustration } = useContext(
    FavoriteIllustrationsContext,
  );
  const { favoritesOnly } = useContext(BannerContext);
  const { getDisplaySkin } = useContext(CharacterSkinContext);
  const { data: rawStarLevels } = useStarLevels();
  const starLevels = useMemo(
    () => buildStarLevels(rawStarLevels),
    [rawStarLevels],
  );
  const starLevelOptions = useMemo(
    () => [
      { value: '', label: 'Not owned' },
      ...starLevels.map((l) => ({ value: l.value, label: l.label })),
    ],
    [starLevels],
  );

  const {
    loading,
    character,
    sameNameVariants,
    routeBaseSlug,
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
  } = useCharacterPageData(name);

  const {
    illustrations,
    illustrationsLoading,
    skinOptions,
    selectedSkinSlug,
    fullBodySrc,
    setSelectedSkinSlug,
    talentIcon,
    skillIcons,
    setSelectedIllustration,
    activeIllustration,
    activeIllustrationIndex,
    hasMultipleIllustrations,
    showPreviousIllustration,
    showNextIllustration,
  } = useCharacterAssets(character, characterAssetKey);

  const newCharacterKeys = useNewCharacters();

  const activeIllustrationFavoriteKey =
    favoritesOnly && characterAssetKey && activeIllustrationIndex >= 0
      ? `${characterAssetKey}::${activeIllustrationIndex}`
      : null;
  const isActiveIllustrationFavorite = activeIllustrationFavoriteKey
    ? isFavoriteIllustration(activeIllustrationFavoriteKey)
    : false;
  const toggleActiveIllustrationFavorite = useCallback(() => {
    if (activeIllustrationFavoriteKey) {
      toggleFavoriteIllustration(activeIllustrationFavoriteKey);
    }
  }, [activeIllustrationFavoriteKey, toggleFavoriteIllustration]);

  const [previewOpen, setPreviewOpen] = useState(false);

  const scrollToSkill = useCallback((skillName: string) => {
    const el = document.getElementById(`skill-${skillName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const scrollToTalent = useCallback(() => {
    const el = document.getElementById('talent-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  if (loading) {
    return <CharacterDetailPageLoading />;
  }

  if (!character) {
    if (sameNameVariants.length > 1 && routeBaseSlug) {
      return <CharacterVariantSelector variants={sameNameVariants} />;
    }

    return (
      <EntityNotFound
        entityType="Character"
        name={name}
        backLabel="Back to Characters"
        backPath="/characters"
      />
    );
  }

  const stickyTopOffset =
    'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-md))';
  const { previousItem, nextItem } = getCharacterNavPaths(
    previousCharacter,
    nextCharacter,
    getDisplaySkin,
  );
  const hasRightColumnInformation = Boolean(
    character.lore ||
    character.summary ||
    character.talent ||
    character.skills.length > 0 ||
    (character.divinity?.length ?? 0) > 0 ||
    recommendedGearLoadouts.length > 0 ||
    recommendedSubclassEntries.length > 0 ||
    linkedNoblePhantasms.length > 0 ||
    (selectedTierListName && tierLabel && tierListCharacterNote),
  );

  return (
    <Box>
      <FullBleedSection>
        <ErrorBoundary
          scope="section"
          name="character hero"
          resetKeys={[character.slug, selectedSkinSlug]}
        >
          <CharacterHeroSection
            character={character}
            activeIllustration={activeIllustration}
            fullBodySrc={fullBodySrc}
            assetKey={characterAssetKey}
            isNew={newCharacterKeys.has(getCharacterIdentityKey(character))}
            selectedSkinSlug={selectedSkinSlug}
          />
        </ErrorBoundary>
      </FullBleedSection>

      {/* Main Content */}
      <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
        <Grid gap="xl">
          {/* Left Column - Illustration */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack
              gap="md"
              style={{
                position: isDesktop ? 'sticky' : 'static',
                top: isDesktop ? stickyTopOffset : undefined,
                alignSelf: 'flex-start',
              }}
            >
              <CharacterIllustrationPanel
                characterName={character.name}
                loading={illustrationsLoading}
                skinOptions={skinOptions}
                selectedSkinSlug={selectedSkinSlug}
                onSkinChange={setSelectedSkinSlug}
                activeIllustration={activeIllustration}
                activeIllustrationIndex={activeIllustrationIndex}
                illustrationsLength={illustrations.length}
                hasMultipleIllustrations={hasMultipleIllustrations}
                onOpenPreview={() => setPreviewOpen(true)}
                onPrevious={showPreviousIllustration}
                onNext={showNextIllustration}
                isFavorite={isActiveIllustrationFavorite}
                onToggleFavorite={
                  activeIllustrationFavoriteKey
                    ? toggleActiveIllustrationFavorite
                    : undefined
                }
                modelAction={
                  <ErrorBoundary
                    scope="inline"
                    name="3D model launcher"
                    resetKeys={[characterAssetKey, selectedSkinSlug]}
                  >
                    <Suspense fallback={null}>
                      <CharacterModelLauncher
                        characterSlug={characterAssetKey || character.slug}
                        skinSlug={selectedSkinSlug}
                      />
                    </Suspense>
                  </ErrorBoundary>
                }
              />

              <CharacterProgressPanel
                starLevelOptions={starLevelOptions}
                value={
                  getCharacterStarLevel(getCharacterIdentityKey(character)) ??
                  ''
                }
                onChange={(val) =>
                  setCharacterStarLevel(
                    getCharacterIdentityKey(character),
                    val || null,
                  )
                }
              />

              <CharacterSubclassPanel
                character={character}
                subclassBySlug={subclassBySlug}
                statusEffects={statusEffects}
              />
            </Stack>
          </Grid.Col>

          {/* Right Column */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              <ErrorBoundary
                scope="section"
                name="character build"
                resetKeys={[character.slug]}
              >
                <CharacterBuildSection
                  character={character}
                  teams={teams}
                  enableNameBasedReferences={
                    isPreferredCharacterForNameReferences
                  }
                  selectedTierListName={selectedTierListName}
                  tierLabel={tierLabel}
                  tierListCharacterNote={tierListCharacterNote}
                  statusEffects={statusEffects}
                  recommendedGearLoadouts={recommendedGearLoadouts}
                  recommendedSubclassEntries={recommendedSubclassEntries}
                  linkedNoblePhantasms={linkedNoblePhantasms}
                  scrollToSkill={scrollToSkill}
                  scrollToTalent={scrollToTalent}
                  showInformationComingSoon={!hasRightColumnInformation}
                />
              </ErrorBoundary>
              <ErrorBoundary
                scope="section"
                name="character skills"
                resetKeys={[character.slug]}
              >
                <CharacterSkillsSection
                  character={character}
                  statusEffects={statusEffects}
                  talentIcon={talentIcon}
                  skillIcons={skillIcons}
                  scrollToSkill={scrollToSkill}
                  scrollToTalent={scrollToTalent}
                />
              </ErrorBoundary>
            </Stack>
          </Grid.Col>
        </Grid>

        <IllustrationPreviewModal
          opened={previewOpen}
          onClose={() => setPreviewOpen(false)}
          entityName={character.name}
          illustrations={illustrations}
          activeIllustration={activeIllustration}
          activeIllustrationIndex={activeIllustrationIndex}
          hasMultipleIllustrations={hasMultipleIllustrations}
          showPreviousIllustration={showPreviousIllustration}
          showNextIllustration={showNextIllustration}
          onSelectIllustration={setSelectedIllustration}
          tooltipProps={tooltipProps}
          isFavorite={isActiveIllustrationFavorite}
          onToggleFavorite={
            activeIllustrationFavoriteKey
              ? toggleActiveIllustrationFavorite
              : undefined
          }
        />

        <ChangeHistory
          history={
            changesData[`${character.slug}__${character.quality}`] ??
            changesData[character.slug] ??
            (character.legacy_slug
              ? changesData[character.legacy_slug]
              : undefined)
          }
        />

        <DetailPageNavigation previousItem={previousItem} nextItem={nextItem} />
      </Container>
    </Box>
  );
}
