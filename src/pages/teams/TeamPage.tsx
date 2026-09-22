import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { STORAGE_KEY } from '@/constants/ui';
import TeamDetailContent from '@/features/teams/components/TeamDetailContent';
import { TeamHeroSection } from '@/features/teams/components/TeamHeroSection';
import { useTeamDetailData } from '@/features/teams/hooks/use-team-detail-data';
import {
  useTeamChanges,
  useTeams,
} from '@/features/teams/hooks/use-teams-data';
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
import { Box, Container } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  const { data: teams, loading: loadingTeams } = useTeams();
  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: wyrmspells, loading: loadingSpells } = useWyrmspells();
  const { data: factions, loading: loadingFactions } = useFactions();
  const { data: artifacts, loading: loadingArtifacts } = useArtifacts();
  const { data: statusEffects, loading: loadingStatusEffects } =
    useStatusEffects();
  const { data: changesData } = useTeamChanges();

  const loading =
    loadingTeams ||
    loadingChars ||
    loadingSpells ||
    loadingFactions ||
    loadingArtifacts ||
    loadingStatusEffects;

  const team = useMemo(() => {
    return teams.find((entry) => entry.community?.id === teamId) ?? null;
  }, [teams, teamId]);

  useEffect(() => {
    if (!team || !teamSlug) return;
    const canonicalPath = getTeamRoutePath(team);
    if (canonicalPath.endsWith(`/${teamSlug}`)) return;
    navigate(canonicalPath, { replace: true });
  }, [navigate, team, teamSlug]);

  const orderedTeams = useMemo(() => [...teams], [teams]);

  const teamIndex = useMemo(() => {
    if (!team) return -1;
    return orderedTeams.findIndex(
      (entry) => entry.name.toLowerCase() === team.name.toLowerCase(),
    );
  }, [orderedTeams, team]);

  const previousTeam = teamIndex > 0 ? orderedTeams[teamIndex - 1] : null;
  const nextTeam =
    teamIndex >= 0 && teamIndex < orderedTeams.length - 1
      ? orderedTeams[teamIndex + 1]
      : null;

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
        entityType="Team"
        name={teamSlug}
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }

  const openEditInBuilder = () => {
    navigate('/teams', {
      state: {
        editTeam: team.community?.viewerOwns
          ? team
          : { ...team, community: undefined },
      },
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
        team={team}
        factionInfo={factionInfo}
        artifactMap={artifactMap}
        statusEffects={statusEffects}
        isDark={isDark}
        tooltipProps={tooltipProps}
        onRequestEdit={requestEdit}
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
          onExportAsImage={exportAsImage}
        />

        <ChangeHistory history={changesData[team.name]} />

        <DetailPageNavigation
          previousItem={
            previousTeam
              ? {
                  label: previousTeam.name,
                  path: getTeamRoutePath(previousTeam),
                }
              : null
          }
          nextItem={
            nextTeam
              ? {
                  label: nextTeam.name,
                  path: getTeamRoutePath(nextTeam),
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
