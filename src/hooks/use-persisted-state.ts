import { useEffect } from 'react';
import { writeStoredJson } from '@/utils/saved-storage';

/**
 * Debounced write-through to localStorage. Callers still own their own
 * `useState`s and read the initial value with `readStoredJson`; this hook
 * only handles persisting the combined state back out after it settles.
 */
export function usePersistedState<T>(
  storageKey: string,
  state: T,
  debounceMs = 250,
): void {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      writeStoredJson(storageKey, state);
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, JSON.stringify(state), debounceMs]);
}
