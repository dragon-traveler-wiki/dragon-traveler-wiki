import { Badge, Card, Group, Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useGradientAccent } from '@/hooks';
import { formatExactDate } from '@/utils/timestamps';
import { getModerationActions } from './api';
import type { ModerationAction } from './types';

const ACTION_LABELS: Record<string, string> = {
  hide: 'Hid',
  restore: 'Restored',
  delete: 'Deleted',
  'dismiss-report': 'Dismissed report on',
  unsuspend: 'Lifted suspension of',
  'suspend-1d': 'Suspended (1 day)',
  'suspend-7d': 'Suspended (7 days)',
  'suspend-30d': 'Suspended (30 days)',
  'suspend-permanent': 'Banned',
  'set-reference': 'Set site reference tier list',
  'clear-reference': 'Cleared site reference tier list',
};

const ACTION_COLORS: Record<string, string> = {
  hide: 'orange',
  delete: 'red',
  restore: 'teal',
  unsuspend: 'teal',
  'suspend-permanent': 'red',
};

/** Read-only audit trail of moderator actions, newest first. */
export default function ModerationLog() {
  const { accent } = useGradientAccent();
  const [actions, setActions] = useState<ModerationAction[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getModerationActions()
      .then((result) => {
        if (!cancelled) setActions(result.actions);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <Text c="dimmed">Could not load the moderation log.</Text>;
  if (actions === null) return <Loader size="sm" color={accent.primary} />;
  if (actions.length === 0) return <Text c="dimmed">No actions yet.</Text>;

  return (
    <Stack gap="xs">
      {actions.map((action) => (
        <Card withBorder key={action.id} p="sm">
          <Stack gap={4}>
            <Group gap="xs" wrap="wrap">
              <Badge
                variant="light"
                color={ACTION_COLORS[action.action] ?? accent.primary}
              >
                {ACTION_LABELS[action.action] ?? action.action}
              </Badge>
              <Text size="sm" fw={600}>
                {action.target_label ?? action.target_id}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              by {action.moderator_name} · {formatExactDate(action.created_at)}
            </Text>
            {action.note && <Text size="sm">{action.note}</Text>}
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
