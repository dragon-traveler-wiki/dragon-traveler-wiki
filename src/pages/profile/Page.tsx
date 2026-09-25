import {
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { IoPersonOutline } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { getPublicProfile, unsuspendUser } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import CommunityActions from '@/features/community/CommunityActions';
import CommunityStatsBadges from '@/features/community/CommunityStatsBadges';
import ModerationLog from '@/features/community/ModerationLog';
import PagedGrid from '@/features/community/PagedGrid';
import SuspendUserModal from '@/features/community/SuspendUserModal';
import type { PublicProfile } from '@/features/community/types';
import TeamCard from '@/features/teams/components/TeamCard';
import { useTeams } from '@/features/teams/hooks/use-teams-data';
import type { Team } from '@/features/teams/types';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import TierListCard from '@/features/tier-list/components/TierListCard';
import { useTierLists } from '@/features/tier-list/hooks/use-tier-list-data';
import type { TierList } from '@/features/tier-list/types';
import { getTierListRoutePath } from '@/features/tier-list/utils/tier-list-route';
import { useGradientAccent } from '@/hooks';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const { csrfToken } = useCommunityAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [confirmLiftOpen, setConfirmLiftOpen] = useState(false);

  // Bumping profileVersion refetches in place (after a suspension change), so
  // the page keeps its content and scroll position instead of reloading.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProfileError(false);
    });
    getPublicProfile(userId)
      .then((result) => {
        if (!cancelled) setProfile(result.user);
      })
      .catch(() => {
        if (!cancelled) setProfileError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, profileVersion]);

  const liftSuspension = async () => {
    if (!csrfToken || !userId) return;
    setConfirmLiftOpen(false);
    try {
      await unsuspendUser(userId, csrfToken);
      showSuccessToast({
        title: 'Suspension lifted',
        message: 'They can publish, edit, vote, and report again.',
      });
      setProfileVersion((version) => version + 1);
    } catch (error) {
      showErrorToast({
        title: 'Could not lift suspension',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const { data: characters } = useCharacters();
  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const teams = useTeams({ owner: userId });
  const tierLists = useTierLists({ owner: userId });

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

  if (profileError) {
    return (
      <EntityNotFound
        entityType="User"
        backLabel="Back to Teams"
        backPath="/teams"
      />
    );
  }
  if (!profile || profile.id !== userId) return <DetailPageLoading />;

  const countBadge = (count: number) => (
    <Badge size="xs" variant="light" color={accent.primary}>
      {count}
    </Badge>
  );

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
          <Stack gap={4}>
            <Title order={1}>{profile.displayName}</Title>
            <CommunityStatsBadges stats={profile.stats} />
            {profile.moderation && (
              <Group gap="xs">
                {profile.moderation.suspension && (
                  <Badge color="red" variant="light">
                    {profile.moderation.suspension.permanent
                      ? 'Banned'
                      : 'Suspended'}
                  </Badge>
                )}
                {profile.moderation.suspension ? (
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="teal"
                    onClick={() => setConfirmLiftOpen(true)}
                  >
                    Lift suspension
                  </Button>
                ) : (
                  profile.moderation.canSuspend && (
                    <Button
                      size="compact-xs"
                      variant="light"
                      color="red"
                      onClick={() => setSuspendOpen(true)}
                    >
                      Suspend user
                    </Button>
                  )
                )}
              </Group>
            )}
          </Stack>
        </Group>

        <SuspendUserModal
          opened={suspendOpen}
          userId={profile.id}
          userName={profile.displayName}
          onClose={() => setSuspendOpen(false)}
          onSuspended={() => {
            setProfileVersion((version) => version + 1);
            teams.refresh();
            tierLists.refresh();
          }}
        />
        <ConfirmActionModal
          opened={confirmLiftOpen}
          onCancel={() => setConfirmLiftOpen(false)}
          title="Lift this suspension?"
          message="They'll be able to publish, edit, vote, and report again. Items that were hidden stay hidden until restored."
          confirmLabel="Lift suspension"
          onConfirm={() => void liftSuspension()}
        />

        {profile.moderation && (
          <CollapsibleSectionCard
            defaultExpanded={false}
            header={
              <Title order={2} size="h3">
                Moderation history
              </Title>
            }
          >
            <ModerationLog key={profileVersion} userId={profile.id} />
          </CollapsibleSectionCard>
        )}

        <Tabs defaultValue="teams">
          <Tabs.List>
            <Tabs.Tab
              value="teams"
              rightSection={countBadge(profile.stats.teams)}
            >
              Teams
            </Tabs.Tab>
            <Tabs.Tab
              value="tier-lists"
              rightSection={countBadge(profile.stats.tierLists)}
            >
              Tier Lists
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="teams" pt="md">
            {teams.loading ? (
              <Loader size="sm" color={accent.primary} />
            ) : (
              <Stack gap="md">
                <PagedGrid
                  items={teams.data}
                  getKey={(team) => team.community?.id ?? team.name}
                  renderItem={(team) => (
                    <TeamCard
                      team={team}
                      charMap={charMap}
                      characterByIdentity={characterByIdentity}
                      onNavigate={() => navigate(getTeamRoutePath(team))}
                      actions={
                        team.community ? (
                          <CommunityActions
                            community={team.community}
                            onEdit={() => requestEditTeam(team)}
                            onDeleted={teams.refresh}
                          />
                        ) : null
                      }
                    />
                  )}
                  emptyMessage="No published teams yet."
                  storageKey="profile-teams"
                  total={teams.total}
                  hasMore={teams.hasMore}
                  loadingMore={teams.loadingMore}
                  onLoadMore={teams.loadMore}
                />
              </Stack>
            )}
          </Tabs.Panel>
          <Tabs.Panel value="tier-lists" pt="md">
            {tierLists.loading ? (
              <Loader size="sm" color={accent.primary} />
            ) : (
              <Stack gap="md">
                <PagedGrid
                  items={tierLists.data}
                  getKey={(tierList) => tierList.community?.id ?? tierList.name}
                  renderItem={(tierList) => (
                    <TierListCard
                      tierList={tierList}
                      charMap={charMap}
                      characterByIdentity={characterByIdentity}
                      onNavigate={() =>
                        navigate(getTierListRoutePath(tierList))
                      }
                      actions={
                        tierList.community ? (
                          <CommunityActions
                            community={tierList.community}
                            onEdit={() => requestEditTierList(tierList)}
                            onDeleted={tierLists.refresh}
                          />
                        ) : null
                      }
                    />
                  )}
                  emptyMessage="No published tier lists yet."
                  storageKey="profile-tier-lists"
                  total={tierLists.total}
                  hasMore={tierLists.hasMore}
                  loadingMore={tierLists.loadingMore}
                  onLoadMore={tierLists.loadMore}
                />
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
