import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  ScrollArea,
  Skeleton,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { IoCalendarOutline, IoInformationCircleOutline } from 'react-icons/io5';
import FilterToolbar from '@/components/layout/FilterToolbar';
import ListPageHeader from '@/components/layout/ListPageHeader';
import PageFilterHeaderControls from '@/components/layout/PageFilterHeaderControls';
import { EventCardsLoading } from '@/components/layout/PageLoadingSkeleton';
import DataFetchError from '@/components/ui/DataFetchError';
import EmptyState from '@/components/ui/EmptyState';
import PaginationControl from '@/components/ui/PaginationControl';
import { IMAGE_SIZE } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import EventCollection from '@/features/wiki/events/components/EventCollection';
import EventFilter from '@/features/wiki/events/components/EventFilter';
import { useEventsPage } from '@/features/wiki/events/hooks/use-events-page';
import type { GameEvent } from '@/features/wiki/events/types';
import { useGradientAccent, useIsMobile } from '@/hooks';

interface EventsPageContentProps {
  events: GameEvent[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  portraitByReference: Map<string, string>;
  characterByIdentity: Map<string, Character>;
}

export default function EventsPageContent({
  events,
  loading,
  error,
  onRetry,
  portraitByReference,
  characterByIdentity,
}: EventsPageContentProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();
  const pageState = useEventsPage(events);
  const filter = (
    <EventFilter
      filters={pageState.filters}
      onChange={pageState.setFilters}
      serverOptions={pageState.serverOptions}
      typeOptions={pageState.typeOptions}
      characterOptions={pageState.characterOptions}
      portraitByReference={portraitByReference}
    />
  );

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Events" timestamp={pageState.mostRecentUpdate}>
          {!isMobile && !loading && !error ? (
            <PageFilterHeaderControls
              viewMode={pageState.viewMode}
              onViewModeChange={pageState.setViewMode}
              filterCount={pageState.activeFilterCount}
              filterOpen={pageState.filterOpen}
              onFilterToggle={pageState.toggleFilter}
            >
              {filter}
            </PageFilterHeaderControls>
          ) : null}
          {!isMobile && loading ? (
            <Group gap="xs" wrap="nowrap" aria-hidden="true">
              <Skeleton height={30} width={72} radius="md" />
              <Skeleton height={30} width={36} radius="md" />
            </Group>
          ) : null}
        </ListPageHeader>

        {isMobile && loading ? (
          <Skeleton height={38} radius="md" aria-hidden="true" />
        ) : null}
        {isMobile && !loading && !error ? (
          <FilterToolbar
            count={pageState.filtered.length}
            noun="event"
            viewMode={pageState.viewMode}
            onViewModeChange={pageState.setViewMode}
            filterCount={pageState.activeFilterCount}
            filterOpen={pageState.filterOpen}
            onFilterToggle={pageState.toggleFilter}
          >
            {filter}
          </FilterToolbar>
        ) : null}

        <Alert
          icon={<IoInformationCircleOutline size={IMAGE_SIZE.ICON_LG} />}
          color={accent.primary}
          variant="light"
        >
          <Text size="sm">
            Event tracking began on <strong>March 9, 2026</strong>. Events
            active before this date may be missing or have incomplete start
            dates.
          </Text>
        </Alert>

        <Tabs value={pageState.tab} onChange={pageState.setTab}>
          <ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
            <Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
              <Tabs.Tab
                value="active"
                rightSection={
                  pageState.activeCount > 0 ? (
                    <Badge size="xs" variant="light" color={accent.primary}>
                      {pageState.activeCount}
                    </Badge>
                  ) : undefined
                }
              >
                Active Events
              </Tabs.Tab>
              <Tabs.Tab
                value="past"
                rightSection={
                  pageState.pastCount > 0 ? (
                    <Badge size="xs" variant="light" color={accent.primary}>
                      {pageState.pastCount}
                    </Badge>
                  ) : undefined
                }
              >
                Past Events
              </Tabs.Tab>
            </Tabs.List>
          </ScrollArea>
        </Tabs>

        {loading ? (
          <EventCardsLoading viewMode={pageState.viewMode} showPagination />
        ) : null}
        {!loading && error ? (
          <DataFetchError
            title="Could not load events"
            message={error.message}
            onRetry={onRetry}
          />
        ) : null}
        {!loading && !error && pageState.filtered.length === 0 ? (
          <EmptyState
            icon={<IoCalendarOutline size={32} />}
            title={
              pageState.tab === 'active' ? 'No active events' : 'No past events'
            }
            description={
              pageState.activeFilterCount > 0
                ? `No ${pageState.tab} events match the current filters.`
                : pageState.tab === 'active'
                  ? 'There are no active events right now. Check back later!'
                  : 'No past events have been recorded yet.'
            }
            color={accent.primary}
            action={
              pageState.activeFilterCount > 0 ? (
                <Button
                  size="xs"
                  variant="light"
                  color={accent.primary}
                  onClick={pageState.resetFilters}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : null}
        {!loading && !error && pageState.pageItems.length > 0 ? (
          <EventCollection
            entries={pageState.pageItems}
            viewMode={pageState.viewMode}
            characterByIdentity={characterByIdentity}
          />
        ) : null}
        {!loading && !error ? (
          <PaginationControl
            currentPage={pageState.page}
            totalPages={pageState.totalPages}
            onChange={pageState.setPage}
            totalItems={pageState.filtered.length}
            pageSize={pageState.pageSize}
            pageSizeOptions={pageState.pageSizeOptions}
            onPageSizeChange={pageState.setPageSize}
            scrollToTop
          />
        ) : null}
      </Stack>
    </Container>
  );
}
