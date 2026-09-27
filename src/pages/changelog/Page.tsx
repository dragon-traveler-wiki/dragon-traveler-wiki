import { useChangelog } from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent, usePageSize, useTabParam } from '@/hooks';
import { getPageSizeStorageKey, usePagination } from '@/hooks/use-pagination';
import { Container, Stack, Tabs, Text, Title } from '@mantine/core';
import SiteUpdatesTab from './SiteUpdatesTab';
import DataHistoryTab from './DataHistoryTab';
import { useToggleSet } from './use-toggle-set';

const CHANGELOG_PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;
const SITE_PAGE_SIZE = 10;

export default function Changelog() {
  const { accent } = useGradientAccent();
  const { data: changelog, loading } = useChangelog();
  const [activeTab, handleTabChange] = useTabParam('tab', 'site', [
    'site',
    'data',
  ]);
  const {
    set: expandedEntries,
    toggle: toggleEntry,
    clear: clearEntries,
  } = useToggleSet<number>();

  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    CHANGELOG_PAGE_SIZE_OPTIONS,
    {
      defaultSize: SITE_PAGE_SIZE,
      storageKey: getPageSizeStorageKey('changelog:site'),
    },
  );

  const { page, setPage, totalPages, offset } = usePagination(
    changelog.length,
    pageSize,
    String(changelog.length),
  );
  const paginatedChangelog = changelog.slice(offset, offset + pageSize);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <div>
          <Title order={1}>Changelog</Title>
          <Text size="sm" c="dimmed" mt="xs">
            Track updates to the Dragon Traveler Wiki
          </Text>
        </div>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="site">Site Updates</Tabs.Tab>
            <Tabs.Tab value="data">Data History</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="site" pt="md">
            <SiteUpdatesTab
              loading={loading}
              changelog={changelog}
              paginatedChangelog={paginatedChangelog}
              offset={offset}
              expandedEntries={expandedEntries}
              onToggleEntry={toggleEntry}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              onClearExpanded={clearEntries}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              onPageSizeChange={setPageSize}
              accent={accent}
            />
          </Tabs.Panel>

          <Tabs.Panel value="data" pt="md">
            <DataHistoryTab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
