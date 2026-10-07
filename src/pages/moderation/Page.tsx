import {
  Alert,
  Anchor,
  Badge,
  Button,
  Container,
  Group,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@mantine/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  CommunityCardsLoading,
  ListRouteLoading,
} from '@/components/layout/PageLoadingSkeleton';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DataFetchError from '@/components/ui/DataFetchError';
import { StaticSurface } from '@/components/ui/Surface';
import { getReports, resolveReport } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import ModeratedItemsBrowser from '@/features/community/ModeratedItemsBrowser';
import ModerationLog from '@/features/community/ModerationLog';
import PagedGrid from '@/features/community/PagedGrid';
import {
  capitalize,
  REPORT_REASON_LABELS,
  REPORT_STATUS_DISPLAY,
} from '@/features/community/report-status';
import type { AdminReport } from '@/features/community/types';
import SuspendUserModal from '@/features/community/SuspendUserModal';
import { useGradientAccent, useTabParam } from '@/hooks';
import { formatShortDate } from '@/utils/timestamps';
import { runAction, toError } from '@/features/community/run-action';

type ReportFilter = 'open' | 'closed';
type ReportAction = 'restore' | 'hide' | 'dismiss' | 'delete';

function reportedItemPath(report: AdminReport): string {
  return report.kind === 'team'
    ? `/teams/${report.item_id}/${report.slug}`
    : `/tier-list/${report.item_id}/${report.slug}`;
}

function UserLink({ id, name }: { id: string; name: string }) {
  return (
    <Anchor component={Link} to={`/profile/${id}`} target="_blank" size="sm">
      {name}
    </Anchor>
  );
}

