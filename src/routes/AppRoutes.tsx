import {
  BuilderPageLoading,
  CardGridLoading,
  CharacterDetailPageLoading,
  CharacterListLoading,
  ContentPageLoading,
  DetailPageLoading,
  EventCardsLoading,
  HomePageLoading,
  ListRouteLoading,
  ListPageLoading,
  ViewModeLoading,
} from '@/components/layout/PageLoadingSkeleton';
import { Container, Group, Skeleton, Stack } from '@mantine/core';
import { getRouteFallbackKind, ROUTE_PATH } from '@/constants/route-meta';
import { STORAGE_KEY } from '@/constants/ui';
import { getInitialViewMode, type ViewMode } from '@/hooks/use-filters';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router';

const Home = lazy(() => import('@/pages/home/Page'));
const Artifacts = lazy(() => import('@/pages/artifacts/ListPage'));
const ArtifactPage = lazy(() => import('@/pages/artifacts/DetailPage'));
const Characters = lazy(() => import('@/pages/characters/ListPage'));
const CharacterPage = lazy(() => import('@/pages/characters/DetailPage'));
const GearPage = lazy(() => import('@/pages/gear/ListPage'));
const GearSetPage = lazy(() => import('@/pages/gear/DetailPage'));
const RelicPage = lazy(() => import('@/pages/relics/ListPage'));
const OracleScrollPage = lazy(() => import('@/pages/relics/DetailPage'));
const Howlkins = lazy(() => import('@/pages/howlkins/ListPage'));
const GoldenAlliancePage = lazy(() => import('@/pages/howlkins/DetailPage'));
const NoblePhantasms = lazy(() => import('@/pages/noble-phantasms/ListPage'));
const NoblePhantasmPage = lazy(
  () => import('@/pages/noble-phantasms/DetailPage'),
);
const Resources = lazy(() => import('@/pages/resources/Page'));
const Subclasses = lazy(() => import('@/pages/subclasses/ListPage'));
const StatusEffects = lazy(() => import('@/pages/status-effects/ListPage'));
const DragonSpells = lazy(() => import('@/pages/wyrmspells/ListPage'));
const WyrmspellPage = lazy(() => import('@/pages/wyrmspells/DetailPage'));
const WyrmsListPage = lazy(() => import('@/pages/wyrms/ListPage'));
const WyrmPage = lazy(() => import('@/pages/wyrms/DetailPage'));
const TierList = lazy(() => import('@/pages/tier-list/Page'));
const TierListPage = lazy(() => import('@/pages/tier-list/TierListPage'));
const Teams = lazy(() => import('@/pages/teams/ListPage'));
const TeamPage = lazy(() => import('@/pages/teams/TeamPage'));
const SavedTeamPage = lazy(() => import('@/pages/teams/SavedTeamPage'));
const AccountPage = lazy(() => import('@/pages/account/Page'));
const ModerationPage = lazy(() => import('@/pages/moderation/Page'));
const ProfilePage = lazy(() => import('@/pages/profile/Page'));
const CommunityGuidelinesPage = lazy(
  () => import('@/pages/community-guidelines/Page'),
);
const PrivacyPage = lazy(() => import('@/pages/privacy/Page'));
const Codes = lazy(() => import('@/pages/codes/Page'));
const Events = lazy(() => import('@/pages/events/Page'));
const UsefulLinks = lazy(() => import('@/pages/useful-links/Page'));
const Changelog = lazy(() => import('@/pages/changelog/Page'));
const BeginnerQA = lazy(() => import('@/pages/guides/BeginnerQA'));
const FAQ = lazy(() => import('@/pages/faq/Page'));
const StarUpgradeCalculator = lazy(
  () => import('@/pages/guides/StarUpgradeCalculator'),
);
const MythicSummonCalculator = lazy(
  () => import('@/pages/guides/MythicSummonCalculator'),
);
const DiamondCalculator = lazy(
  () => import('@/pages/guides/DiamondCalculator'),
);
const ShovelEventGuide = lazy(() => import('@/pages/guides/ShovelEventGuide'));
const Dtdle = lazy(() => import('@/pages/guides/Dtdle'));
const NotFound = lazy(() => import('@/pages/not-found/Page'));

