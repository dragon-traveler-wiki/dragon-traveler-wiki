import { Box, Container } from '@mantine/core';
import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import { STORAGE_KEY } from '@/constants/ui';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  useArtifacts,
  useStatusEffects,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import {
  useDarkMode,
  useFactions,
  useGradientAccent,
  useMobileTooltip,
} from '@/hooks';
import { useTeamDetailData } from '@/features/teams/hooks/use-team-detail-data';
import { getSavedTeam, removeSavedTeam } from '@/features/teams/saved-teams';
import type { Team } from '@/features/teams/types';
import { showErrorToast } from '@/utils/toast';
import {
  exportTeamCompositionAsImage,
  hasTeamBuilderDraft,
} from '@/features/teams/utils/team-page';
import { TeamHeroSection } from '@/features/teams/components/TeamHeroSection';
import TeamDetailContent from '@/features/teams/components/TeamDetailContent';

export default function SavedTeamPage() {
  const { teamSlug } = useParams<{ teamSlug: string }>();
  const slug = teamSlug ?? '';
  const tooltipProps = useMobileTooltip();
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Read team from localStorage
  const [team, setTeam] = useState<Team | null>(() => getSavedTeam(slug));
  const [loadedSlug, setLoadedSlug] = useState(slug);
  if (slug !== loadedSlug) {
    setLoadedSlug(slug);
    setTeam(getSavedTeam(slug));
  }

  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } =
    useStatusEffects();

  const loading =
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const { getCharacterPath, factionInfo, artifactMap, factionColor } =
    useTeamDetailData({
      team,
      factions,
      artifacts,
      charMap,
      characterByIdentity,
      fallbackFactionColor: accent.secondary,
    });

  if (loading) {
    return <DetailPageLoading />;
  }

  if (!team) {
    return (
      <EntityNotFound
        entityType="Saved Team"
        name={slug}
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }

  const openInBuilder = () => {
    navigate('/teams', { state: { editTeam: team } });
  };

  const requestLoadInBuilder = () => {
    if (!hasTeamBuilderDraft(STORAGE_KEY.TEAMS_BUILDER_DRAFT)) {
      openInBuilder();
      return;
    }
    setConfirmEditOpen(true);
  };

  const handleDelete = () => {
    try {
      removeSavedTeam(slug);
      navigate('/teams?mode=saved', { replace: true });
    } catch {
      showErrorToast({
        title: 'Could not delete team',
        message: 'Browser storage could not be updated. Please try again.',
      });
    }
  };

  const exportAsImage = async () => {
    setExporting(true);
    try {
      await exportTeamCompositionAsImage(exportRef, team.name, isDark);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <TeamHeroSection
        onExportAsImage={exportAsImage}
        exporting={exporting}
        team={team}
        factionInfo={factionInfo}
        artifactMap={artifactMap}
        statusEffects={statusEffects}
        isDark={isDark}
        tooltipProps={tooltipProps}
        onRequestEdit={requestLoadInBuilder}
        onRequestDelete={() => setConfirmDeleteOpen(true)}
      />

      <ConfirmActionModal
        opened={confirmEditOpen}
        onCancel={() => setConfirmEditOpen(false)}
        title="Replace current builder data?"
        message="Loading this team will replace your current builder draft."
        confirmLabel="Replace"
        onConfirm={() => {
          setConfirmEditOpen(false);
          openInBuilder();
        }}
      />

      <ConfirmActionModal
        opened={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        title="Delete saved team?"
        message={`This will permanently delete "${team.name}" from your saved teams.`}
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          handleDelete();
        }}
      />

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <TeamDetailContent
          team={team}
          charMap={charMap}
          characterByIdentity={characterByIdentity}
          getCharacterPath={getCharacterPath}
          factionColor={factionColor}
          accentPrimary={accent.primary}
          isDark={isDark}
          tooltipProps={tooltipProps}
          wyrmspells={wyrmspells}
          exportRef={exportRef}
          exporting={exporting}
        />
      </Container>
    </Box>
  );
}
