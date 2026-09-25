import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STORAGE_KEY } from '@/constants/ui';
import {
  CommunityApiError,
  getSiteSettings,
  isCommunityApiConfigured,
} from '@/features/community/api';
import {
  useTierList,
  useTierLists,
} from '@/features/tier-list/hooks/use-tier-list-data';
import {
  getTierListEntityType,
  type TierList as TierListType,
} from '@/features/tier-list/types';
import { loadSavedTierLists } from '@/features/tier-list/saved-tier-lists';

/** Stored choice meaning "show no tiers"; no stored value means "follow the site default". */
const NONE = '__none__';
const SAVED_PREFIX = 'saved:';

/** Select value for one of the viewer's locally saved tier lists. */
export const getSavedTierListKey = (tierList: Pick<TierListType, 'slug'>) =>
  `${SAVED_PREFIX}${tierList.slug}`;

export interface TierListReferenceContextValue {
  /** Top published character tier lists, offered as options. */
  tierLists: TierListType[];
  savedTierLists: TierListType[];
  loading: boolean;
  /** True until it's known whether a reference exists (site default or chosen list). */
  resolving: boolean;
  /** The tier list currently used as the reference, if any. */
  selectedTierList: TierListType | null;
  /** Community id, `saved:<slug>`, or '' when there's no reference. */
  selectedKey: string;
  /** Moderator-pinned default reference (a published community list id). */
  siteReferenceId: string | null;
  usingSiteDefault: boolean;
  selectTierList: (key: string) => void;
  followSiteDefault: () => void;
  clearSelection: () => void;
  refreshSiteReference: () => void;
}

export const TierListReferenceContext =
  createContext<TierListReferenceContextValue>({
    tierLists: [],
    savedTierLists: [],
    loading: false,
    resolving: false,
    selectedTierList: null,
    selectedKey: '',
    siteReferenceId: null,
    usingSiteDefault: true,
    selectTierList: () => {},
    followSiteDefault: () => {},
    clearSelection: () => {},
    refreshSiteReference: () => {},
  });

function readSavedCharacterTierLists(): TierListType[] {
  return loadSavedTierLists().filter(
    (tierList) => getTierListEntityType(tierList) === 'character',
  );
}

export function TierListReferenceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: allTierLists, loading: listLoading } = useTierLists();
  const tierLists = useMemo(
    () =>
      allTierLists.filter(
        (tierList) => getTierListEntityType(tierList) === 'character',
      ),
    [allTierLists],
  );
  const [savedTierLists, setSavedTierLists] = useState<TierListType[]>(
    readSavedCharacterTierLists,
  );
  const [stored, setStored] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return (
      window.localStorage.getItem(STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE) ||
      null
    );
  });
  const [siteReferenceId, setSiteReferenceId] = useState<string | null>(null);
  const [settingsVersion, setSettingsVersion] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(
    !isCommunityApiConfigured,
  );

  const refreshSaved = useCallback(() => {
    setSavedTierLists(readSavedCharacterTierLists());
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY.TIER_LIST_MY_SAVED) refreshSaved();
    };
    window.addEventListener('tier-list:saved-changed', refreshSaved);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('tier-list:saved-changed', refreshSaved);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshSaved]);

  useEffect(() => {
    if (!isCommunityApiConfigured) return;
    let cancelled = false;
    getSiteSettings()
      .then((settings) => {
        if (cancelled) return;
        setSiteReferenceId(settings.referenceTierListId);
        setSettingsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setSiteReferenceId(null);
        setSettingsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [settingsVersion]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (stored) {
      window.localStorage.setItem(
        STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE,
        stored,
      );
    } else {
      window.localStorage.removeItem(STORAGE_KEY.CHARACTER_TIER_LIST_REFERENCE);
    }
  }, [stored]);

  const usingSiteDefault = stored === null;
  const selectedKey = stored === NONE ? '' : (stored ?? siteReferenceId ?? '');
  const isSaved = selectedKey.startsWith(SAVED_PREFIX);
  const communityId = selectedKey && !isSaved ? selectedKey : null;

  const {
    data: fetchedTierList,
    loading: fetching,
    error: fetchError,
  } = useTierList(communityId);

  // Only unknown while waiting on the site default (when the viewer hasn't
  // chosen) or on fetching the list they did choose.
  const resolving =
    (stored === null && !settingsLoaded) || (communityId !== null && fetching);

  const selectedTierList = useMemo(() => {
    if (!selectedKey) return null;
    if (isSaved) {
      return (
        savedTierLists.find(
          (tierList) => getSavedTierListKey(tierList) === selectedKey,
        ) ?? null
      );
    }
    return fetchedTierList?.community?.id === selectedKey &&
      getTierListEntityType(fetchedTierList) === 'character'
      ? fetchedTierList
      : null;
  }, [selectedKey, isSaved, savedTierLists, fetchedTierList]);

  // A list the viewer explicitly chose that no longer exists (deleted, hidden,
  // or a stale value from before choices were keyed by id) falls back to the
  // site default rather than leaving a dead selection behind.
  useEffect(() => {
    if (stored === null || stored === NONE) return;
    const missing = isSaved
      ? !savedTierLists.some(
          (tierList) => getSavedTierListKey(tierList) === stored,
        )
      : fetchError instanceof CommunityApiError && fetchError.status === 404;
    if (missing) queueMicrotask(() => setStored(null));
  }, [stored, isSaved, savedTierLists, fetchError]);

  const selectTierList = useCallback((key: string) => setStored(key), []);
  const followSiteDefault = useCallback(() => setStored(null), []);
  const clearSelection = useCallback(() => setStored(NONE), []);
  const refreshSiteReference = useCallback(
    () => setSettingsVersion((version) => version + 1),
    [],
  );

  const value = useMemo(
    () => ({
      tierLists,
      savedTierLists,
      loading: listLoading || fetching,
      resolving,
      selectedTierList,
      selectedKey,
      siteReferenceId,
      usingSiteDefault,
      selectTierList,
      followSiteDefault,
      clearSelection,
      refreshSiteReference,
    }),
    [
      tierLists,
      savedTierLists,
      listLoading,
      fetching,
      resolving,
      selectedTierList,
      selectedKey,
      siteReferenceId,
      usingSiteDefault,
      selectTierList,
      followSiteDefault,
      clearSelection,
      refreshSiteReference,
    ],
  );

  return createElement(TierListReferenceContext.Provider, { value }, children);
}