function GuidesLegacyRedirect() {
  const { '*': rest } = useParams();
  return <Navigate to={`/toolbox/${rest}`} replace />;
}

function CharacterListRouteFallback() {
  const viewMode = getInitialViewMode(STORAGE_KEY.CHARACTER_VIEW_MODE, 'grid');

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap">
          <Skeleton height={42} width={190} radius="md" aria-hidden="true" />
          <Group gap="xs" aria-hidden="true">
            <Skeleton height={30} width={110} radius="md" />
            <Skeleton height={30} width={72} radius="md" />
            <Skeleton height={30} width={72} radius="md" />
          </Group>
        </Group>
        <CharacterListLoading viewMode={viewMode} />
      </Stack>
    </Container>
  );
}

function getRouteTab(search: string, fallback: string, validTabs: string[]) {
  const tab = new URLSearchParams(search).get('tab');
  return tab && validTabs.includes(tab) ? tab : fallback;
}

function FilteredListRouteFallback({
  storageKey,
  defaultViewMode,
  tabs = 0,
}: {
  storageKey: string;
  defaultViewMode: ViewMode;
  tabs?: number;
}) {
  const viewMode = getInitialViewMode(storageKey, defaultViewMode);
  return (
    <ListRouteLoading tabs={tabs}>
      <ViewModeLoading
        viewMode={viewMode}
        listType="table"
        withToolbar
        showPagination
      />
    </ListRouteLoading>
  );
}

