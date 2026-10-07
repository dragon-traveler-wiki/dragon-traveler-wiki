import {
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Stack,
  Tabs,
  Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { IoPersonOutline } from 'react-icons/io5';
import { useNavigate, useParams } from 'react-router';
import {
  CommunityCardsLoading,
  ProfilePageLoading,
} from '@/components/layout/PageLoadingSkeleton';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DataFetchError from '@/components/ui/DataFetchError';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import {
  CommunityApiError,
  getPublicProfile,
  setUserRole,
  unsuspendUser,
} from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import { toBuilderDraft } from '@/features/community/builder-edit';
import { runAction } from '@/features/community/run-action';
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
import { useGradientAccent, useTabParam } from '@/hooks';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const { csrfToken } = useCommunityAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [profileError, setProfileError] = useState<unknown>(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [confirmLiftOpen, setConfirmLiftOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<'user' | 'moderator' | null>(
    null,
  );

  // Bumping profileVersion refetches in place (after a suspension change), so
  // the page keeps its content and scroll position instead of reloading.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setProfileError(null);
    });
    getPublicProfile(userId)
      .then((result) => {
        if (!cancelled) setProfile(result.user);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setProfileError(reason);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, profileVersion]);

  const liftSuspension = async () => {
    if (!csrfToken || !userId) return;
    setConfirmLiftOpen(false);
    const result = await runAction(() => unsuspendUser(userId, csrfToken), {
      errorTitle: 'Could not lift suspension',
      success: {
        title: 'Suspension lifted',
        message: 'They can publish, edit, vote, and report again.',
      },
    });
    if (result.ok) setProfileVersion((version) => version + 1);
  };

  const changeRole = async () => {
    const role = pendingRole;
    setPendingRole(null);
    if (!csrfToken || !userId || !role) return;
    const result = await runAction(() => setUserRole(userId, role, csrfToken), {
      errorTitle: 'Could not change role',
      success: {
        title: role === 'moderator' ? 'Moderator added' : 'Moderator removed',
        message:
          role === 'moderator'
            ? 'They can now moderate content.'
            : 'They no longer have moderator access.',
      },
    });
    if (result.ok) setProfileVersion((version) => version + 1);
  };

  const { data: characters } = useCharacters();
  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const [activeTab, setActiveTab] = useTabParam('tab', 'teams', [
    'teams',
    'tier-lists',
  ]);
  const teams = useTeams({ owner: userId });
  const tierLists = useTierLists({ owner: userId });

  const requestEditTeam = (team: Team) => {
    navigate('/teams', { state: { editTeam: toBuilderDraft(team) } });
  };

  const requestEditTierList = (tierList: TierList) => {
    navigate('/tier-list', {
      state: { editTierList: toBuilderDraft(tierList) },
    });
  };

  if (profileError) {
    if (
      profileError instanceof CommunityApiError &&
      profileError.status === 404
    ) {
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
        <DataFetchError
          title="Could not load profile"
          message={
            profileError instanceof Error ? profileError.message : undefined
          }
          onRetry={() => setProfileVersion((version) => version + 1)}
        />
      </Container>
    );
  }
  if (!profile || profile.id !== userId) return <ProfilePageLoading />;

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
                {profile.moderation.role === 'moderator' && (
                  <Badge color="grape" variant="light">
                    Moderator
                  </Badge>
                )}
                {profile.moderation.suspension && (
                  <Badge color="red" variant="light">
                    {profile.moderation.suspension.permanent
                      ? 'Banned'
                      : 'Suspended'}
                  </Badge>
                )}
                {profile.moderation.suspension ? (
                  <Button
                    size="compact-sm"
                    variant="light"
                    color="teal"
                    onClick={() => setConfirmLiftOpen(true)}
                  >
                    Lift suspension
                  </Button>
                ) : (
                  profile.moderation.canSuspend && (
                    <Button
                      size="compact-sm"
                      variant="light"
                      color="red"
                      onClick={() => setSuspendOpen(true)}
                    >
                      Suspend user
                    </Button>
                  )
                )}
                {profile.moderation.canChangeRole && (
                  <Button
                    size="compact-sm"
                    variant="light"
                    color="grape"
                    onClick={() =>
                      setPendingRole(
                        profile.moderation?.role === 'moderator'
                          ? 'user'
                          : 'moderator',
                      )
                    }
                  >
                    {profile.moderation.role === 'moderator'
                      ? 'Remove moderator'
                      : 'Make moderator'}
                  </Button>
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
          opened={pendingRole !== null}
          onCancel={() => setPendingRole(null)}
          title={
            pendingRole === 'moderator'
              ? `Make ${profile.displayName} a moderator?`
              : `Remove ${profile.displayName} as moderator?`
          }
          message={
            pendingRole === 'moderator'
              ? 'They will be able to hide and delete content, handle reports, suspend users, and appoint other moderators.'
              : 'They will immediately lose moderator access.'
          }
          confirmLabel={
            pendingRole === 'moderator' ? 'Make moderator' : 'Remove'
          }
          confirmColor={pendingRole === 'moderator' ? undefined : 'red'}
          onConfirm={() => void changeRole()}
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

        <Tabs value={activeTab} onChange={setActiveTab}>
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
              <CommunityCardsLoading kind="team" />
            ) : (
              <Stack gap="md">
                {teams.error && (
                  <DataFetchError
                    title="Could not load teams"
                    message={teams.error.message}
                    onRetry={teams.retry}
                  />
                )}
                {!(teams.error && teams.data.length === 0) && (
                  <PagedGrid
                    items={teams.data}
                    getKey={(team) => team.community?.id ?? team.name}
                    renderItem={(team) => (
                      <TeamCard
                        team={team}
                        charMap={charMap}
                        characterByIdentity={characterByIdentity}
                        to={getTeamRoutePath(team)}
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
                )}
              </Stack>
            )}
          </Tabs.Panel>
          <Tabs.Panel value="tier-lists" pt="md">
            {tierLists.loading ? (
              <CommunityCardsLoading kind="tierList" />
            ) : (
              <Stack gap="md">
                {tierLists.error && (
                  <DataFetchError
                    title="Could not load tier lists"
                    message={tierLists.error.message}
                    onRetry={tierLists.retry}
                  />
                )}
                {!(tierLists.error && tierLists.data.length === 0) && (
                  <PagedGrid
                    items={tierLists.data}
                    getKey={(tierList) =>
                      tierList.community?.id ?? tierList.name
                    }
                    renderItem={(tierList) => (
                      <TierListCard
                        tierList={tierList}
                        charMap={charMap}
                        characterByIdentity={characterByIdentity}
                        to={getTierListRoutePath(tierList)}
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
                )}
              </Stack>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
