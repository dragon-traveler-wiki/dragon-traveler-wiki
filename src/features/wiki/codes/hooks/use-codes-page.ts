import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import { STORAGE_KEY } from '@/constants/ui';
import {
  aggregateCodeRewards,
  filterCodes,
  getCodeEmptyState,
  getTabCodes,
  type CodeTab,
  type CodeView,
} from '@/features/wiki/codes/code-catalog';
import type { ViewMode } from '@/hooks';
import {
  getPageSizeStorageKey,
  usePageSize,
  usePagination,
  useSearchParamText,
  useTabParam,
  useViewMode,
} from '@/hooks';
import type { Code } from '@/features/wiki/codes/types';
import {
  getLatestTimestamp,
  readStoredStringSet,
  writeStoredStringSet,
} from '@/utils';
import { showInfoToast, showSuccessToast } from '@/utils/toast';

const CODES_PER_PAGE = 20;
const CODE_PAGE_SIZE_OPTIONS: Record<ViewMode, readonly number[]> = {
  grid: [6, 12, 18, 24],
  list: [10, 20, 30, 50],
};

function saveRedeemedCodes(redeemed: Set<string>) {
  if (writeStoredStringSet(STORAGE_KEY.REDEEMED_CODES, redeemed)) {
    window.dispatchEvent(new Event('redeemed-codes-updated'));
  }
}

export function useCodesPage(codes: Code[]) {
  const [searchParams] = useSearchParams();
  const [redeemed, setRedeemed] = useState(() =>
    readStoredStringSet(STORAGE_KEY.REDEEMED_CODES),
  );
  const [view, setView] = useState<CodeView>('unredeemed');
  const [tabValue, setTab] = useTabParam('tab', 'active', [
    'active',
    'expired',
  ]);
  const tab = tabValue as CodeTab;
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [viewMode, setViewMode] = useViewMode({
    storageKey: STORAGE_KEY.CODES_VIEW_MODE,
    defaultMode: 'list',
  });
  const [rewardsOpen, { toggle: toggleRewards }] = useDisclosure(
    (() => {
      try {
        return localStorage.getItem(STORAGE_KEY.CODES_REWARDS_OPEN) === 'true';
      } catch {
        return false;
      }
    })(),
  );
  const [markAllOpened, markAllModal] = useDisclosure(false);
  const [clearAllOpened, clearAllModal] = useDisclosure(false);
  useSearchParamText(setSearch);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY.CODES_REWARDS_OPEN, String(rewardsOpen));
    } catch {
      // The summary remains usable when browser storage is unavailable.
    }
  }, [rewardsOpen]);

  const tabCodes = useMemo(() => getTabCodes(codes, tab), [codes, tab]);
  const filtered = useMemo(
    () => filterCodes(codes, tab, view, redeemed, search),
    [codes, redeemed, search, tab, view],
  );
  const toggleRedeemed = useCallback((code: string) => {
    setRedeemed((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      saveRedeemedCodes(next);
      return next;
    });
  }, []);
  const markAllRedeemed = useCallback(() => {
    setRedeemed((current) => {
      const next = new Set(current);
      tabCodes.forEach(({ code }) => next.add(code));
      saveRedeemedCodes(next);
      return next;
    });
    showSuccessToast({
      title: 'Codes marked as redeemed',
      message: `Marked ${tabCodes.length} ${tab} codes as redeemed.`,
    });
  }, [tab, tabCodes]);
  const clearAllRedeemed = useCallback(() => {
    setRedeemed((current) => {
      const next = new Set(current);
      tabCodes.forEach(({ code }) => next.delete(code));
      saveRedeemedCodes(next);
      return next;
    });
    showInfoToast({
      title: 'Redeemed status cleared',
      message: `Marked ${tabCodes.length} ${tab} codes as unredeemed.`,
    });
  }, [tab, tabCodes]);
  const { pageSize, setPageSize, pageSizeOptions } = usePageSize(
    CODE_PAGE_SIZE_OPTIONS[viewMode],
    {
      defaultSize: CODES_PER_PAGE,
      storageKey: getPageSizeStorageKey(STORAGE_KEY.CODES_VIEW_MODE),
    },
  );
  const { page, setPage, totalPages, offset } = usePagination(
    filtered.length,
    pageSize,
    JSON.stringify({ search, view, tab }),
  );
  const unclaimedRewards = useMemo(
    () =>
      aggregateCodeRewards(tabCodes.filter(({ code }) => !redeemed.has(code))),
    [redeemed, tabCodes],
  );
  const claimedRewards = useMemo(
    () =>
      aggregateCodeRewards(tabCodes.filter(({ code }) => redeemed.has(code))),
    [redeemed, tabCodes],
  );

  return {
    redeemed,
    view,
    setView,
    tab,
    setTab,
    search,
    setSearch,
    viewMode,
    setViewMode,
    rewardsOpen,
    toggleRewards,
    markAllOpened,
    openMarkAll: markAllModal.open,
    closeMarkAll: markAllModal.close,
    clearAllOpened,
    openClearAll: clearAllModal.open,
    closeClearAll: clearAllModal.close,
    markAllRedeemed,
    clearAllRedeemed,
    toggleRedeemed,
    filtered,
    pageItems: filtered.slice(offset, offset + pageSize),
    page,
    setPage,
    totalPages,
    pageSize,
    setPageSize,
    pageSizeOptions,
    tabCodeCount: tabCodes.length,
    unclaimedRewards,
    claimedRewards,
    emptyState: getCodeEmptyState(tab, view, search),
    mostRecentUpdate: getLatestTimestamp(codes),
  };
}
