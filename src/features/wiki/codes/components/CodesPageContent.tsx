import {
  ActionIcon,
  Alert,
  Button,
  Container,
  Group,
  Menu,
  SegmentedControl,
  Stack,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core';
import {
  IoCheckmark,
  IoCloseCircleOutline,
  IoEllipsisHorizontal,
  IoInformationCircleOutline,
  IoSearch,
} from 'react-icons/io5';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ListPageShell from '@/components/layout/ListPageShell';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import SuggestModal from '@/components/tools/SuggestModal';
import EmptyState from '@/components/ui/EmptyState';
import PaginationControl from '@/components/ui/PaginationControl';
import ViewToggle from '@/components/ui/ViewToggle';
import { CODE_GRID_COLS, IMAGE_SIZE, PAGE_WIDTH } from '@/constants/ui';
import CodeBulkModals from '@/features/wiki/codes/components/CodeBulkModals';
import CodeCollection from '@/features/wiki/codes/components/CodeCollection';
import CodeRewardSummary from '@/features/wiki/codes/components/CodeRewardSummary';
import { useCodesPage } from '@/features/wiki/codes/hooks/use-codes-page';
import {
  buildCodeRewardFields,
  CODE_FIELDS,
} from '@/features/wiki/codes/suggestion-fields';
import { useGradientAccent, useIsMobile, useMobileTooltip } from '@/hooks';
import type { Code } from '@/features/wiki/codes/types';
import type { Resource } from '@/features/wiki/resources/types';
import { pluralize } from '@/utils/string';
import { useMemo } from 'react';

export default function CodesPageContent({
  codes,
  resources,
  loading,
  error,
  onRetry,
}: {
  codes: Code[];
  resources: Resource[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const isMobile = useIsMobile();
  const page = useCodesPage(codes);
  const showCodeControls = !loading && !error;
  const rewardFields = useMemo(
    () => buildCodeRewardFields(resources),
    [resources],
  );

  const viewFilter = (
    <SegmentedControl
      fullWidth={isMobile}
      value={page.view}
      onChange={(value) => page.setView(value as typeof page.view)}
      data={[
        { label: 'Unredeemed', value: 'unredeemed' },
        { label: 'Redeemed', value: 'redeemed' },
        { label: 'All', value: 'all' },
      ]}
    />
  );

  return (
    <Container size={PAGE_WIDTH.WIDE} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Codes" timestamp={page.mostRecentUpdate}>
          <SuggestModal
            buttonLabel="Suggest a Code"
            modalTitle="Suggest a New Code"
            issueTitle="[Code] New code suggestion"
            fields={CODE_FIELDS}
            arrayFields={rewardFields}
            excludeFromJson={['source']}
          />
        </ListPageHeader>

        <Alert
          icon={<IoInformationCircleOutline size={20} />}
          title="How to redeem"
          color={accent.primary}
          variant="light"
        >
          <Text size="sm">
            Codes are redeemed in-game via{' '}
            <strong>Settings &gt; Redeem Code</strong>. Each code can only be
            used once per account. Codes are case-sensitive and must be entered
            without leading or trailing spaces.
          </Text>
        </Alert>

        <TextInput
          placeholder="Search codes..."
          leftSection={<IoSearch size={IMAGE_SIZE.ICON_MD} />}
          value={page.search}
          onChange={(event) => page.setSearch(event.currentTarget.value)}
        />
        <Tabs value={page.tab} onChange={page.setTab}>
          <Tabs.List>
            <Tabs.Tab value="active">Active Codes</Tabs.Tab>
            <Tabs.Tab value="expired">Expired Codes</Tabs.Tab>
          </Tabs.List>
        </Tabs>

        {isMobile ? (
          <Stack gap="xs">
            {viewFilter}
            <Group justify="space-between" align="center" wrap="nowrap">
              {showCodeControls ? (
                <Text size="sm" c="dimmed">
                  {page.filtered.length}{' '}
                  {page.filtered.length === 1 ? 'code' : pluralize('code')}
                </Text>
              ) : null}
              <Group gap="xs" wrap="nowrap" ml="auto">
                <ViewToggle
                  viewMode={page.viewMode}
                  onChange={page.setViewMode}
                />
                {showCodeControls ? (
                  <Menu position="bottom-end" shadow="md" withinPortal>
                    <Menu.Target>
                      <ActionIcon
                        variant="default"
                        size="lg"
                        aria-label="Bulk actions"
                      >
                        <IoEllipsisHorizontal size={IMAGE_SIZE.ICON_MD} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IoCheckmark size={14} />}
                        onClick={page.openMarkAll}
                      >
                        Mark All Redeemed
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IoCloseCircleOutline size={14} />}
                        onClick={page.openClearAll}
                      >
                        Clear All Redeemed
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                ) : null}
              </Group>
            </Group>
          </Stack>
        ) : (
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              {viewFilter}
              <ViewToggle
                viewMode={page.viewMode}
                onChange={page.setViewMode}
              />
            </Group>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                color={accent.primary}
                leftSection={<IoCheckmark size={14} />}
                onClick={page.openMarkAll}
              >
                Mark All Redeemed
              </Button>
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IoCloseCircleOutline size={14} />}
                onClick={page.openClearAll}
              >
                Clear All Redeemed
              </Button>
            </Group>
          </Group>
        )}

        <ListPageShell
          loading={loading}
          error={error}
          onRetry={onRetry}
          hasData={codes.length > 0}
          emptyMessage="No codes have been added yet."
          errorTitle="Could not load codes"
          loadingFallback={
            <ViewModeLoading
              viewMode={page.viewMode}
              cards={9}
              cardHeight={180}
              gridCols={CODE_GRID_COLS}
              showPagination
              label="Loading codes"
            />
          }
        >
          <CodeRewardSummary
            tab={page.tab}
            view={page.view}
            opened={page.rewardsOpen}
            onToggle={page.toggleRewards}
            unclaimedRewards={page.unclaimedRewards}
            claimedRewards={page.claimedRewards}
            accentColor={accent.primary}
          />
          {page.filtered.length === 0 ? (
            <EmptyState
              icon={<IoSearch size={32} />}
              title={page.emptyState.title}
              description={page.emptyState.message}
              color={accent.primary}
              action={
                <Group>
                  <Button
                    size="xs"
                    variant="outline"
                    color={accent.primary}
                    onClick={() => page.setSearch('')}
                  >
                    Clear search
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color={accent.primary}
                    onClick={() => page.setView('all')}
                  >
                    Show all
                  </Button>
                </Group>
              }
            />
          ) : (
            <CodeCollection
              codes={page.pageItems}
              viewMode={page.viewMode}
              redeemed={page.redeemed}
              onToggleRedeemed={page.toggleRedeemed}
              accentColor={accent.primary}
              tooltipProps={tooltipProps}
            />
          )}
          <PaginationControl
            currentPage={page.page}
            totalPages={page.totalPages}
            onChange={page.setPage}
            totalItems={page.filtered.length}
            pageSize={page.pageSize}
            pageSizeOptions={page.pageSizeOptions}
            onPageSizeChange={page.setPageSize}
            scrollToTop
          />
        </ListPageShell>
        <CodeBulkModals page={page} accentColor={accent.primary} />
      </Stack>
    </Container>
  );
}
