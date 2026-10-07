import { Badge, Stack, Tabs, Title } from '@mantine/core';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { CommunityCardsLoading } from '@/components/layout/PageLoadingSkeleton';
import DataFetchError from '@/components/ui/DataFetchError';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import TeamCard from '@/features/teams/components/TeamCard';
import type { Team } from '@/features/teams/types';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import TierListCard from '@/features/tier-list/components/TierListCard';
import type { TierList } from '@/features/tier-list/types';
import { getTierListRoutePath } from '@/features/tier-list/utils/tier-list-route';
import { useGradientAccent } from '@/hooks';
import CommunityActions from './CommunityActions';
import { toDisplayItems } from './hooks';
import PagedGrid from './PagedGrid';
import type { CommunityItem } from './types';

type OwnItem = CommunityItem<Record<string, unknown>>;

interface MyPublicationsProps {
  items: OwnItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onRemoved: (id: string) => void;
}

/** The signed-in user's own teams and tier lists, split into tabs and paged. */
export default function MyPublications({
  items,
  loading,
  error,
  onRetry,
  onRemoved,
}: MyPublicationsProps) {
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const { data: characters } = useCharacters();
  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);
  const teams = useMemo(() => items.filter((i) => i.kind === 'team'), [items]);
  const tierLists = useMemo(
    () => items.filter((i) => i.kind === 'tier_list'),
    [items],
  );

  const hiddenBadge = (item: OwnItem) =>
    item.status === 'hidden' ? (
      <Badge variant="outline" color="red" size="sm">
        Hidden
      </Badge>
    ) : null;

  const renderTeam = (item: OwnItem) => {
    const [display] = toDisplayItems([item]);
    const team = display as unknown as Team;
    return (
      <TeamCard
        team={team}
        charMap={charMap}
        characterByIdentity={characterByIdentity}
        to={getTeamRoutePath(team)}
        actions={
          <>
            {hiddenBadge(item)}
            <CommunityActions
              community={item}
              onEdit={() => navigate('/teams', { state: { editTeam: team } })}
              onDeleted={() => onRemoved(item.id)}
            />
          </>
        }
      />
    );
  };

  const renderTierList = (item: OwnItem) => {
    const [display] = toDisplayItems([item]);
    const tierList = display as unknown as TierList;
    return (
      <TierListCard
        tierList={tierList}
        charMap={charMap}
        characterByIdentity={characterByIdentity}
        to={getTierListRoutePath(tierList)}
        actions={
          <>
            {hiddenBadge(item)}
            <CommunityActions
              community={item}
              onEdit={() =>
                navigate('/tier-list', { state: { editTierList: tierList } })
              }
              onDeleted={() => onRemoved(item.id)}
            />
          </>
        }
      />
    );
  };

  const countBadge = (count: number) => (
    <Badge size="xs" variant="light" color={accent.primary}>
      {count}
    </Badge>
  );

  return (
    <Stack>
      <Title order={2}>Your publications</Title>
      {loading ? (
        <CommunityCardsLoading kind="team" cards={2} />
      ) : error ? (
        <DataFetchError
          title="Could not load publications"
          message={error}
          onRetry={onRetry}
        />
      ) : (
        <Tabs defaultValue="teams">
          <Tabs.List>
            <Tabs.Tab value="teams" rightSection={countBadge(teams.length)}>
              Teams
            </Tabs.Tab>
            <Tabs.Tab
              value="tier-lists"
              rightSection={countBadge(tierLists.length)}
            >
              Tier Lists
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="teams" pt="md">
            <Stack gap="md">
              <PagedGrid
                items={teams}
                getKey={(item) => item.id}
                renderItem={renderTeam}
                emptyMessage="You have not published any teams yet."
                storageKey="account-teams"
              />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="tier-lists" pt="md">
            <Stack gap="md">
              <PagedGrid
                items={tierLists}
                getKey={(item) => item.id}
                renderItem={renderTierList}
                emptyMessage="You have not published any tier lists yet."
                storageKey="account-tier-lists"
              />
            </Stack>
          </Tabs.Panel>
        </Tabs>
      )}
    </Stack>
  );
}
