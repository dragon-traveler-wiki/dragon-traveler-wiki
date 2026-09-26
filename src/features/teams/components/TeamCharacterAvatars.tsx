import { Box, Group } from '@mantine/core';
import OverflowRow, { OverflowChip } from '@/components/ui/OverflowRow';
import CharacterPortrait from '@/features/characters/components/CharacterPortrait';
import type { Character } from '@/features/characters/types';
import {
  getCharacterRoutePath,
  getCharacterRouteSlug,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';

export default function TeamCharacterAvatars({
  refs,
  preferredByName,
  byIdentity,
  size,
  isSubstitute = false,
  layout = 'wrap',
  columns = 3,
  gap = 4,
  wrap = 'wrap',
  maxVisible,
  portraitClassName,
}: {
  refs: Array<{ name: string; quality?: string }>;
  preferredByName: Map<string, Character>;
  byIdentity: Map<string, Character>;
  size: number;
  isSubstitute?: boolean;
  layout?: 'wrap' | 'grid';
  columns?: number;
  gap?: number;
  wrap?: 'wrap' | 'nowrap';
  maxVisible?: number;
  /** Extra class on every portrait (e.g. to keep them clickable above a stretched card link). */
  portraitClassName?: string;
}) {
  const isGrid = layout === 'grid';
  const isSingleRow = !isGrid && wrap === 'nowrap' && maxVisible !== undefined;
  const gridLimit =
    isGrid && maxVisible !== undefined ? maxVisible : refs.length;
  const visibleNames = isGrid ? refs.slice(0, Math.max(0, gridLimit)) : refs;
  const hiddenCount = refs.length - visibleNames.length;

  const portraits = visibleNames.map((entry) => {
    const char = resolveCharacterByNameAndQuality(
      entry.name,
      entry.quality,
      preferredByName,
      byIdentity,
    );
    const displayName = char?.name ?? entry.name;
    const assetKey = char ? getCharacterRouteSlug(char) : undefined;
    return (
      <CharacterPortrait
        key={`${isSubstitute ? 'sub' : 'main'}-${entry.name}-${entry.quality ?? ''}`}
        name={displayName}
        size={size}
        quality={char?.quality}
        assetKey={assetKey}
        routePath={char ? getCharacterRoutePath(char) : undefined}
        isSubstitute={isSubstitute}
        className={portraitClassName}
        tooltip={isSubstitute ? `${displayName} (Sub)` : displayName}
      />
    );
  });

  if (isGrid) {
    return (
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${size}px)`,
          gap: 6,
        }}
      >
        {portraits}
        {hiddenCount > 0 && <OverflowChip count={hiddenCount} size={size} />}
      </Box>
    );
  }

  if (isSingleRow) {
    return (
      <OverflowRow
        items={portraits}
        size={size}
        gap={gap}
        maxVisible={maxVisible}
      />
    );
  }

  return (
    <Group gap={gap} wrap={wrap}>
      {portraits}
    </Group>
  );
}