function RouteFallback() {
  const { pathname, search } = useLocation();
  const fallbackKind = getRouteFallbackKind(pathname);

  if (fallbackKind === 'home') {
    return <HomePageLoading />;
  }

  if (fallbackKind === 'character-list') {
    return <CharacterListRouteFallback />;
  }

  if (fallbackKind === 'character-detail') {
    return <CharacterDetailPageLoading />;
  }

  if (fallbackKind === 'detail') return <DetailPageLoading />;

  if (fallbackKind === 'artifact-list') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.ARTIFACT_VIEW_MODE}
        defaultViewMode="grid"
      />
    );
  }

  if (fallbackKind === 'wyrmspell-list') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.WYRMSPELL_VIEW_MODE}
        defaultViewMode="grid"
      />
    );
  }

  if (fallbackKind === 'wyrm-list') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.WYRM_VIEW_MODE}
        defaultViewMode="grid"
      />
    );
  }

  if (fallbackKind === 'resource-list') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.RESOURCE_VIEW_MODE}
        defaultViewMode="list"
      />
    );
  }

  if (fallbackKind === 'status-effect-list') {
    return (
      <FilteredListRouteFallback
        storageKey={STORAGE_KEY.STATUS_EFFECT_VIEW_MODE}
        defaultViewMode="list"
      />
    );
  }

  if (fallbackKind === 'subclass-list') {
    const tab = getRouteTab(search, 'subclasses', ['subclasses', 'usage']);
    return (
      <ListRouteLoading tabs={2}>
        <ViewModeLoading
          viewMode={
            tab === 'usage'
              ? 'list'
              : getInitialViewMode(STORAGE_KEY.SUBCLASS_VIEW_MODE, 'list')
          }
          listType="table"
          withToolbar
          showPagination
        />
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'gear-list') {
    const tab = getRouteTab(search, 'gear', ['gear', 'gear-sets', 'usage']);
    const content =
      tab === 'gear-sets' ? (
        <CardGridLoading cardHeight={180} showPagination />
      ) : tab === 'usage' ? (
        <ViewModeLoading
          viewMode="list"
          listType="table"
          withToolbar
          showPagination
        />
      ) : (
        <ViewModeLoading
          viewMode={getInitialViewMode(STORAGE_KEY.GEAR_VIEW_MODE, 'grid')}
          listType="table"
          withToolbar
          showPagination
        />
      );
    return <ListRouteLoading tabs={3}>{content}</ListRouteLoading>;
  }

  if (fallbackKind === 'relic-list') {
    const tab = getRouteTab(search, 'relics', ['relics', 'oracle-scrolls']);
    return (
      <ListRouteLoading tabs={2}>
        {tab === 'oracle-scrolls' ? (
          <CardGridLoading cardHeight={160} showPagination />
        ) : (
          <ViewModeLoading
            viewMode={getInitialViewMode(STORAGE_KEY.RELIC_VIEW_MODE, 'grid')}
            listType="table"
            withToolbar
            showPagination
          />
        )}
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'howlkin-list') {
    const tab = getRouteTab(search, 'howlkins', [
      'howlkins',
      'golden-alliances',
    ]);
    return (
      <ListRouteLoading tabs={2}>
        {tab === 'golden-alliances' ? (
          <CardGridLoading cardHeight={180} showPagination />
        ) : (
          <ViewModeLoading
            viewMode={getInitialViewMode(STORAGE_KEY.HOWLKIN_VIEW_MODE, 'grid')}
            cardHeight={180}
            listType="table"
            withToolbar
            showPagination
          />
        )}
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'noble-phantasm-list') {
    const tab = getRouteTab(search, 'noble-phantasms', [
      'noble-phantasms',
      'usage',
    ]);
    return (
      <ListRouteLoading tabs={2}>
        <ViewModeLoading
          viewMode={
            tab === 'usage'
              ? 'list'
              : getInitialViewMode(STORAGE_KEY.NOBLE_PHANTASM_VIEW_MODE, 'grid')
          }
          listType="table"
          withToolbar
          showPagination
        />
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'event-list') {
    return (
      <ListRouteLoading containerSize="lg" tabs={2}>
        <EventCardsLoading
          viewMode={getInitialViewMode(STORAGE_KEY.EVENT_VIEW_MODE, 'grid')}
          showPagination
        />
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'code-list') {
    return (
      <ListRouteLoading tabs={2}>
        <ViewModeLoading
          viewMode={getInitialViewMode(STORAGE_KEY.CODES_VIEW_MODE, 'list')}
          cards={9}
          gridCols={{ base: 1, xs: 2, sm: 3 }}
          cardHeight={180}
          showPagination
          label="Loading codes"
        />
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'team-list' || fallbackKind === 'tier-list') {
    const mode = new URLSearchParams(search).get('mode');
    const isTeams = fallbackKind === 'team-list';
    const viewMode = getInitialViewMode(
      isTeams ? STORAGE_KEY.TEAMS_VIEW_MODE : STORAGE_KEY.TIER_LIST_VIEW_MODE,
      'grid',
    );
    return (
      <ListRouteLoading containerSize="lg">
        <Stack gap="md">
          <Skeleton height={36} radius="md" aria-hidden="true" />
          {mode === 'builder' ? (
            <BuilderPageLoading />
          ) : (
            <ViewModeLoading
              viewMode={viewMode}
              cardHeight={isTeams ? 200 : 180}
              showPagination
              label={isTeams ? 'Loading teams' : 'Loading tier lists'}
            />
          )}
        </Stack>
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'changelog') {
    const tab = getRouteTab(search, 'site', ['site', 'data']);
    return (
      <ListRouteLoading tabs={2} description actions={false}>
        {tab === 'data' ? (
          <ListPageLoading showPagination />
        ) : (
          <ViewModeLoading
            viewMode="list"
            showPagination
            label="Loading updates"
          />
        )}
      </ListRouteLoading>
    );
  }

  if (fallbackKind === 'useful-links') {
    return (
      <ListRouteLoading>
        <ViewModeLoading viewMode="list" />
      </ListRouteLoading>
    );
  }

  return <ContentPageLoading />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={ROUTE_PATH.home} element={<Home />} />
        <Route path={ROUTE_PATH.artifacts} element={<Artifacts />} />
        <Route path={ROUTE_PATH.artifactDetail} element={<ArtifactPage />} />
        <Route path={ROUTE_PATH.characters} element={<Characters />} />
        <Route path={ROUTE_PATH.characterDetail} element={<CharacterPage />} />
        <Route path={ROUTE_PATH.gear} element={<GearPage />} />
        <Route path={ROUTE_PATH.gearSetDetail} element={<GearSetPage />} />
        <Route path={ROUTE_PATH.relics} element={<RelicPage />} />
        <Route
          path={ROUTE_PATH.oracleScrollDetail}
          element={<OracleScrollPage />}
        />
        <Route path={ROUTE_PATH.howlkins} element={<Howlkins />} />
        <Route
          path={ROUTE_PATH.howlkinDetail}
          element={<GoldenAlliancePage />}
        />
        <Route path={ROUTE_PATH.noblePhantasms} element={<NoblePhantasms />} />
        <Route
          path={ROUTE_PATH.noblePhantasmDetail}
          element={<NoblePhantasmPage />}
        />
        <Route path={ROUTE_PATH.resources} element={<Resources />} />
        <Route path={ROUTE_PATH.subclasses} element={<Subclasses />} />
        <Route path={ROUTE_PATH.statusEffects} element={<StatusEffects />} />
        <Route path={ROUTE_PATH.wyrmspells} element={<DragonSpells />} />
        <Route path={ROUTE_PATH.wyrmspellDetail} element={<WyrmspellPage />} />
        <Route path={ROUTE_PATH.wyrms} element={<WyrmsListPage />} />
        <Route path={ROUTE_PATH.wyrmDetail} element={<WyrmPage />} />
        <Route path={ROUTE_PATH.tierList} element={<TierList />} />
        <Route path={ROUTE_PATH.tierListDetail} element={<TierListPage />} />
        <Route path={ROUTE_PATH.teams} element={<Teams />} />
        <Route path={ROUTE_PATH.savedTeam} element={<SavedTeamPage />} />
        <Route path={ROUTE_PATH.teamDetail} element={<TeamPage />} />
        <Route path={ROUTE_PATH.account} element={<AccountPage />} />
        <Route path={ROUTE_PATH.moderation} element={<ModerationPage />} />
        <Route path={ROUTE_PATH.profile} element={<ProfilePage />} />
        <Route
          path={ROUTE_PATH.communityGuidelines}
          element={<CommunityGuidelinesPage />}
        />
        <Route path={ROUTE_PATH.privacy} element={<PrivacyPage />} />
        <Route path={ROUTE_PATH.codes} element={<Codes />} />
        <Route path={ROUTE_PATH.events} element={<Events />} />
        <Route path={ROUTE_PATH.usefulLinks} element={<UsefulLinks />} />
        <Route path={ROUTE_PATH.changelog} element={<Changelog />} />
        <Route path={ROUTE_PATH.faq} element={<FAQ />} />
        <Route path={ROUTE_PATH.beginnerQa} element={<BeginnerQA />} />
        <Route
          path={ROUTE_PATH.starUpgradeCalculator}
          element={<StarUpgradeCalculator />}
        />
        <Route
          path={ROUTE_PATH.mythicSummonCalculator}
          element={<MythicSummonCalculator />}
        />
        <Route
          path={ROUTE_PATH.diamondCalculator}
          element={<DiamondCalculator />}
        />
        <Route path={ROUTE_PATH.shovelEvent} element={<ShovelEventGuide />} />
        <Route path={ROUTE_PATH.dtdle} element={<Dtdle />} />

        {/* Legacy redirects: preserve old bookmarked/shared links */}
        <Route
          path="/useful-links"
          element={<Navigate to="/toolbox/useful-links" replace />}
        />
        <Route path="/guides/*" element={<GuidesLegacyRedirect />} />

        <Route path={ROUTE_PATH.notFound} element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
