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
import { showErrorToast } from '@/utils/toast';

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
  created_at: number;
}

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
            <Tabs.Tab value="reports">Reports</Tabs.Tab>
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
                          Reported by {report.reporter_name}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Badge variant="light" color={accent.primary}>
                          {report.reason}
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
                          onClick={() => void act(report.id, 'delete')}
                        >
                          Delete
                        </Button>
                      </Group>
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
      </Stack>
    </Container>
  );
}