export default function ModerationPage() {
  const { user, csrfToken, loading, refresh } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [reportsError, setReportsError] = useState<Error | null>(null);
  const [activeTab, setActiveTab] = useTabParam('tab', 'reports', [
    'reports',
    'browse',
    'log',
  ]);
  const [filter, setFilter] = useState<ReportFilter>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<{
    id: string;
    action: ReportAction;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Refetches in place: the list stays on screen (no spinner) so acting on a
  // report doesn't collapse the page and lose the scroll position.
  const userId = user?.id;
  const isModerator = user?.role === 'moderator';
  const load = useCallback(() => {
    if (!userId || !isModerator) return;
    getReports()
      .then((result) => {
        setReports(result.reports);
        setReportsError(null);
      })
      .catch((error: unknown) => setReportsError(toError(error)))
      .finally(() => setReportsLoaded(true));
  }, [userId, isModerator]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const openReports = useMemo(
    () => reports.filter((report) => report.status === 'open'),
    [reports],
  );
  const closedReports = useMemo(
    () => reports.filter((report) => report.status !== 'open'),
    [reports],
  );
  const shown = filter === 'open' ? openReports : closedReports;

  const act = async (id: string, action: ReportAction) => {
    if (!csrfToken) return;
    setActing({ id, action });
    const result = await runAction(
      () => resolveReport(id, action, notes[id] ?? '', csrfToken),
      {
        errorTitle: 'Moderation action failed',
        success: { title: 'Done', message: 'Report resolved.' },
      },
    );
    if (result.ok) {
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      load();
      void refresh();
    }
    setActing(null);
  };

  if (loading)
    return (
      <ListRouteLoading containerSize="lg" tabs={3} actions={false}>
        <CommunityCardsLoading kind="report" cards={3} />
      </ListRouteLoading>
    );
  if (!user)
    return (
      <Container size="sm" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="md">
          <ListPageHeader title="Moderation" />
          <Alert
            color={accent.primary}
            variant="light"
            title="Sign in required"
          >
            <Stack gap="sm" align="flex-start">
              <Text size="sm">
                Sign in with a moderator account to continue.
              </Text>
              <Button
                component={Link}
                to="/account"
                size="xs"
                color={accent.primary}
              >
                Sign in
              </Button>
            </Stack>
          </Alert>
        </Stack>
      </Container>
    );
  if (!isModerator)
    return (
      <Container size="sm" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="md">
          <ListPageHeader title="Moderation" />
          <Alert color="red" variant="light" title="Access restricted">
            Moderator access is required.
          </Alert>
        </Stack>
      </Container>
    );

  const renderReport = (report: AdminReport) => {
    const status = REPORT_STATUS_DISPLAY[report.status];
    const isOpen = report.status === 'open';
    const actionProps = (action: ReportAction) => ({
      loading: acting?.id === report.id && acting.action === action,
      disabled: acting !== null,
    });
    return (
      <StaticSurface p="md">
        <Stack gap="xs">
          <Group justify="space-between" wrap="wrap">
            <Anchor
              component={Link}
              to={reportedItemPath(report)}
              target="_blank"
              fw={600}
            >
              {report.title}
            </Anchor>
            <Text size="sm" c="dimmed">
              By <UserLink id={report.author_id} name={report.author_name} /> ·
              reported by{' '}
              <UserLink
                id={report.reporter_user_id}
                name={report.reporter_name}
              />
              {' · '}
              {formatShortDate(report.created_at)}
            </Text>
          </Group>
          <Group gap="xs">
            <Badge variant="light" color={accent.primary}>
              {REPORT_REASON_LABELS[report.reason] ?? report.reason}
            </Badge>
            <Badge variant="filled" color={status.color}>
              {status.label}
            </Badge>
            <Badge
              variant="outline"
              color={report.item_status === 'published' ? 'gray' : 'red'}
            >
              {capitalize(report.item_status)}
            </Badge>
          </Group>
          {Boolean(report.note) && <Text size="sm">{report.note}</Text>}
          {isOpen ? (
            <>
              <Textarea
                aria-label="Resolution note"
                placeholder="Add a resolution note (optional)..."
                autosize
                minRows={1}
                maxLength={1000}
                value={notes[report.id] ?? ''}
                onChange={(event) =>
                  setNotes((prev) => ({
                    ...prev,
                    [report.id]: event.currentTarget.value,
                  }))
                }
              />
              <Group>
                {report.item_status === 'hidden' ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    {...actionProps('restore')}
                    onClick={() => void act(report.id, 'restore')}
                  >
                    Restore
                  </Button>
                ) : (
                  <Button
                    size="xs"
                    variant="light"
                    color="orange"
                    {...actionProps('hide')}
                    onClick={() => void act(report.id, 'hide')}
                  >
                    Hide
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="light"
                  color="gray"
                  {...actionProps('dismiss')}
                  onClick={() => void act(report.id, 'dismiss')}
                >
                  Dismiss
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  {...actionProps('delete')}
                  onClick={() => setPendingDelete(report.id)}
                >
                  Delete
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  color="red"
                  disabled={acting !== null}
                  onClick={() =>
                    setSuspendTarget({
                      id: report.author_id,
                      name: report.author_name,
                    })
                  }
                >
                  Suspend author
                </Button>
              </Group>
            </>
          ) : (
            Boolean(report.resolution_note) && (
              <Text size="sm" c="dimmed">
                Moderator note: {report.resolution_note}
              </Text>
            )
          )}
        </Stack>
      </StaticSurface>
    );
  };

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <ListPageHeader title="Moderation" />
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab
              value="reports"
              rightSection={
                openReports.length > 0 ? (
                  <Badge size="xs" color="red" circle>
                    {openReports.length}
                  </Badge>
                ) : undefined
              }
            >
              Reports
            </Tabs.Tab>
            <Tabs.Tab value="browse">Browse content</Tabs.Tab>
            <Tabs.Tab value="log">Log</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="reports" pt="md">
            <Stack gap="md">
              <SegmentedControl
                aria-label="Filter reports"
                value={filter}
                onChange={(value) => setFilter(value as ReportFilter)}
                data={[
                  { label: `Open (${openReports.length})`, value: 'open' },
                  {
                    label: `Closed (${closedReports.length})`,
                    value: 'closed',
                  },
                ]}
                style={{ alignSelf: 'flex-start' }}
              />
              {reportsError && (
                <DataFetchError
                  title="Could not load reports"
                  message={reportsError.message}
                  onRetry={load}
                />
              )}
              {!reportsLoaded ? (
                <CommunityCardsLoading kind="report" cards={3} />
              ) : (
                !(reportsError && reports.length === 0) && (
                  <PagedGrid
                    items={shown}
                    getKey={(report) => report.id}
                    renderItem={renderReport}
                    emptyMessage={
                      filter === 'open'
                        ? 'No open reports.'
                        : 'No closed reports.'
                    }
                    storageKey={`moderation-reports-${filter}`}
                    cols={{ base: 1 }}
                  />
                )
              )}
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="browse" pt="md" keepMounted={false}>
            <ModeratedItemsBrowser
              onChanged={() => {
                load();
                void refresh();
              }}
            />
          </Tabs.Panel>
          {/* Unmounted when hidden so it refetches each time it's opened. */}
          <Tabs.Panel value="log" pt="md" keepMounted={false}>
            <ModerationLog />
          </Tabs.Panel>
        </Tabs>
        <SuspendUserModal
          opened={suspendTarget !== null}
          userId={suspendTarget?.id ?? ''}
          userName={suspendTarget?.name ?? ''}
          onClose={() => setSuspendTarget(null)}
          onSuspended={load}
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
      </Stack>
    </Container>
  );
}
