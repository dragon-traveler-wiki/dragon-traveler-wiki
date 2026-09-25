import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { useGradientAccent } from '@/hooks';
import { formatShortDate } from '@/utils/timestamps';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { withdrawReport } from './api';
import { useCommunityAuth } from './auth-context';
import PagedGrid from './PagedGrid';
import {
  capitalize,
  REPORT_REASON_LABELS,
  REPORT_STATUS_DISPLAY,
} from './report-status';
import type { MyReport } from './types';

type Filter = 'open' | 'closed';

interface MyReportsProps {
  reports: MyReport[];
  loading: boolean;
  onWithdrawn: (id: string) => void;
}

/** Reports the signed-in user filed, split into open and closed, with withdraw. */
export default function MyReports({
  reports,
  loading,
  onWithdrawn,
}: MyReportsProps) {
  const { accent } = useGradientAccent();
  const { csrfToken } = useCommunityAuth();
  const [filter, setFilter] = useState<Filter>('open');
  const [pendingWithdraw, setPendingWithdraw] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const open = useMemo(
    () => reports.filter((report) => report.status === 'open'),
    [reports],
  );
  const closed = useMemo(
    () => reports.filter((report) => report.status !== 'open'),
    [reports],
  );
  const shown = filter === 'open' ? open : closed;

  const withdraw = async () => {
    const id = pendingWithdraw;
    setPendingWithdraw(null);
    if (!id || !csrfToken) return;
    setWithdrawing(true);
    try {
      await withdrawReport(id, csrfToken);
      showSuccessToast({
        title: 'Report withdrawn',
        message: 'A moderator will no longer review it.',
      });
      onWithdrawn(id);
    } catch (error) {
      showErrorToast({
        title: 'Could not withdraw report',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const renderReport = (report: MyReport) => {
    const status = REPORT_STATUS_DISPLAY[report.status];
    const path =
      report.kind === 'team'
        ? `/teams/${report.item_id}/${report.slug}`
        : `/tier-list/${report.item_id}/${report.slug}`;
    return (
      <Card withBorder>
        <Stack gap={4}>
          <Group justify="space-between" wrap="wrap">
            <Anchor component={Link} to={path} fw={600}>
              {report.title}
            </Anchor>
            <Text size="xs" c="dimmed">
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
            {report.item_status !== 'published' && (
              <Badge variant="outline" color="red">
                {capitalize(report.item_status)}
              </Badge>
            )}
          </Group>
          {report.resolution_note && (
            <Text size="sm" c="dimmed">
              Moderator note: {report.resolution_note}
            </Text>
          )}
          {report.status === 'open' && (
            <Group>
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                loading={withdrawing}
                onClick={() => setPendingWithdraw(report.id)}
              >
                Withdraw report
              </Button>
            </Group>
          )}
        </Stack>
      </Card>
    );
  };

  return (
    <Stack>
      <Title order={2}>Your reports</Title>
      {loading ? (
        <Loader size="sm" color={accent.primary} />
      ) : reports.length === 0 ? (
        <Text c="dimmed">You have not reported anything.</Text>
      ) : (
        <>
          <SegmentedControl
            value={filter}
            onChange={(value) => setFilter(value as Filter)}
            data={[
              { label: `Open (${open.length})`, value: 'open' },
              { label: `Closed (${closed.length})`, value: 'closed' },
            ]}
            style={{ alignSelf: 'flex-start' }}
          />
          <PagedGrid
            items={shown}
            getKey={(report) => report.id}
            renderItem={renderReport}
            emptyMessage={
              filter === 'open' ? 'No open reports.' : 'No closed reports.'
            }
            storageKey={`account-reports-${filter}`}
            cols={{ base: 1 }}
          />
        </>
      )}
      <ConfirmActionModal
        opened={pendingWithdraw !== null}
        onCancel={() => setPendingWithdraw(null)}
        title="Withdraw this report?"
        message="Moderators will no longer see it. You can report the item again later if needed."
        confirmLabel="Withdraw"
        onConfirm={() => void withdraw()}
      />
    </Stack>
  );
}
