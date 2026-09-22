import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { getReports, resolveReport } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import { useGradientAccent } from '@/hooks';
import { showErrorToast } from '@/utils/toast';

export default function ModerationPage() {
  const { user, csrfToken, loading } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [reports, setReports] = useState<Array<Record<string, unknown>>>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const load = useCallback(() => {
    if (user?.role !== 'moderator') return;
    setReportsLoading(true);
    getReports()
      .then((result) => setReports(result.reports))
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
    try {
      await resolveReport(id, action, '', csrfToken);
      load();
    } catch (error) {
      showErrorToast({
        title: 'Moderation action failed',
        message: error instanceof Error ? error.message : String(error),
      });
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
        {reportsLoading ? (
          <Loader color={accent.primary} />
        ) : reports.length === 0 ? (
          <Text c="dimmed">No reports.</Text>
        ) : (
          reports.map((report) => (
            <Card withBorder key={String(report.id)}>
              <Stack gap="xs">
                <Title order={3}>{String(report.title)}</Title>
                <Group gap="xs">
                  <Badge variant="light" color={accent.primary}>
                    {String(report.reason)}
                  </Badge>
                  <Badge variant="outline" color={accent.secondary}>
                    Report {String(report.status)}
                  </Badge>
                  <Badge
                    variant="outline"
                    color={report.item_status === 'hidden' ? 'red' : 'gray'}
                  >
                    Item {String(report.item_status)}
                  </Badge>
                </Group>
                {Boolean(report.note) && (
                  <Text size="sm">{String(report.note)}</Text>
                )}
                <Group>
                  {report.item_status === 'hidden' ? (
                    <Button
                      size="xs"
                      color="teal"
                      onClick={() => void act(String(report.id), 'restore')}
                    >
                      Restore
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      color="red"
                      onClick={() => void act(String(report.id), 'hide')}
                    >
                      Hide
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="light"
                    color={accent.primary}
                    onClick={() => void act(String(report.id), 'dismiss')}
                  >
                    Dismiss
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    onClick={() => void act(String(report.id), 'delete')}
                  >
                    Delete
                  </Button>
                </Group>
              </Stack>
            </Card>
          ))
        )}
      </Stack>
    </Container>
  );
}
