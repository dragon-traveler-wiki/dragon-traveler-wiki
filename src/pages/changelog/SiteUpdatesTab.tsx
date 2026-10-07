import {
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  Stack,
  Text,
  Timeline,
} from '@mantine/core';
import { IoCheckmarkCircle, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import { formatIsoDate } from '@/utils/timestamps';
import DataFetchError from '@/components/ui/DataFetchError';
import PaginationControl from '@/components/ui/PaginationControl';
import { IMAGE_SIZE } from '@/constants/ui';
import type { GradientPaletteAccents } from '@/contexts';
import type { ChangelogEntry } from '@/features/wiki/changelog/types';

const CHANGE_TYPE_COLORS: Record<string, string> = {
  added: 'green',
  updated: 'blue',
  fixed: 'orange',
  removed: 'red',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface SiteUpdatesTabProps {
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  changelog: ChangelogEntry[];
  paginatedChangelog: ChangelogEntry[];
  offset: number;
  expandedEntries: Set<number>;
  onToggleEntry: (id: number) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onClearExpanded: () => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (pageSize: number) => void;
  accent: GradientPaletteAccents;
}

export default function SiteUpdatesTab({
  loading,
  error,
  onRetry,
  changelog,
  paginatedChangelog,
  offset,
  expandedEntries,
  onToggleEntry,
  page,
  totalPages,
  onPageChange,
  onClearExpanded,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  accent,
}: SiteUpdatesTabProps) {
  return (
    <Stack gap="lg">
      {loading && (
        <ViewModeLoading
          viewMode="list"
          showPagination
          label="Loading updates"
        />
      )}

      {!loading && error && (
        <DataFetchError
          title="Could not load changelog"
          message={error.message}
          onRetry={onRetry}
        />
      )}

      {!loading && !error && changelog.length === 0 && (
        <Text c="dimmed" ta="center" py="lg">
          No changelog entries available yet.
        </Text>
      )}

      {!loading && !error && changelog.length > 0 && (
        <>
          <Timeline active={-1} bulletSize={28} lineWidth={2}>
            {paginatedChangelog.map((entry, entryIndex) => {
              const entryId = offset + entryIndex;
              const isExpanded = expandedEntries.has(entryId);

              const categories = [
                ...new Set(entry.changes.map((c) => c.category)),
              ];
              const byCategory = categories.map((cat) => ({
                category: cat,
                changes: entry.changes.filter((c) => c.category === cat),
              }));

              return (
                <Timeline.Item
                  // Dates aren't unique (two releases can ship the same day).
                  key={`${entry.date}-${entry.version ?? entryId}`}
                  color={accent.primary}
                  bullet={<IoCheckmarkCircle size={IMAGE_SIZE.ICON_LG} />}
                  title={
                    <Group
                      justify="space-between"
                      wrap="nowrap"
                      gap="xs"
                      align="flex-start"
                    >
                      <Group
                        gap="xs"
                        wrap="wrap"
                        align="center"
                        style={{ flex: 1, minWidth: 0 }}
                      >
                        <Text fw={600} size="sm">
                          {formatIsoDate(entry.date)}
                        </Text>
                        {entry.version && (
                          <Badge
                            size="xs"
                            variant="light"
                            color={accent.primary}
                          >
                            v{entry.version}
                          </Badge>
                        )}
                        <Badge size="xs" variant="light" color="gray">
                          {entry.changes.length} change
                          {entry.changes.length !== 1 ? 's' : ''}
                        </Badge>
                      </Group>
                      <Button
                        size="compact-xs"
                        variant="subtle"
                        color={accent.primary}
                        onClick={() => onToggleEntry(entryId)}
                        aria-expanded={isExpanded}
                        rightSection={
                          isExpanded ? (
                            <IoChevronUp size={12} />
                          ) : (
                            <IoChevronDown size={12} />
                          )
                        }
                        style={{ flexShrink: 0 }}
                      >
                        {isExpanded ? 'Minimize' : 'Expand'}
                      </Button>
                    </Group>
                  }
                >
                  <Collapse expanded={isExpanded}>
                    <Paper p="sm" withBorder radius="md" mt="xs">
                      <Stack gap={6}>
                        {byCategory.map(({ category, changes }) => (
                          <Paper
                            key={category}
                            p="xs"
                            withBorder
                            radius="sm"
                            bg="var(--mantine-color-default)"
                          >
                            <Group gap="xs" align="center" mb={6}>
                              <Badge
                                size="xs"
                                variant="light"
                                color={accent.secondary}
                              >
                                {category}
                              </Badge>
                            </Group>
                            <Stack gap={4}>
                              {changes.map((change, changeIndex) => (
                                <Group
                                  // The changelog can repeat an identical line within a release.
                                  key={`${change.type}-${changeIndex}-${change.description}`}
                                  gap="xs"
                                  wrap="nowrap"
                                  align="flex-start"
                                >
                                  <Badge
                                    size="xs"
                                    variant="dot"
                                    color={CHANGE_TYPE_COLORS[change.type]}
                                    style={{
                                      flexShrink: 0,
                                      marginTop: 2,
                                    }}
                                  >
                                    {capitalize(change.type)}
                                  </Badge>
                                  <Text size="sm">{change.description}</Text>
                                </Group>
                              ))}
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Paper>
                  </Collapse>
                </Timeline.Item>
              );
            })}
          </Timeline>

          <PaginationControl
            currentPage={page}
            totalPages={totalPages}
            onChange={(p) => {
              onPageChange(p);
              onClearExpanded();
            }}
            totalItems={changelog.length}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={onPageSizeChange}
            scrollToTop
          />
        </>
      )}
    </Stack>
  );
}
