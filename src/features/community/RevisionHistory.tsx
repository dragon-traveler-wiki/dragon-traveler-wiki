import { Box, Divider, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { IoCalendarOutline, IoTimeOutline } from 'react-icons/io5';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import PaginationControl from '@/components/ui/PaginationControl';
import {
  getPageSizeStorageKey,
  usePageSize,
  usePagination,
} from '@/hooks/use-pagination';
import { formatExactDate, formatShortDate } from '@/utils/timestamps';
import { getRevisions } from './api';
import type { CommunityKind, CommunityRevision } from './types';

const PAGE_SIZE = 5;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 30] as const;

interface RevisionHistoryProps {
  kind: CommunityKind;
  id: string;
  /** When the item was first published (unix seconds). */
  publishedAt?: number;
}

/**
 * Edit history for a published item. Deliberately mirrors the "Change
 * History" section on the wiki's data pages (`ChangeHistory`) so both read
 * the same way.
 */
export default function RevisionHistory({
  kind,
  id,
  publishedAt,
}: RevisionHistoryProps) {
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

  const sorted = useMemo(
    () => [...(revisions ?? [])].sort((a, b) => b.revision - a.revision),
    [revisions],
  );

  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    PAGE_SIZE_OPTIONS,
    {
      defaultSize: PAGE_SIZE,
      storageKey: getPageSizeStorageKey('edit-history'),
    },
  );
  const { page, setPage, totalPages, offset } = usePagination(
    sorted.length,
    pageSize,
    `${id}:${sorted.length}`,
  );

  // Nothing to show while loading or if it was never edited; a placeholder
  // would only appear and vanish for unedited items.
  if (revisions === null || revisions.length === 0) return null;

  const visible = sorted.slice(offset, offset + pageSize);

  return (
    <Box>
      <CollapsibleSectionCard
        defaultExpanded={false}
        header={
          <Stack gap={2}>
            <Group gap="sm" align="center">
              <Title order={2} size="h3">
                Edit History
              </Title>
              <Text size="sm" c="dimmed" fw={500}>
                {sorted.length} edit{sorted.length !== 1 ? 's' : ''}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Who edited this publication and when.
            </Text>
          </Stack>
        }
      >
        <Stack gap="md">
          {publishedAt ? (
            <Paper p="xs" withBorder radius="md" bg="var(--mantine-color-body)">
              <Group gap="xs" align="flex-start" wrap="nowrap">
                <IoCalendarOutline
                  size={14}
                  color="var(--mantine-color-dimmed)"
                />
                <Stack gap={0}>
                  <Text size="sm" c="dimmed" fw={500}>
                    Published on {formatShortDate(publishedAt)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {formatExactDate(publishedAt)}
                  </Text>
                </Stack>
              </Group>
            </Paper>
          ) : null}

          <Stack gap="sm">
            {visible.map((revision, index) => (
              <Box key={revision.revision}>
                {index > 0 && <Divider mb="sm" />}
                <Paper p="sm" withBorder radius="md">
                  <Group
                    justify="space-between"
                    align="flex-start"
                    gap="sm"
                    wrap="nowrap"
                  >
                    <Group gap="xs" align="flex-start" wrap="nowrap">
                      <IoTimeOutline
                        size={13}
                        color="var(--mantine-color-dimmed)"
                      />
                      <Stack gap={0}>
                        <Text size="sm" fw={600}>
                          {formatShortDate(revision.createdAt)}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatExactDate(revision.createdAt)}
                        </Text>
                      </Stack>
                    </Group>
                    <Text size="xs" c="dimmed" ta="right">
                      Revision {revision.revision} • {revision.editorName}
                    </Text>
                  </Group>
                </Paper>
              </Box>
            ))}

            {totalPages > 1 && (
              <PaginationControl
                currentPage={page}
                totalPages={totalPages}
                onChange={setPage}
                totalItems={sorted.length}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={setPageSize}
              />
            )}
          </Stack>
        </Stack>
      </CollapsibleSectionCard>
    </Box>
  );
}
