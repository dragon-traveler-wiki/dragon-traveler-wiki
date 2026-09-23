import { Loader, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import { formatRelativeTime } from '@/utils';
import { getRevisions } from './api';
import type { CommunityKind, CommunityRevision } from './types';

interface RevisionHistoryProps {
  kind: CommunityKind;
  id: string;
}

export default function RevisionHistory({ kind, id }: RevisionHistoryProps) {
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
      <Stack gap={4}>
        {revisions.map((revision) => (
          <Text key={revision.revision} size="sm" c="dimmed">
            Revision {revision.revision} — edited by {revision.editorName}{' '}
            {formatRelativeTime(revision.createdAt)}
          </Text>
        ))}
      </Stack>
    </CollapsibleSectionCard>
  );
}
