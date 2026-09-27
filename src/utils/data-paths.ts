export const SUPPORTED_LOCALES = [
  'enUS',
  'zhCN',
  'zhTW',
  'jaJP',
  'koKR',
  'thTH',
  'viVN',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'enUS';

// Files shared across all locales — live in data/global/.
const GLOBAL_FILE_SET = new Set([
  'changelog.json',
  'codes.json',
  'events.json',
  'star-levels.json',
  'useful-links.json',
]);

/** Absolute data path for a JSON file under the given locale (or global). */
export function dataPath(
  filename: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  if (GLOBAL_FILE_SET.has(filename)) {
    return `data/global/${filename}`;
  }
  return `data/${locale}/${filename}`;
}

/** Absolute data path for a change-history file. */
export function changesPath(
  filename: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string {
  if (GLOBAL_FILE_SET.has(filename)) {
    return `data/global/changes/${filename}`;
  }
  return `data/${locale}/changes/${filename}`;
}
