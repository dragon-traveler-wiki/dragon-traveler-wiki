import {
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { IoPersonOutline } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import CommunityActions from '@/features/community/CommunityActions';
import { getPublicProfile } from '@/features/community/api';
import type { PublicProfile } from '@/features/community/types';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import TeamCard from '@/features/teams/components/TeamCard';
import { useTeams } from '@/features/teams/hooks/use-teams-data';
import type { Team } from '@/features/teams/types';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import TierListCard from '@/features/tier-list/components/TierListCard';
import { useTierLists } from '@/features/tier-list/hooks/use-tier-list-data';
import type { TierList } from '@/features/tier-list/types';
import { getTierListRoutePath } from '@/features/tier-list/utils/tier-list-route';
import { useGradientAccent } from '@/hooks';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setProfileLoading(true);
        setProfileError(false);
      }
    });
    getPublicProfile(userId)
      .then((result) => {
        if (!cancelled) setProfile(result.user);
      })
      .catch(() => {
        if (!cancelled) setProfileError(true);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const { data: characters } = useCharacters();
  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const {
    data: teams,
    loading: teamsLoading,
    hasMore: hasMoreTeams,
    loadingMore: loadingMoreTeams,
    loadMore: loadMoreTeams,
  } = useTeams({ owner: userId });
  const {
    data: tierLists,
    loading: tierListsLoading,
    hasMore: hasMoreTierLists,
    loadingMore: loadingMoreTierLists,
    loadMore: loadMoreTierLists,
  } = useTierLists({ owner: userId });

  const requestEditTeam = (team: Team) => {
    navigate('/teams', {
      state: {
        editTeam: team.community?.viewerOwns
          ? team
          : { ...team, community: undefined },
      },
    });
  };

  const requestEditTierList = (tierList: TierList) => {
    navigate('/tier-list', {
      state: {
        editTierList: tierList.community?.viewerOwns
          ? tierList
          : { ...tierList, community: undefined },
      },
    });
  };

  if (profileLoading) return <DetailPageLoading />;

  if (profileError || !profile) {
    return (
      <EntityNotFound
        entityType="User"
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="xl">
        <Group>
          <Avatar
            src={profile.avatarUrl}
            size="lg"
            radius="xl"
            color={accent.primary}
          >
            <IoPersonOutline />
          </Avatar>
          <Title order={1}>{profile.displayName}</Title>
        </Group>

        <Stack gap="sm">
          <Group gap="xs" align="baseline">
            <Title order={2} size="h3">
              Teams
            </Title>
            {!teamsLoading && (
              <Badge variant="light" color={accent.primary}>
                {teams.length}
                {hasMoreTeams ? '+' : ''}
              </Badge>
            )}
          </Group>
          {teamsLoading ? (
            <Loader size="sm" color={accent.primary} />
          ) : teams.length === 0 ? (
            <Text c="dimmed">No published teams yet.</Text>
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {teams.map((team) => (
                  <TeamCard
                    key={team.community?.id ?? team.name}
                    team={team}
                    charMap={charMap}
                    characterByIdentity={characterByIdentity}
                    onNavigate={() => navigate(getTeamRoutePath(team))}
                    actions={
                      team.community ? (
                        <CommunityActions
                          community={team.community}
                          onEdit={() => requestEditTeam(team)}
                          onDeleted={() => window.location.reload()}
                        />
                      ) : null
                    }
                  />
                ))}
              </SimpleGrid>
              {hasMoreTeams && (
                <Group justify="center">
                  <Button
                    variant="light"
                    color={accent.primary}
                    loading={loadingMoreTeams}
                    onClick={loadMoreTeams}
                  >
                    Load more teams
                  </Button>
                </Group>
              )}
            </>
          )}
        </Stack>

        <Stack gap="sm">
          <Group gap="xs" align="baseline">
            <Title order={2} size="h3">
              Tier Lists
            </Title>
            {!tierListsLoading && (
              <Badge variant="light" color={accent.primary}>
                {tierLists.length}
                {hasMoreTierLists ? '+' : ''}
              </Badge>
            )}
          </Group>
          {tierListsLoading ? (
            <Loader size="sm" color={accent.primary} />
          ) : tierLists.length === 0 ? (
            <Text c="dimmed">No published tier lists yet.</Text>
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {tierLists.map((tierList) => (
                  <TierListCard
                    key={tierList.community?.id ?? tierList.name}
                    tierList={tierList}
                    onNavigate={() => navigate(getTierListRoutePath(tierList))}
                    actions={
                      tierList.community ? (
                        <CommunityActions
                          community={tierList.community}
                          onEdit={() => requestEditTierList(tierList)}
                          onDeleted={() => window.location.reload()}
                        />
                      ) : null
                    }
                  />
                ))}
              </SimpleGrid>
              {hasMoreTierLists && (
                <Group justify="center">
                  <Button
                    variant="light"
                    color={accent.primary}
                    loading={loadingMoreTierLists}
                    onClick={loadMoreTierLists}
                  >
                    Load more tier lists
                  </Button>
                </Group>
              )}
            </>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
