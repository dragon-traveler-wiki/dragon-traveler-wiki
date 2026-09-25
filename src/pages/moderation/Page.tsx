import {
  Alert,
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Tabs,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getReports, resolveReport } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import ModeratedItemsBrowser from '@/features/community/ModeratedItemsBrowser';
import { useGradientAccent } from '@/hooks';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface Report {
  id: string;
  item_id: string;
  kind: 'team' | 'tier_list';
  slug: string;
  title: string;
  reason: string;
  note: string;
  status: string;
  item_status: string;
  reporter_name: string;
  author_id: string;
  author_name: string;
  resolution_note: string;
  created_at: number;
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  broken: 'Broken or invalid data',
  abusive: 'Abusive content',
  other: 'Other',
};

function reportedItemPath(report: Report): string {
  return report.kind === 'team'
    ? `/teams/${report.item_id}/${report.slug}`
    : `/tier-list/${report.item_id}/${report.slug}`;
}

export default function ModerationPage() {
  const { user, csrfToken, loading } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const load = useCallback(() => {
    if (user?.role !== 'moderator') return;
    setReportsLoading(true);
    getReports()
      .then((result) => setReports(result.reports as unknown as Report[]))
      .catch((error: unknown) =>
        showErrorToast({
          title: 'Could not load reports',
          message: error instanceof Error ? error.message : String(error),
        }),
      )
      .finally(() => setReportsLoading(false));
  }, [user]);
  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const act = async (id: string, action: string) => {
    if (!csrfToken) return;
    setActingId(id);
    try {
      await resolveReport(id, action, notes[id] ?? '', csrfToken);
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      showSuccessToast({ title: 'Done', message: 'Report resolved.' });
      load();
    } catch (error) {
      showErrorToast({
        title: 'Moderation action failed',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setActingId(null);
    }
  };

  const openCount = reports.filter((report) => report.status === 'open').length;

  if (loading)
    return (
      <Container py="xl">
        <Loader color={accent.primary} />
      </Container>
    );
  if (user?.role !== 'moderator')
    return (
      <Container size="sm" py={{ base: 'lg', sm: 'xl' }}>
        <Alert color="red" variant="light" title="Access restricted">
          Moderator access is required.
        </Alert>
      </Container>
    );
  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Title order={1}>Moderation</Title>
        <Tabs defaultValue="reports">
          <Tabs.List>
            <Tabs.Tab
              value="reports"
              rightSection={
                openCount > 0 ? (
                  <Badge size="xs" color="red" circle>
                    {openCount}
                  </Badge>
                ) : undefined
              }
            >
              Reports
            </Tabs.Tab>
            <Tabs.Tab value="browse">Browse content</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="reports" pt="md">
            <Stack gap="lg">
              {reportsLoading ? (
                <Loader color={accent.primary} />
              ) : reports.length === 0 ? (
                <Text c="dimmed">No reports.</Text>
              ) : (
                reports.map((report) => (
                  <Card withBorder key={report.id}>
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
                          By{' '}
                          <Anchor
                            component={Link}
                            to={`/profile/${report.author_id}`}
                            target="_blank"
                            size="sm"
                          >
                            {report.author_name}
                          </Anchor>{' '}
                          · reported by {report.reporter_name}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Badge variant="light" color={accent.primary}>
                          {REASON_LABELS[report.reason] ?? report.reason}
                        </Badge>
                        <Badge variant="outline" color={accent.secondary}>
                          Report {report.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          color={
                            report.item_status === 'hidden' ? 'red' : 'gray'
                          }
                        >
                          Item {report.item_status}
                        </Badge>
                      </Group>
                      {Boolean(report.note) && (
                        <Text size="sm">{report.note}</Text>
                      )}
                      {report.status === 'open' ? (
                        <>
                          <Textarea
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
                                color="teal"
                                loading={actingId === report.id}
                                disabled={actingId !== null}
                                onClick={() => void act(report.id, 'restore')}
                              >
                                Restore
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                color="red"
                                loading={actingId === report.id}
                                disabled={actingId !== null}
                                onClick={() => void act(report.id, 'hide')}
                              >
                                Hide
                              </Button>
                            )}
                            <Button
                              size="xs"
                              variant="light"
                              color={accent.primary}
                              loading={actingId === report.id}
                              disabled={actingId !== null}
                              onClick={() => void act(report.id, 'dismiss')}
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              loading={actingId === report.id}
                              disabled={actingId !== null}
                              onClick={() => setPendingDelete(report.id)}
                            >
                              Delete
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
                  </Card>
                ))
              )}
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="browse" pt="md">
            <ModeratedItemsBrowser />
          </Tabs.Panel>
        </Tabs>
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
