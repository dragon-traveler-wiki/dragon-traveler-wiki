import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { Link } from 'react-router';
import { useCommunityItems } from '@/features/community/hooks';
import { moderateItem } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import { getDisplayAuthor } from '@/features/community/display-author';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import { getTierListRoutePath } from '@/features/tier-list/utils/tier-list-route';
import type { Team } from '@/features/teams/types';
import type { TierList } from '@/features/tier-list/types';
import { useGradientAccent } from '@/hooks';
import { capitalize } from '@/features/community/report-status';
import SuspendUserModal from '@/features/community/SuspendUserModal';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

type Kind = 'team' | 'tier_list';
type Status = 'published' | 'hidden';

export default function ModeratedItemsBrowser() {
  const { csrfToken } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [kind, setKind] = useState<Kind>('team');
  const [status, setStatus] = useState<Status>('hidden');
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [actingId, setActingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const teams = useCommunityItems<Team>('team', {
    search: kind === 'team' ? debouncedSearch : '',
    status,
  });
  const tierLists = useCommunityItems<TierList>('tier_list', {
    search: kind === 'tier_list' ? debouncedSearch : '',
    status,
  });
  const { data, loading, hasMore, loadingMore, loadMore, refresh } =
    kind === 'team' ? teams : tierLists;

  const act = async (id: string, action: 'hide' | 'restore' | 'delete') => {
    if (!csrfToken) return;
    setActingId(id);
    try {
      await moderateItem(kind, id, action, csrfToken);
      showSuccessToast({ title: 'Done', message: `Item ${action}d.` });
      refresh();
    } catch (error) {
      showErrorToast({
        title: 'Moderation action failed',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <Stack gap="md">
      <Group gap="sm" wrap="wrap">
        <SegmentedControl
          aria-label="Content type"
          value={kind}
          onChange={(value) => setKind(value as Kind)}
          data={[
            { label: 'Teams', value: 'team' },
            { label: 'Tier Lists', value: 'tier_list' },
          ]}
        />
        <SegmentedControl
          aria-label="Status"
          value={status}
          onChange={(value) => setStatus(value as Status)}
          data={[
            { label: 'Hidden', value: 'hidden' },
            { label: 'Published', value: 'published' },
          ]}
        />
        <TextInput
          aria-label="Search content"
          placeholder="Search..."
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
      </Group>

      {loading ? (
        <Loader size="sm" color={accent.primary} />
      ) : data.length === 0 ? (
        <Text c="dimmed">No {status} items found.</Text>
      ) : (
        <Stack gap="xs">
          {data.map((item) => {
            const path =
              kind === 'team'
                ? getTeamRoutePath(item as Team)
                : getTierListRoutePath(item as TierList);
            const id = item.community!.id;
            return (
              <Card withBorder key={id}>
                <Group justify="space-between" wrap="wrap">
                  <Stack gap={4}>
                    <Text
                      component={Link}
                      to={path}
                      target="_blank"
                      fw={600}
                      className="dt-link-text"
                    >
                      {item.name || 'Untitled'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      by {getDisplayAuthor(item) ?? 'Anonymous'} ·{' '}
                      {item.community!.score} upvotes
                    </Text>
                  </Stack>
                  <Group gap="xs">
                    <Badge
                      variant="outline"
                      color={status === 'hidden' ? 'red' : 'gray'}
                    >
                      {capitalize(status)}
                    </Badge>
                    {status === 'hidden' ? (
                      <Button
                        size="xs"
                        color="teal"
                        loading={actingId === id}
                        disabled={actingId !== null}
                        onClick={() => void act(id, 'restore')}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        color="red"
                        loading={actingId === id}
                        disabled={actingId !== null}
                        onClick={() => void act(id, 'hide')}
                      >
                        Hide
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      loading={actingId === id}
                      disabled={actingId !== null}
                      onClick={() => setPendingDelete(id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      disabled={actingId !== null}
                      onClick={() =>
                        setSuspendTarget({
                          id: item.community!.author.id,
                          name: item.community!.author.displayName,
                        })
                      }
                    >
                      Suspend author
                    </Button>
                  </Group>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}

      <SuspendUserModal
        opened={suspendTarget !== null}
        userId={suspendTarget?.id ?? ''}
        userName={suspendTarget?.name ?? ''}
        onClose={() => setSuspendTarget(null)}
        onSuspended={refresh}
      />
      <ConfirmActionModal
        opened={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        title="Delete this publication?"
        message="It will be removed for everyone and can't be restored."
        confirmLabel="Delete"
        confirmColor="red"
        onConfirm={() => {
          const id = pendingDelete;
          setPendingDelete(null);
          if (id) void act(id, 'delete');
        }}
      />

      {hasMore && (
        <Group justify="center">
          <Button
            variant="light"
            color={accent.primary}
            loading={loadingMore}
            onClick={loadMore}
          >
            Load more
          </Button>
        </Group>
      )}
    </Stack>
  );
}
