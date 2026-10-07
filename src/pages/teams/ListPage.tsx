import { getCommunityPaginationTotal } from '@/features/community/pagination';
import type { ChipFilterGroup } from '@/components/common/EntityFilter';
import EntityFilter from '@/components/common/EntityFilter';
import { createFactionFilterGroup } from '@/components/common/EntityFilterGroups';
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
import CommunitySortControl from '@/features/community/CommunitySortControl';
import TeamBuilder from '@/features/teams/components/TeamBuilder';
import TeamsSavedTab from '@/features/teams/components/TeamsSavedTab';
import TeamsViewTab from '@/features/teams/components/TeamsViewTab';
import {
  EMPTY_TEAM_FILTERS,
  matchesTeamFilters,
  type TeamFilters,
} from '@/features/teams/filters';
import { loadSavedTeams, removeSavedTeam } from '@/features/teams/saved-teams';
import type { Team } from '@/features/teams/types';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useTeams } from '@/features/teams/hooks/use-teams-data';
import { useWyrmspells } from '@/features/wiki/hooks/use-wiki-data';
import {
  countActiveFilters,
  getPageSizeStorageKey,
  useBuilderEditState,
  useGradientAccent,
  useIsMobile,
  usePageSize,
  usePagination,
  usePoolLayout,
  useViewMode,
} from '@/hooks';
import {
  useCommunityBrowseState,
  useSavedItemsForMode,
} from '@/hooks/use-community-browse-state';
import { getLatestTimestamp, parseTabMode } from '@/utils';
import { toEntitySlug } from '@/utils/entity-slug';
import { showErrorToast } from '@/utils/toast';
import { retryFailedDataSources } from '@/utils/retry-failed-data-sources';
import { Container, SegmentedControl, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

const TEAMS_PER_PAGE = 12;
const TEAM_PAGE_SIZE_OPTIONS = {
  grid: [6, 12, 18, 24],
  list: [10, 20, 30, 50],
} as const;

export default function Teams() {
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const location = useLocation();
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
  } = useCommunityBrowseState<TeamFilters>({
    emptyFilters: EMPTY_TEAM_FILTERS,
    storageKeys: {
      search: STORAGE_KEY.TEAMS_SEARCH,
      sort: STORAGE_KEY.TEAMS_SORT,
      filters: STORAGE_KEY.TEAMS_FILTERS,
    },
  });
  const {
    data: teams,
    total: totalTeams,
    loading: loadingTeams,
    loadingMore: loadingMoreTeams,
    hasMore: hasMoreTeams,
    loadMore: loadMoreTeams,
    error: teamsError,
    retry: retryTeams,
  } = useTeams({ search: debouncedSearch, sort });
  const {
    data: characters,
    loading: loadingChars,
    error: charactersError,
    retry: retryCharacters,
  } = useCharacters();
  const {
    data: wyrmspells,
    loading: loadingSpells,
    error: wyrmspellsError,
    retry: retryWyrmspells,
  } = useWyrmspells();
  const [filterOpen, { toggle: toggleFilter }] = useDisclosure(false);
  const mode = parseTabMode(searchParams.get('mode'));
  const navigationEditTeam = (location.state as { editTeam?: Team } | null)
    ?.editTeam;
  const {
    editData,
    setEditData,
    pendingEditItem: pendingEditTeam,
    setPendingEditItem: setPendingEditTeam,
    confirmEditOpen,
    setConfirmEditOpen,
    pendingDeleteSavedItem: pendingDeleteSavedTeam,
    setPendingDeleteSavedItem: setPendingDeleteSavedTeam,
    openInBuilder: openTeamInBuilder,
    requestEdit: requestEditTeam,
  } = useBuilderEditState<Team>({
    draftStorageKey: STORAGE_KEY.TEAMS_BUILDER_DRAFT,
    setSearchParams,
    navigationInitialItem: navigationEditTeam,
    navigate,
  });
  const isMobile = useIsMobile();
  const {
    layout: poolLayout,
    setLayout: setPoolLayout,
    canUseSideLayout: canUseSidePoolLayout,
  } = usePoolLayout();
  const [savedTeams, setSavedTeams] = useSavedItemsForMode(
    mode,
    loadSavedTeams,
  );
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.TEAMS_VIEW_MODE,
    defaultMode: 'grid',
  });
  const loadingSupportData = loadingChars || loadingSpells;
  const supportDataError = charactersError || wyrmspellsError;

  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);

  const contentTypeOptions = useMemo(() => [...CONTENT_TYPE_OPTIONS], []);

  const entityFilterGroups: ChipFilterGroup[] = useMemo(
    () => [
      {
        key: 'contentTypes',
        label: 'Content Type',
        options: contentTypeOptions,
      },
      createFactionFilterGroup(),
    ],
    [contentTypeOptions],
  );

  const activeFilterCount =
    mode === 'view' || mode === 'saved'
      ? countActiveFilters(viewFilters) + (search.trim() ? 1 : 0)
      : 0;

  function deleteSavedTeam(name: string) {
    try {
      removeSavedTeam(toEntitySlug(name));
      setSavedTeams((prev) => prev.filter((team) => team.name !== name));
    } catch {
      showErrorToast({
        title: 'Could not delete team',
        message: 'Browser storage could not be updated. Please try again.',
      });
    }
  }

  const filteredSavedTeams = useMemo(() => {
    return savedTeams.filter((team) =>
      matchesTeamFilters(team, search, viewFilters),
    );
  }, [savedTeams, search, viewFilters]);

  const filteredTeams = useMemo(() => {
    // Text search already happened server-side in useTeams(debouncedSearch);
    // only the faction/content-type filters need to be applied here.
    return teams.filter((team) => matchesTeamFilters(team, '', viewFilters));
  }, [teams, viewFilters]);

  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    TEAM_PAGE_SIZE_OPTIONS[viewMode],
    {
      defaultSize: TEAMS_PER_PAGE,
      storageKey: getPageSizeStorageKey(STORAGE_KEY.TEAMS_VIEW_MODE),
    },
  );

  const paginationTotal = getCommunityPaginationTotal({
    visibleCount: filteredTeams.length,
    loadedCount: teams.length,
    total: totalTeams,
    hasMore: hasMoreTeams,
  });

  const { page, setPage, totalPages, offset } = usePagination(
    paginationTotal,
    pageSize,
    JSON.stringify({ debouncedSearch, sort, viewFilters }),
  );

  const paginatedTeams = filteredTeams.slice(offset, offset + pageSize);

  const mostRecentUpdate = useMemo(() => getLatestTimestamp(teams), [teams]);

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
          mode === 'saved' ? 'Search saved teams...' : 'Search teams...'
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
        <ListPageHeader title="Teams" timestamp={mostRecentUpdate}>
          {!isMobile && filterControls}
        </ListPageHeader>

        {isMobile && filterControls}

        {loadingSupportData && (
          <CommunityBrowseLoading
            kind="team"
            viewMode={viewMode}
            builder={mode === 'builder'}
          />
        )}

        {!loadingSupportData && supportDataError && (
          <DataFetchError
            title="Could not load teams data"
            message={supportDataError.message}
            onRetry={() =>
              retryFailedDataSources(
                [charactersError, retryCharacters],
                [wyrmspellsError, retryWyrmspells],
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
                { label: isMobile ? 'Browse' : 'View Teams', value: 'view' },
                { label: isMobile ? 'Saved' : 'My Saved', value: 'saved' },
                {
                  label: isMobile ? 'Create' : 'Create Your Own',
                  value: 'builder',
                },
              ]}
            />

            {mode === 'view' &&
              (loadingTeams && teams.length === 0 ? (
                viewMode === 'grid' ? (
                  <CommunityCardsLoading kind="team" />
                ) : (
                  <ViewModeLoading
                    viewMode={viewMode}
                    listType="table"
                    label="Loading teams"
                  />
                )
              ) : (
                <Stack gap="md">
                  {teamsError && (
                    <DataFetchError
                      title="Could not load teams"
                      message={teamsError.message}
                      onRetry={retryTeams}
                    />
                  )}
                  {!(teamsError && teams.length === 0) && (
                    <TeamsViewTab
                      paginatedTeams={paginatedTeams}
                      filteredTeams={filteredTeams}
                      charMap={charMap}
                      characterByIdentity={characterByIdentity}
                      viewMode={viewMode}
                      search={search}
                      onClearFilters={handleClearFilters}
                      onOpenFilters={toggleFilter}
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      pageSize={pageSize}
                      pageSizeOptions={pageSizeOptions}
                      onPageSizeChange={setPageSize}
                      onRequestEdit={requestEditTeam}
                      hasMore={hasMoreTeams}
                      loadedCount={teams.length}
                      paginationTotal={paginationTotal}
                      loadingMore={loadingMoreTeams}
                      onLoadMore={loadMoreTeams}
                    />
                  )}
                </Stack>
              ))}

            {mode === 'saved' && (
              <TeamsSavedTab
                savedTeams={savedTeams}
                filteredSavedTeams={filteredSavedTeams}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                viewMode={viewMode}
                search={search}
                onClearFilters={handleClearFilters}
                onOpenFilters={toggleFilter}
                onRequestEdit={requestEditTeam}
                onRequestDelete={setPendingDeleteSavedTeam}
                onGoToBuilder={() => setSearchParams({ mode: 'builder' })}
              />
            )}

            {mode === 'builder' && (
              <TeamBuilder
                characters={characters}
                charMap={charMap}
                initialData={navigationEditTeam ?? editData}
                wyrmspells={wyrmspells}
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
            setPendingEditTeam(null);
          }}
          title="Replace current builder data?"
          message="Opening this team will replace your current builder draft."
          confirmLabel="Replace"
          onConfirm={() => {
            if (pendingEditTeam) {
              openTeamInBuilder(pendingEditTeam);
            }
            setConfirmEditOpen(false);
            setPendingEditTeam(null);
          }}
        />

        <ConfirmActionModal
          opened={pendingDeleteSavedTeam !== null}
          onCancel={() => setPendingDeleteSavedTeam(null)}
          title="Delete saved team?"
          message={`This will permanently delete "${pendingDeleteSavedTeam ?? ''}" from your saved teams.`}
          confirmLabel="Delete"
          confirmColor="red"
          onConfirm={() => {
            if (pendingDeleteSavedTeam) deleteSavedTeam(pendingDeleteSavedTeam);
            setPendingDeleteSavedTeam(null);
          }}
        />
      </Stack>
    </Container>
  );
}
