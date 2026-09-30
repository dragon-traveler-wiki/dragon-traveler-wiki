import { STORAGE_KEY } from '@/constants/ui';
import { useState, type ReactNode } from 'react';
import { CharacterOwnershipContext } from './character-ownership';

// Migrate ownership keys from the old "slug__quality" format to plain slug.
function migrateOwnershipKeys(
  data: Record<string, string>,
): Record<string, string> {
  const migrated: Record<string, string> = {};
  let changed = false;
  for (const [key, value] of Object.entries(data)) {
    const separatorIndex = key.indexOf('__');
    if (separatorIndex !== -1) {
      migrated[key.slice(0, separatorIndex)] = value;
      changed = true;
    } else {
      migrated[key] = value;
    }
  }
  if (changed) {
    window.localStorage.setItem(
      STORAGE_KEY.CHARACTER_OWNERSHIP,
      JSON.stringify(migrated),
    );
  }
  return migrated;
}

function loadOwnedFromStorage(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY.CHARACTER_OWNERSHIP);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      return {};
    return migrateOwnershipKeys(parsed as Record<string, string>);
  } catch {
    return {};
  }
}

function loadGrayUnownedFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(STORAGE_KEY.UI_GRAY_UNOWNED) === 'true';
}

function loadBoolPref(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return defaultValue;
  return raw === 'true';
}

export function CharacterOwnershipProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ownedCharacters, setOwnedCharacters] = useState<
    Record<string, string>
  >(() => loadOwnedFromStorage());
  const [characterTrackingEnabled, setCharacterTrackingEnabledState] =
    useState<boolean>(() =>
      loadBoolPref(STORAGE_KEY.UI_CHARACTER_TRACKING_ENABLED, true),
    );
  const [grayUnowned, setGrayUnownedState] = useState<boolean>(() =>
    loadGrayUnownedFromStorage(),
  );
  const [showCharacterTiers, setShowCharacterTiersState] = useState<boolean>(
    () => loadBoolPref(STORAGE_KEY.UI_SHOW_CHARACTER_TIERS, true),
  );
  const [showNewUpdatedBadges, setShowNewUpdatedBadgesState] =
    useState<boolean>(() =>
      loadBoolPref(STORAGE_KEY.UI_SHOW_NEW_UPDATED_BADGES, false),
    );

  const setCharacterStarLevel = (identityKey: string, value: string | null) => {
    setOwnedCharacters((prev) => {
      const next = { ...prev };
      if (value === null) {
        delete next[identityKey];
      } else {
        next[identityKey] = value;
      }
      window.localStorage.setItem(
        STORAGE_KEY.CHARACTER_OWNERSHIP,
        JSON.stringify(next),
      );
      return next;
    });
  };

  const getCharacterStarLevel = (identityKey: string): string | null =>
    ownedCharacters[identityKey] ?? null;

  const isOwned = (identityKey: string): boolean =>
    identityKey in ownedCharacters;

  const setCharacterTrackingEnabled = (value: boolean) => {
    setCharacterTrackingEnabledState(value);
    window.localStorage.setItem(
      STORAGE_KEY.UI_CHARACTER_TRACKING_ENABLED,
      String(value),
    );
  };

  const setGrayUnowned = (value: boolean) => {
    setGrayUnownedState(value);
    window.localStorage.setItem(STORAGE_KEY.UI_GRAY_UNOWNED, String(value));
  };

  const setShowCharacterTiers = (value: boolean) => {
    setShowCharacterTiersState(value);
    window.localStorage.setItem(
      STORAGE_KEY.UI_SHOW_CHARACTER_TIERS,
      String(value),
    );
  };

  const setShowNewUpdatedBadges = (value: boolean) => {
    setShowNewUpdatedBadgesState(value);
    window.localStorage.setItem(
      STORAGE_KEY.UI_SHOW_NEW_UPDATED_BADGES,
      String(value),
    );
  };

  return (
    <CharacterOwnershipContext.Provider
      value={{
        ownedCharacters,
        setCharacterStarLevel,
        getCharacterStarLevel,
        isOwned,
        characterTrackingEnabled,
        setCharacterTrackingEnabled,
        grayUnowned,
        setGrayUnowned,
        showCharacterTiers,
        setShowCharacterTiers,
        showNewUpdatedBadges,
        setShowNewUpdatedBadges,
      }}
    >
      {children}
    </CharacterOwnershipContext.Provider>
  );
}
