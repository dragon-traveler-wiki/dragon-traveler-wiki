import { Badge, Group, Loader, Text, Timeline } from '@mantine/core';
import { useEffect, useState } from 'react';
import { IoCreateOutline } from 'react-icons/io5';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import { useGradientAccent } from '@/hooks';
import { formatRelativeTime, formatShortDate } from '@/utils/timestamps';
import { getRevisions } from './api';
import type { CommunityKind, CommunityRevision } from './types';

interface RevisionHistoryProps {
  kind: CommunityKind;
  id: string;
}

/** Edit history for a published item, styled like the site changelog timeline. */
export default function RevisionHistory({ kind, id }: RevisionHistoryProps) {
  const { accent } = useGradientAccent();
  const [revisions, setRevisions] = useState<CommunityRevision[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRevisions(kind, id)
      .then((result) => {
        if (!cancelled) setRevisions(result.revisions);
      })
      .catch(() => {
        if (!cancelled) setRevisions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, id]);

  if (revisions === null) return <Loader size="xs" />;
  if (revisions.length === 0) return null;

  return (
    <CollapsibleSectionCard color="gray" header="Edit history">
      <Timeline
        active={-1}
        bulletSize={28}
        lineWidth={2}
        color={accent.primary}
      >
        {revisions.map((revision) => (
          <Timeline.Item
            key={revision.revision}
            bullet={<IoCreateOutline size={14} />}
            title={
              <Group gap="xs" wrap="wrap" align="center">
                <Text fw={600} size="sm">
                  {formatShortDate(revision.createdAt)}
                </Text>
                <Badge size="xs" variant="light" color={accent.primary}>
                  Revision {revision.revision}
                </Badge>
              </Group>
            }
          >
            <Text size="xs" c="dimmed">
              Edited by {revision.editorName} ·{' '}
              {formatRelativeTime(revision.createdAt)}
            </Text>
          </Timeline.Item>
        ))}
      </Timeline>
    </CollapsibleSectionCard>
  );
}
