import { StaticSurface } from '@/components/ui/Surface';
import {
  CHARACTER_CARD,
  CHARACTER_GRID_COLS,
  CHARACTER_GRID_SPACING,
  CHARACTER_HERO,
} from '@/constants/ui';
import {
  Box,
  Container,
  Grid,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  type SimpleGridProps,
  Stack,
  Table,
  VisuallyHidden,
} from '@mantine/core';
import type { ReactNode } from 'react';

type ViewMode = 'grid' | 'list';

interface LoadingRegionProps {
  children: ReactNode;
  label?: string;
}

/** Keeps visual placeholders out of the accessibility tree and announces one status. */
export function LoadingRegion({
  children,
  label = 'Loading content',
}: LoadingRegionProps) {
  return (
    <Box aria-busy="true">
      <Box aria-hidden="true">{children}</Box>
      <VisuallyHidden role="status">{label}</VisuallyHidden>
    </Box>
  );
}

function ToolbarSkeleton() {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="xs">
      <Skeleton height={14} width={84} radius="sm" />
      <Group gap="xs" wrap="nowrap">
        <Skeleton height={30} width={72} radius="md" />
        <Skeleton height={30} width={36} radius="md" />
      </Group>
    </Group>
  );
}

function PaginationSkeleton() {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="xs">
      <Skeleton height={14} width={84} radius="sm" />
      <Skeleton height={30} width={190} radius="md" />
    </Group>
  );
}

function ListItemSkeleton() {
  return (
    <StaticSurface p="md">
      <Stack gap="xs">
        <Skeleton height={18} width="40%" radius="sm" />
        <Skeleton height={14} width="90%" radius="sm" />
        <Skeleton height={14} width="75%" radius="sm" />
      </Stack>
    </StaticSurface>
  );
}

function TableRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
      <Table style={{ minWidth: 640 }}>
        <Table.Thead>
          <Table.Tr>
            {[20, 35, 25, 20].map((width, index) => (
              <Table.Th key={index}>
                <Skeleton height={14} width={`${width}%`} radius="sm" />
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: rows }, (_, row) => (
            <Table.Tr key={row}>
              {[42, 72, 56, 64].map((width, column) => (
                <Table.Td key={column}>
                  <Skeleton height={14} width={width} radius="sm" />
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

interface CollectionLoadingProps {
  children: ReactNode;
  label: string;
  showPagination?: boolean;
  toolbar?: 'filters' | 'search';
}

function CollectionLoading({
  children,
  label,
  showPagination = false,
  toolbar = 'filters',
}: CollectionLoadingProps) {
  return (
    <LoadingRegion label={label}>
      <StaticSurface p="md" data-no-hover>
        <Stack gap="md">
          {toolbar === 'filters' ? (
            <ToolbarSkeleton />
          ) : (
            <Skeleton height={36} radius="md" />
          )}
          {children}
          {showPagination && <PaginationSkeleton />}
        </Stack>
      </StaticSurface>
    </LoadingRegion>
  );
}

const DEFAULT_SKELETON_ITEMS = 8;

export function ListPageLoading({
  showPagination = false,
}: {
  showPagination?: boolean;
}) {
  return (
    <CollectionLoading label="Loading list" showPagination={showPagination}>
      <Stack gap="sm">
        {Array.from({ length: DEFAULT_SKELETON_ITEMS }, (_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </Stack>
    </CollectionLoading>
  );
}

export function CardGridLoading({
  cardHeight = 200,
  showPagination = false,
}: {
  cardHeight?: number;
  showPagination?: boolean;
}) {
  return (
    <CollectionLoading
      label="Loading grid"
      toolbar="search"
      showPagination={showPagination}
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {Array.from({ length: DEFAULT_SKELETON_ITEMS }, (_, index) => (
          <Skeleton key={index} height={cardHeight} radius="md" />
        ))}
      </SimpleGrid>
    </CollectionLoading>
  );
}

export function ViewModeLoading({
  viewMode,
  cards = DEFAULT_SKELETON_ITEMS,
  cardHeight = 200,
  gridCols = { base: 1, sm: 2 },
  listType = 'cards',
  withToolbar = false,
  showPagination = false,
  label,
}: {
  viewMode: ViewMode;
  cards?: number;
  cardHeight?: number;
  gridCols?: SimpleGridProps['cols'];
  listType?: 'cards' | 'table';
  withToolbar?: boolean;
  showPagination?: boolean;
  label?: string;
}) {
  const content =
    viewMode === 'grid' ? (
      <SimpleGrid cols={gridCols} spacing="md">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} height={cardHeight} radius="md" />
        ))}
      </SimpleGrid>
    ) : listType === 'table' ? (
      <TableRowsSkeleton rows={cards} />
    ) : (
      <Stack gap="sm">
        {Array.from({ length: cards }, (_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </Stack>
    );

  return withToolbar ? (
    <CollectionLoading
      label={label ?? `Loading ${viewMode}`}
      showPagination={showPagination}
    >
      {content}
    </CollectionLoading>
  ) : (
    <LoadingRegion label={label ?? `Loading ${viewMode}`}>
      {content}
    </LoadingRegion>
  );
}

export function ListRouteLoading({
  children,
  containerSize = 'md',
  tabs = 0,
  description = false,
  actions = true,
}: {
  children: ReactNode;
  containerSize?: string;
  tabs?: number;
  description?: boolean;
  actions?: boolean;
}) {
  return (
    <Container size={containerSize} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group
          justify="space-between"
          align="center"
          wrap="wrap"
          aria-hidden="true"
        >
          <Stack gap={6}>
            <Skeleton height={36} width={220} radius="md" />
            {description && <Skeleton height={14} width={280} radius="sm" />}
          </Stack>
          {actions && (
            <Group gap="xs">
              <Skeleton height={30} width={72} radius="md" />
              <Skeleton height={30} width={72} radius="md" />
            </Group>
          )}
        </Group>
        {tabs > 0 && (
          <Group gap="xs" aria-hidden="true">
            {Array.from({ length: tabs }, (_, index) => (
              <Skeleton key={index} height={34} width={110} radius="md" />
            ))}
          </Group>
        )}
        {children}
      </Stack>
    </Container>
  );
}

export function ContentPageLoading() {
  return (
    <LoadingRegion label="Loading page">
      <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <Skeleton height={38} width="42%" radius="md" />
          <Skeleton height={16} width="70%" radius="sm" />
          {Array.from({ length: 3 }, (_, index) => (
            <Paper key={index} p="lg" radius="md" withBorder>
              <Stack gap="sm">
                <Skeleton height={22} width="35%" radius="sm" />
                <Skeleton height={14} width="95%" radius="sm" />
                <Skeleton height={14} width="82%" radius="sm" />
                <Skeleton height={14} width="68%" radius="sm" />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Container>
    </LoadingRegion>
  );
}

export function CharacterListLoading({ viewMode }: { viewMode: ViewMode }) {
  return (
    <CollectionLoading label="Loading characters" showPagination>
      {viewMode === 'grid' ? (
        <SimpleGrid cols={CHARACTER_GRID_COLS} spacing={CHARACTER_GRID_SPACING}>
          {Array.from({ length: 12 }, (_, index) => (
            <Stack key={index} gap={4} align="center">
              <Skeleton height={CHARACTER_CARD.PORTRAIT_SIZE} circle />
              <Skeleton height={12} width={64} radius="sm" />
            </Stack>
          ))}
        </SimpleGrid>
      ) : (
        <TableRowsSkeleton rows={8} />
      )}
    </CollectionLoading>
  );
}

export function DetailPageLoading() {
  return (
    <LoadingRegion label="Loading details">
      <Box bg="var(--mantine-color-default-hover)">
        <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
          <Stack gap="lg">
            <Group align="flex-start" wrap="nowrap">
              <Skeleton height={72} width={72} radius="md" />
              <Stack gap="sm" style={{ flex: 1 }}>
                <Skeleton height={30} width="42%" radius="sm" />
                <Skeleton height={14} width="25%" radius="sm" />
                <Skeleton height={14} width="70%" radius="sm" />
              </Stack>
            </Group>
            <Skeleton height={96} radius="md" />
          </Stack>
        </Container>
      </Box>
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Grid gap="lg">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Skeleton height={260} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Skeleton height={120} radius="md" />
              <Skeleton height={120} radius="md" />
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </LoadingRegion>
  );
}

export function CharacterDetailPageLoading() {
  return (
    <LoadingRegion label="Loading character details">
      <Skeleton height={CHARACTER_HERO.MIN_HEIGHT} radius={0} />
      <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Skeleton height={390} radius="md" />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Skeleton height={180} radius="md" />
              <Skeleton height={240} radius="md" />
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </LoadingRegion>
  );
}

export function BuilderPageLoading() {
  return (
    <LoadingRegion label="Loading builder">
      <Grid gap="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <StaticSurface p="md" data-no-hover>
            <Stack gap="md">
              <Skeleton height={24} width="38%" radius="sm" />
              <SimpleGrid cols={{ base: 3, sm: 5 }} spacing="sm">
                {Array.from({ length: 10 }, (_, index) => (
                  <Skeleton key={index} height={72} radius="md" />
                ))}
              </SimpleGrid>
            </Stack>
          </StaticSurface>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Skeleton height={360} radius="md" />
        </Grid.Col>
      </Grid>
    </LoadingRegion>
  );
}

export function HomePageLoading() {
  return (
    <LoadingRegion label="Loading home page">
      <Skeleton height="clamp(420px, 62vh, 620px)" radius={0} />
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="xl">
          <Skeleton height={300} radius="md" />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Skeleton height={260} radius="md" />
            <Skeleton height={260} radius="md" />
          </SimpleGrid>
          <Skeleton height={150} radius="md" />
          <Skeleton height={220} radius="md" />
        </Stack>
      </Container>
    </LoadingRegion>
  );
}

function EventCardSkeleton({ bannerHeight = 160 }: { bannerHeight?: number }) {
  return (
    <StaticSurface>
      <Skeleton height={bannerHeight} radius="md" />
      <Stack gap="xs" p="md">
        <Group gap="xs">
          <Skeleton height={20} width={58} radius="xl" />
          <Skeleton height={20} width={72} radius="xl" />
        </Group>
        <Skeleton height={18} width="68%" radius="sm" />
        <Skeleton height={14} width="92%" radius="sm" />
        <Skeleton height={14} width="54%" radius="sm" />
      </Stack>
    </StaticSurface>
  );
}

export function EventCardsLoading({
  viewMode = 'grid',
  cards = 6,
  bannerHeight = 160,
  spacing = 'md',
  showPagination = false,
}: {
  viewMode?: ViewMode;
  cards?: number;
  bannerHeight?: number;
  spacing?: number | string;
  showPagination?: boolean;
}) {
  return (
    <LoadingRegion label="Loading events">
      <Stack gap={spacing}>
        {viewMode === 'grid' ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={spacing}>
            {Array.from({ length: cards }, (_, index) => (
              <EventCardSkeleton key={index} bannerHeight={bannerHeight} />
            ))}
          </SimpleGrid>
        ) : (
          <Stack gap={spacing}>
            {Array.from({ length: cards }, (_, index) => (
              <StaticSurface key={index} p="md">
                <Group align="stretch" gap="md" wrap="nowrap">
                  <Skeleton
                    height={96}
                    width={160}
                    radius="md"
                    visibleFrom="sm"
                  />
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Skeleton height={20} width={140} radius="xl" />
                    <Skeleton height={20} width="45%" radius="sm" />
                    <Skeleton height={14} width="85%" radius="sm" />
                    <Skeleton height={14} width="55%" radius="sm" />
                  </Stack>
                </Group>
              </StaticSurface>
            ))}
          </Stack>
        )}
        {showPagination && <PaginationSkeleton />}
      </Stack>
    </LoadingRegion>
  );
}

/**
 * Approximate rendered heights of the community cards, so their skeletons
 * reserve the same space and the page doesn't jump when content arrives.
 */
const COMMUNITY_CARD_HEIGHT = {
  team: 300,
  tierList: 230,
  report: 150,
  log: 84,
} as const;

type CommunityCardKind = keyof typeof COMMUNITY_CARD_HEIGHT;

const COMMUNITY_CARD_LABEL: Record<CommunityCardKind, string> = {
  team: 'Loading teams',
  tierList: 'Loading tier lists',
  report: 'Loading reports',
  log: 'Loading moderation log',
};

/** Team and tier list cards sit two-up on wider screens; reports and log rows stack. */
function communityCardCols(kind: CommunityCardKind): SimpleGridProps['cols'] {
  return kind === 'team' || kind === 'tierList'
    ? { base: 1, sm: 2 }
    : { base: 1 };
}

/** A page of community cards (or report/log rows) inside a tab, list, or section. */
export function CommunityCardsLoading({
  kind,
  cards = 4,
}: {
  kind: CommunityCardKind;
  cards?: number;
}) {
  return (
    <ViewModeLoading
      viewMode="grid"
      cards={cards}
      cardHeight={COMMUNITY_CARD_HEIGHT[kind]}
      gridCols={communityCardCols(kind)}
      label={COMMUNITY_CARD_LABEL[kind]}
    />
  );
}

/** The teams / tier-list browse pages while their data loads (search bar + results or builder). */
export function CommunityBrowseLoading({
  kind,
  viewMode,
  builder = false,
}: {
  kind: 'team' | 'tierList';
  viewMode: ViewMode;
  builder?: boolean;
}) {
  return (
    <Stack gap="md">
      <Skeleton height={36} radius="md" aria-hidden="true" />
      {builder ? (
        <BuilderPageLoading />
      ) : (
        <ViewModeLoading
          viewMode={viewMode}
          listType="table"
          cardHeight={COMMUNITY_CARD_HEIGHT[kind]}
          showPagination
          label={COMMUNITY_CARD_LABEL[kind]}
        />
      )}
    </Stack>
  );
}

/** Avatar, name and badges row shared by the profile and account headers. */
function ProfileHeaderSkeleton() {
  return (
    <Group>
      <Skeleton height={64} width={64} circle />
      <Stack gap={8}>
        <Skeleton height={34} width={220} radius="sm" />
        <Group gap="xs">
          {[84, 96, 128].map((width) => (
            <Skeleton key={width} height={22} width={width} radius="xl" />
          ))}
        </Group>
      </Stack>
    </Group>
  );
}

function TabsSkeleton({ tabs }: { tabs: number }) {
  return (
    <Group gap="xs">
      {Array.from({ length: tabs }, (_, index) => (
        <Skeleton key={index} height={34} width={110} radius="md" />
      ))}
    </Group>
  );
}

export function ProfilePageLoading() {
  return (
    <LoadingRegion label="Loading profile">
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="xl">
          <ProfileHeaderSkeleton />
          <TabsSkeleton tabs={2} />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                height={COMMUNITY_CARD_HEIGHT.team}
                radius="md"
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </LoadingRegion>
  );
}

export function AccountPageLoading() {
  return (
    <LoadingRegion label="Loading account">
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <ProfileHeaderSkeleton />
          <Skeleton height={180} radius="md" />
          <TabsSkeleton tabs={2} />
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton
                key={index}
                height={COMMUNITY_CARD_HEIGHT.team}
                radius="md"
              />
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </LoadingRegion>
  );
}

/** A public tier list page: breadcrumbs, title, byline and tag rows, then tier sections. */
export function TierListPageLoading() {
  return (
    <LoadingRegion label="Loading tier list">
      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="md">
          <Group justify="space-between" wrap="wrap">
            <Skeleton height={16} width={200} radius="sm" />
            <Group gap="xs">
              <Skeleton height={36} width={96} radius="md" />
              <Skeleton height={36} width={132} radius="md" />
            </Group>
          </Group>
          <Skeleton height={36} width="40%" radius="md" />
          <Skeleton height={16} width={260} radius="sm" />
          <Group gap="sm">
            <Skeleton height={26} width={72} radius="xl" />
            <Skeleton height={26} width={104} radius="xl" />
          </Group>
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} height={180} radius="md" />
          ))}
        </Stack>
      </Container>
    </LoadingRegion>
  );
}
