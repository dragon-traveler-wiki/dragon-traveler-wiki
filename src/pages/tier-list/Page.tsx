import { getCommunityPaginationTotal } from '@/features/community/pagination';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import {
  createClassFilterGroup,
  createFactionFilterGroup,
  createQualityFilterGroup,
} from '@/components/common/EntityFilterGroups';
import ListPageHeader from '@/components/layout/ListPageHeader';
import PageFilterHeaderControls from '@/components/layout/PageFilterHeaderControls';
import {
  CommunityBrowseLoading,
  CommunityCardsLoading,
  ViewModeLoading,
} from '@/components/layout/PageLoadingSkeleton';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import DataFetchError from '@/components/ui/DataFetchError';
import { CONTENT_TYPE_OPTIONS } from '@/constants/content-types';
import {
  BUILDER_SIDE_LAYOUT_CONTAINER_SIZE,
  STORAGE_KEY,
  PAGE_WIDTH,
} from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import CommunitySortControl from '@/features/community/CommunitySortControl';
import TierListBuilder from '@/features/tier-list/components/TierListBuilder';
import TierListSavedTab from '@/features/tier-list/components/TierListSavedTab';
import TierListViewTab from '@/features/tier-list/components/TierListViewTab';
import {
  EMPTY_TIER_LIST_VIEW_FILTERS,
  matchesTierListFilters,
  type TierListViewFilters,
} from '@/features/tier-list/filters';
import {
  loadSavedTierLists,
  removeSavedTierList,
} from '@/features/tier-list/saved-tier-lists';
import { useTierLists } from '@/features/tier-list/hooks/use-tier-list-data';
import { useResolveTierEntryEntity } from '@/features/tier-list/hooks/use-resolve-tier-entry-entity';
import { useNoblePhantasms } from '@/features/wiki/hooks/use-wiki-data';
import type {
  TierListRankableEntity,
  TierList as TierListType,
} from '@/features/tier-list/types';
import {
  countActiveFilters,
  getPageSizeStorageKey,
  useBuilderEditState,
  useDarkMode,
  useGradientAccent,
  useIsMobile,
  usePageSize,
  usePagination,
  usePoolLayout,
  useSearchParamText,
  useViewMode,
} from '@/hooks';
import {
  useCommunityBrowseState,
  useSavedItemsForMode,
} from '@/hooks/use-community-browse-state';
import { getLatestTimestamp, parseTabMode } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import { downloadElementAsImage } from '@/utils/export-image';
import { showErrorToast } from '@/utils/toast';
import { retryFailedDataSources } from '@/utils/retry-failed-data-sources';
import { Container, SegmentedControl, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

const TIER_LISTS_PER_PAGE = 12;
const TIER_LIST_PAGE_SIZE_OPTIONS = [6, 12, 18, 24] as const;

export default function TierList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    search,
    setSearch,
    debouncedSearch,
    sort,
    setSort,
    filters: viewFilters,
    handleFilterChange,
    clearFilters: handleClearFilters,
  } = useCommunityBrowseState<TierListViewFilters>({
    emptyFilters: EMPTY_TIER_LIST_VIEW_FILTERS,
    storageKeys: {
      search: STORAGE_KEY.TIER_LIST_SEARCH,
      sort: STORAGE_KEY.TIER_LIST_SORT,
      filters: STORAGE_KEY.TIER_LIST_FILTERS,
    },
    initialSearch: searchParams.get('search'),
  });
  useSearchParamText(setSearch);
  const {
    data: tierLists,
    total: totalTierLists,
    loading: loadingTierLists,
    loadingMore: loadingMoreTierLists,
    hasMore: hasMoreTierLists,
    loadMore: loadMoreTierLists,
    error: tierListsError,
    retry: retryTierLists,
  } = useTierLists({ search: debouncedSearch, sort });
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
    retry: retryCharacters,
  } = useCharacters();
  const {
    data: noblePhantasms,
    loading: loadingNoblePhantasms,
    error: noblePhantasmsError,
    retry: retryNoblePhantasms,
  } = useNoblePhantasms();
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const mode = parseTabMode(searchParams.get('mode'));
  const navigationEditTierList = (
    location.state as { editTierList?: TierListType } | null
  )?.editTierList;
  const {
    editData,
    setEditData,
    pendingEditItem: pendingEditTierList,
    setPendingEditItem: setPendingEditTierList,
    confirmEditOpen,
    setConfirmEditOpen,
    pendingDeleteSavedItem: pendingDeleteSavedTierList,
    setPendingDeleteSavedItem: setPendingDeleteSavedTierList,
    openInBuilder: openTierListInBuilder,
    requestEdit: requestEditTierList,
  } = useBuilderEditState<TierListType>({
    draftStorageKey: STORAGE_KEY.TIER_LIST_BUILDER_DRAFT,
    setSearchParams,
    navigationInitialItem: navigationEditTierList,
    navigate,
  });
  const [savedTierLists, setSavedTierLists] = useSavedItemsForMode(
    mode,
    loadSavedTierLists,
  );
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TIER_LIST_VIEW_MODE,
    defaultMode: 'grid',
  });
  const [isCapturingTierList, setIsCapturingTierList] = useState<string | null>(
    null,
  );
  const exportRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();
  const {
    layout: poolLayout,
    setLayout: setPoolLayout,
    canUseSideLayout: canUseSidePoolLayout,
  } = usePoolLayout();
  const loadingSupportData = loadingChars || loadingNoblePhantasms;
  const supportDataError = charactersError || noblePhantasmsError;

  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const resolveTierEntryEntity = useResolveTierEntryEntity(
    charMap,
    characterByIdentity,
    noblePhantasms,
  );

  const contentTypeOptions = useMemo(() => [...CONTENT_TYPE_OPTIONS], []);
  const hasEntityFilters =
    viewFilters.factions.length > 0 ||
    viewFilters.classes.length > 0 ||
    viewFilters.qualities.length > 0;

  const matchesCharacterViewFilters = useCallback(
    (character: Character) => {
      if (
        viewFilters.factions.length > 0 &&
        !character.factions.some((faction) =>
          viewFilters.factions.includes(faction),
        )
      ) {
        return false;
      }

      if (
        viewFilters.classes.length > 0 &&
        !viewFilters.classes.includes(character.character_class)
      ) {
        return false;
      }

      if (
        viewFilters.qualities.length > 0 &&
        !viewFilters.qualities.includes(character.quality)
      ) {
        return false;
      }

      return true;
    },
    [viewFilters.factions, viewFilters.classes, viewFilters.qualities],
  );

  const matchesEntityViewFilters = useCallback(
    (entity: TierListRankableEntity) => {
      if (entity.character) {
        return matchesCharacterViewFilters(entity.character);
      }
      const noblePhantasm = entity.noblePhantasm;
      if (!noblePhantasm) return false;
      if (viewFilters.factions.length > 0 || viewFilters.classes.length > 0) {
        return false;
      }
      return (
        viewFilters.qualities.length === 0 ||
        viewFilters.qualities.includes(noblePhantasm.quality)
      );
    },
    [
      matchesCharacterViewFilters,
      viewFilters.classes.length,
      viewFilters.factions.length,
      viewFilters.qualities,
    ],
  );

  const entityFilterGroups: ChipFilterGroup[] = useMemo(
    () => [
      {
        key: 'contentTypes',
        label: 'Content Type',
        options: contentTypeOptions,
      },
      {
        key: 'entityTypes',
        label: 'Entity Type',
        options: ['character', 'noble_phantasm'],
        labelFn: (value) =>
          value === 'noble_phantasm' ? 'Noble Phantasms' : 'Characters',
      },
      createFactionFilterGroup(),
      createClassFilterGroup(),
      createQualityFilterGroup(),
    ],
    [contentTypeOptions],
  );

  const activeFilterCount =
    mode === 'view' || mode === 'saved'
      ? countActiveFilters(viewFilters) + (search.trim() ? 1 : 0)
      : 0;

  function deleteSavedTierList(name: string) {
    try {
      removeSavedTierList(toEntitySlug(name));
      setSavedTierLists((prev) => prev.filter((t) => t.name !== name));
      window.dispatchEvent(new CustomEvent('tier-list:saved-changed'));
    } catch {
      showErrorToast({
        title: 'Could not delete tier list',
        message: 'Browser storage could not be updated. Please try again.',
      });
    }
  }

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(tierLists),
    [tierLists],
  );

  const filteredTierLists = useMemo(() => {
    // Text search already happened server-side in useTierLists(debouncedSearch);
    // only the content-type/entity filters need to be applied here.
    return tierLists.filter((tierList) => {
      if (!matchesTierListFilters(tierList, '', viewFilters)) return false;
      if (!hasEntityFilters) return true;

      return tierList.entries.some((entry) => {
        const entity = resolveTierEntryEntity(entry);
        return entity ? matchesEntityViewFilters(entity) : false;
      });
    });
  }, [
    tierLists,
    viewFilters,
    hasEntityFilters,
    resolveTierEntryEntity,
    matchesEntityViewFilters,
  ]);

  const filteredSavedTierLists = useMemo(() => {
    return savedTierLists.filter((tierList) => {
      if (!matchesTierListFilters(tierList, search, viewFilters)) return false;
      if (!hasEntityFilters) return true;

      return tierList.entries.some((entry) => {
        const entity = resolveTierEntryEntity(entry);
        return entity ? matchesEntityViewFilters(entity) : false;
      });
    });
  }, [
    savedTierLists,
    search,
    viewFilters,
    hasEntityFilters,
    resolveTierEntryEntity,
    matchesEntityViewFilters,
  ]);

  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    TIER_LIST_PAGE_SIZE_OPTIONS,
    {
      defaultSize: TIER_LISTS_PER_PAGE,
      storageKey: getPageSizeStorageKey(STORAGE_KEY.TIER_LIST_VIEW_MODE),
    },
  );
  const paginationTotal = getCommunityPaginationTotal({
    visibleCount: filteredTierLists.length,
    loadedCount: tierLists.length,
    total: totalTierLists,
    hasMore: hasMoreTierLists,
  });

  const { page, setPage, totalPages, offset } = usePagination(
    paginationTotal,
    pageSize,
    JSON.stringify({ debouncedSearch, sort, viewFilters }),
  );
  const paginatedTierLists = filteredTierLists.slice(offset, offset + pageSize);

  const handleRequestExport = useCallback(
    async (name: string) => {
      const el = exportRefs.current.get(name);
      if (!el) return;
      setIsCapturingTierList(name);
      try {
        await downloadElementAsImage(el, name, isDark);
      } finally {
        setIsCapturingTierList(null);
      }
    },
    [isDark],
  );

  const exportRefCallback = useCallback(
    (name: string, node: HTMLDivElement | null) => {
      if (node) exportRefs.current.set(name, node);
      else exportRefs.current.delete(name);
    },
    [],
  );

  const filterControls = (mode === 'view' || mode === 'saved') && (
    <PageFilterHeaderControls
      sticky={isMobile}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      filterCount={activeFilterCount}
      filterOpen={filterOpen}
      onFilterToggle={toggleFilter}
      extraControls={
        mode === 'view' && (
          <CommunitySortControl value={sort} onChange={setSort} />
        )
      }
    >
      <EntityFilter
        groups={entityFilterGroups}
        selected={viewFilters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={
          mode === 'saved'
            ? 'Search saved tier lists...'
            : 'Search tier lists...'
        }
      />
    </PageFilterHeaderControls>
  );

  const containerSize =
    mode === 'builder' && poolLayout === 'side'
      ? BUILDER_SIDE_LAYOUT_CONTAINER_SIZE
      : PAGE_WIDTH.WIDE;

  return (
    <Container size={containerSize} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Tier List" timestamp={mostRecentUpdate}>
          {!isMobile && filterControls}
        </ListPageHeader>

        {isMobile && filterControls}

        {loadingSupportData && (
          <CommunityBrowseLoading
            kind="tierList"
            viewMode={viewMode}
            builder={mode === 'builder'}
          />
        )}

        {!loadingSupportData && supportDataError && (
          <DataFetchError
            title="Could not load tier list data"
            message={supportDataError.message}
            onRetry={() =>
              retryFailedDataSources(
                [charactersError, retryCharacters],
                [noblePhantasmsError, retryNoblePhantasms],
              )
            }
          />
        )}

        {!loadingSupportData && !supportDataError && (
          <>
            <SegmentedControl
              fullWidth
              size={isMobile ? 'sm' : 'md'}
              color={accent.primary}
              value={mode}
              onChange={(val) => {
                const newMode = val as 'view' | 'saved' | 'builder';
                setSearchParams(newMode === 'view' ? {} : { mode: newMode });
                if (newMode === 'view') setEditData(null);
              }}
              data={[
                {
                  label: isMobile ? 'Browse' : 'View Tier Lists',
                  value: 'view',
                },
                { label: isMobile ? 'Saved' : 'My Saved', value: 'saved' },
                {
                  label: isMobile ? 'Create' : 'Create Your Own',
                  value: 'builder',
                },
              ]}
            />

            {mode === 'view' &&
              (loadingTierLists && tierLists.length === 0 ? (
                viewMode === 'grid' ? (
                  <CommunityCardsLoading kind="tierList" />
                ) : (
                  <ViewModeLoading
                    viewMode={viewMode}
                    listType="table"
                    label="Loading tier lists"
                  />
                )
              ) : (
                <Stack gap="md">
                  {tierListsError && (
                    <DataFetchError
                      title="Could not load tier lists"
                      message={tierListsError.message}
                      onRetry={retryTierLists}
                    />
                  )}
                  {!(tierListsError && tierLists.length === 0) && (
                    <TierListViewTab
                      filteredTierLists={filteredTierLists}
                      paginatedTierLists={paginatedTierLists}
                      charMap={charMap}
                      characterByIdentity={characterByIdentity}
                      viewMode={viewMode}
                      search={search}
                      onClearFilters={handleClearFilters}
                      onOpenFilters={toggleFilter}
                      onRequestEdit={requestEditTierList}
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      pageSize={pageSize}
                      pageSizeOptions={pageSizeOptions}
                      onPageSizeChange={setPageSize}
                      hasMore={hasMoreTierLists}
                      loadedCount={tierLists.length}
                      paginationTotal={paginationTotal}
                      loadingMore={loadingMoreTierLists}
                      onLoadMore={loadMoreTierLists}
                    />
                  )}
                </Stack>
              ))}

            {mode === 'saved' && (
              <TierListSavedTab
                savedTierLists={savedTierLists}
                filteredSavedTierLists={filteredSavedTierLists}
                resolveTierEntryEntity={resolveTierEntryEntity}
                viewMode={viewMode}
                search={search}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                onRequestEdit={requestEditTierList}
                onRequestExport={handleRequestExport}
                isExporting={isCapturingTierList}
                exportRefCallback={exportRefCallback}
                onRequestDelete={setPendingDeleteSavedTierList}
                onGoToBuilder={() => setSearchParams({ mode: 'builder' })}
                entityFilter={matchesEntityViewFilters}
                hasEntityFilters={hasEntityFilters}
              />
            )}

            {mode === 'builder' && (
              <TierListBuilder
                characters={characters}
                charMap={charMap}
                noblePhantasms={noblePhantasms}
                initialData={navigationEditTierList ?? editData}
                poolLayout={poolLayout}
                onPoolLayoutChange={setPoolLayout}
                canUseSidePoolLayout={canUseSidePoolLayout}
              />
            )}
          </>
        )}

        <ConfirmActionModal
          opened={confirmEditOpen}
          onCancel={() => {
            setConfirmEditOpen(false);
            setPendingEditTierList(null);
          }}
          title="Replace current builder data?"
          message="Opening this tier list will replace your current builder draft."
          confirmLabel="Replace"
          onConfirm={() => {
            if (pendingEditTierList) {
              openTierListInBuilder(pendingEditTierList);
            }
            setConfirmEditOpen(false);
            setPendingEditTierList(null);
          }}
        />

        <ConfirmActionModal
          opened={pendingDeleteSavedTierList !== null}
          onCancel={() => setPendingDeleteSavedTierList(null)}
          title="Delete saved tier list?"
          message={`This will permanently delete "${pendingDeleteSavedTierList ?? ''}" from your saved tier lists.`}
          confirmLabel="Delete"
          confirmColor="red"
          onConfirm={() => {
            if (pendingDeleteSavedTierList)
              deleteSavedTierList(pendingDeleteSavedTierList);
            setPendingDeleteSavedTierList(null);
          }}
        />
      </Stack>
    </Container>
  );
}
