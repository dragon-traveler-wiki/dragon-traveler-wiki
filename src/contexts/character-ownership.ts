import { createContext } from 'react';

export interface CharacterOwnershipContextValue {
  ownedCharacters: Record<string, string>;
  setCharacterStarLevel: (identityKey: string, value: string | null) => void;
  getCharacterStarLevel: (identityKey: string) => string | null;
  isOwned: (identityKey: string) => boolean;
  characterTrackingEnabled: boolean;
  setCharacterTrackingEnabled: (value: boolean) => void;
  grayUnowned: boolean;
  setGrayUnowned: (value: boolean) => void;
  showCharacterTiers: boolean;
  setShowCharacterTiers: (value: boolean) => void;
  showNewUpdatedBadges: boolean;
  setShowNewUpdatedBadges: (value: boolean) => void;
}

export const CharacterOwnershipContext =
  createContext<CharacterOwnershipContextValue>({
    ownedCharacters: {},
    setCharacterStarLevel: () => {},
    getCharacterStarLevel: () => null,
    isOwned: () => false,
    characterTrackingEnabled: true,
    setCharacterTrackingEnabled: () => {},
    grayUnowned: false,
    setGrayUnowned: () => {},
    showCharacterTiers: true,
    setShowCharacterTiers: () => {},
    showNewUpdatedBadges: false,
    setShowNewUpdatedBadges: () => {},
  });
