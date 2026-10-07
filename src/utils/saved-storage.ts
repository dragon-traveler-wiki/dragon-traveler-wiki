export function readStoredJson<T>(
  storageKey: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredJson<T>(storageKey: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readStoredString(storageKey: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(storageKey) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredString(storageKey: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(storageKey, value);
    return true;
  } catch {
    return false;
  }
}

export function readStoredStringSet(storageKey: string): Set<string> {
  const values = readStoredJson(
    storageKey,
    [] as string[],
    (value): value is string[] =>
      Array.isArray(value) && value.every((item) => typeof item === 'string'),
  );
  return new Set(values);
}

export function writeStoredStringSet(
  storageKey: string,
  values: Set<string>,
): boolean {
  return writeStoredJson(storageKey, [...values]);
}

type SavedStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface SavedEntityOptions<T extends { last_updated?: number }> {
  storageKey: string;
  isValid: (value: Partial<T>) => boolean;
  migrate?: (value: Partial<T>) => T;
  storage?: SavedStorage;
  now?: () => number;
}

function getSavedStorage(storage?: SavedStorage): SavedStorage | null {
  if (storage) return storage;
  return typeof window === 'undefined' ? null : window.localStorage;
}

function parseSavedRecord(
  storage: SavedStorage,
  storageKey: string,
): Record<string, unknown> {
  const raw = storage.getItem(storageKey);
  if (!raw) return {};

  const parsed: unknown = JSON.parse(raw);
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }
  return parsed as Record<string, unknown>;
}

function normalizeSavedEntity<T extends { last_updated?: number }>(
  value: unknown,
  options: SavedEntityOptions<T>,
): T | null {
  if (value === null || typeof value !== 'object') return null;
  const partial = value as Partial<T>;
  if (!options.isValid(partial)) return null;

  const item = options.migrate
    ? options.migrate(partial)
    : ({ ...partial } as T);
  if ((item.last_updated ?? 0) <= 0) {
    const now = options.now ?? (() => Math.floor(Date.now() / 1000));
    item.last_updated = now();
  }
  return item;
}

/**
 * Loads, validates, migrates, and sorts a collection of user-saved entities.
 * Invalid or inaccessible storage is treated as an empty collection.
 */
export function loadSavedFromStorage<T extends { last_updated?: number }>(
  storageKey: string,
  isValid: (value: Partial<T>) => boolean,
  migrate?: (value: Partial<T>) => T,
  storage?: SavedStorage,
  now?: () => number,
): T[] {
  const targetStorage = getSavedStorage(storage);
  if (!targetStorage) return [];
  try {
    const saved = parseSavedRecord(targetStorage, storageKey);
    let changed = false;
    const items: T[] = [];
    for (const [slug, value] of Object.entries(saved)) {
      const item = normalizeSavedEntity(value, {
        storageKey,
        isValid,
        migrate,
        storage: targetStorage,
        now,
      });
      if (!item) continue;

      if (migrate || item.last_updated !== (value as Partial<T>).last_updated) {
        saved[slug] = item;
        changed = true;
      }
      items.push(item);
    }

    items.sort((a, b) => (b.last_updated ?? 0) - (a.last_updated ?? 0));
    if (changed) targetStorage.setItem(storageKey, JSON.stringify(saved));
    return items;
  } catch {
    return [];
  }
}

/** Reads one validated entity and persists any required migration. */
export function getSavedFromStorage<T extends { last_updated?: number }>(
  slug: string,
  options: SavedEntityOptions<T>,
): T | null {
  const storage = getSavedStorage(options.storage);
  if (!storage) return null;
  try {
    const saved = parseSavedRecord(storage, options.storageKey);
    const item = normalizeSavedEntity(saved[slug], options);
    if (!item) return null;
    saved[slug] = item;
    storage.setItem(options.storageKey, JSON.stringify(saved));
    return item;
  } catch {
    return null;
  }
}

export function hasSavedInStorage(
  storageKey: string,
  slug: string,
  storage?: SavedStorage,
): boolean {
  const targetStorage = getSavedStorage(storage);
  if (!targetStorage) return false;
  try {
    return Object.hasOwn(parseSavedRecord(targetStorage, storageKey), slug);
  } catch {
    return false;
  }
}

/** Saves an entity or throws when browser storage cannot be updated. */
export function upsertSavedInStorage<T>(
  storageKey: string,
  slug: string,
  item: T,
  storage?: SavedStorage,
): void {
  const targetStorage = getSavedStorage(storage);
  if (!targetStorage) throw new Error('Browser storage is unavailable.');
  const saved = parseSavedRecord(targetStorage, storageKey);
  saved[slug] = item;
  targetStorage.setItem(storageKey, JSON.stringify(saved));
}

/** Deletes an entity or throws when browser storage cannot be updated. */
export function deleteSavedFromStorage(
  storageKey: string,
  slug: string,
  storage?: SavedStorage,
): void {
  const targetStorage = getSavedStorage(storage);
  if (!targetStorage) throw new Error('Browser storage is unavailable.');
  const saved = parseSavedRecord(targetStorage, storageKey);
  delete saved[slug];
  targetStorage.setItem(storageKey, JSON.stringify(saved));
}

/** Parses the URL-based tab mode for pages with view/saved/builder tabs. */
export function parseTabMode(raw: string | null): 'view' | 'saved' | 'builder' {
  if (raw === 'saved' || raw === 'builder') return raw;
  return 'view';
}
