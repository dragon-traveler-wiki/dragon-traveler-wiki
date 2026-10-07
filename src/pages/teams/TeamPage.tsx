import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DataFetchError from '@/components/ui/DataFetchError';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { STORAGE_KEY } from '@/constants/ui';
import { CommunityApiError } from '@/features/community/api';
import { toBuilderDraft } from '@/features/community/builder-edit';
import CommunityActions from '@/features/community/CommunityActions';
import RevisionHistory from '@/features/community/RevisionHistory';
import TeamDetailContent from '@/features/teams/components/TeamDetailContent';
import { TeamHeroSection } from '@/features/teams/components/TeamHeroSection';
import { useTeamDetailData } from '@/features/teams/hooks/use-team-detail-data';
import { useTeam } from '@/features/teams/hooks/use-teams-data';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  useArtifacts,
  useStatusEffects,
  useWyrmspells,
} from '@/features/wiki/hooks/use-wiki-data';
import {
  exportTeamCompositionAsImage,
  hasTeamBuilderDraft,
} from '@/features/teams/utils/team-page';
import {
  useDarkMode,
  useFactions,
  useGradientAccent,
  useMobileTooltip,
} from '@/hooks';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import { Box, Container, Stack } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

export default function TeamPage() {
  const tooltipProps = useMobileTooltip();
  const { teamId, teamSlug } = useParams<{
    teamId: string;
    teamSlug: string;
  }>();
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const {
    data: team,
    loading: loadingTeam,
    error: teamError,
    retry: retryTeam,
  } = useTeam(teamId ?? null);
  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } =
    useStatusEffects();

  const loading =
    loadingTeam ||
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

  useEffect(() => {
    if (!team || !teamSlug) return;
    const canonicalPath = getTeamRoutePath(team);
    if (canonicalPath.endsWith(`/${teamSlug}`)) return;
    navigate(canonicalPath, { replace: true });
  }, [navigate, team, teamSlug]);

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

  if (
    teamError &&
    !(teamError instanceof CommunityApiError && teamError.status === 404)
  ) {
    return (
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <DataFetchError
          title="Could not load team"
          message={teamError.message}
          onRetry={retryTeam}
        />
      </Container>
    );
  }

  if (!team) {
    return (
      <EntityNotFound
        entityType="Team"
        name={teamSlug}
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }

  const openEditInBuilder = () => {
    navigate('/teams', {
      state: { editTeam: toBuilderDraft(team) },
    });
  };

  const requestEdit = () => {
    if (hasTeamBuilderDraft(STORAGE_KEY.TEAMS_BUILDER_DRAFT)) {
      setConfirmEditOpen(true);
      return;
    }
    openEditInBuilder();
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
        onRequestEdit={requestEdit}
        bylineActions={
          team.community && (
            <CommunityActions
              community={team.community}
              show={{ reactions: true }}
            />
          )
        }
        ownerActions={
          team.community && (
            <CommunityActions
              community={team.community}
              show={{ delete: true }}
              size="md"
              onDeleted={() => navigate('/teams')}
            />
          )
        }
      />

      <ConfirmActionModal
        opened={confirmEditOpen}
        onCancel={() => setConfirmEditOpen(false)}
        title="Replace current builder data?"
        message="Opening this team will replace your current builder draft."
        confirmLabel="Replace"
        onConfirm={() => {
          setConfirmEditOpen(false);
          openEditInBuilder();
        }}
      />

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="md">
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
          {team.community && (
            <RevisionHistory
              kind="team"
              id={team.community.id}
              publishedAt={team.community.createdAt}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
}
