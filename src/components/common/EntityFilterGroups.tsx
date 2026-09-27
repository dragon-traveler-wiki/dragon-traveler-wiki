import { CLASS_ICON_MAP } from '@/assets';
import { FACTION_ICON_MAP } from '@/assets';
import { CLASS_ORDER } from '@/constants/class-colors';
import { FACTION_SLUGS } from '@/constants/faction-colors';
import { QUALITY_ORDER } from '@/constants/quality';
import { IMAGE_SIZE } from '@/constants/ui';
import QualityIcon from '@/components/ui/QualityIcon';
import type { CharacterClass } from '@/features/characters/types';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import type { FactionSlug } from '@/types/faction';
import type { Quality } from '@/types/quality';
import SafeImage from '@/components/ui/SafeImage';
import type { ReactNode } from 'react';

export interface ChipFilterGroup {
  key: string;
  label: string;
  options: string[];
  icon?: (value: string) => ReactNode;
  labelFn?: (value: string) => string;
}

interface BaseFilterGroupOptions {
  key?: string;
  label?: string;
}

interface OrderedFilterGroupOptions<
  T extends string,
> extends BaseFilterGroupOptions {
  options?: readonly T[];
}

export function orderFilterOptions<T extends string>(
  options: Iterable<T>,
  preferredOrder: readonly T[],
): T[] {
  const orderIndex = new Map(
    preferredOrder.map((value, index) => [value, index] as const),
  );

  return [...new Set(options)].sort((left, right) => {
    const leftIndex = orderIndex.get(left);
    const rightIndex = orderIndex.get(right);

    if (leftIndex !== undefined || rightIndex !== undefined) {
      if (leftIndex === undefined) return 1;
      if (rightIndex === undefined) return -1;
      return leftIndex - rightIndex;
    }

    return left.localeCompare(right);
  });
}

export function createQualityFilterGroup({
  key = 'qualities',
  label = 'Quality',
  options = QUALITY_ORDER,
}: OrderedFilterGroupOptions<Quality> = {}): ChipFilterGroup {
  return {
    key,
    label,
    options: [...options],
    icon: (value: string) => (
      <QualityIcon quality={value as Quality} size={14} showTooltip={false} />
    ),
  };
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function createClassFilterGroup({
  key = 'classes',
  label = 'Class',
  options = CLASS_ORDER,
}: OrderedFilterGroupOptions<CharacterClass> = {}): ChipFilterGroup {
  return {
    key,
    label,
    options: [...options],
    labelFn: capitalize,
    icon: (value: string) => {
      const iconSrc =
        CLASS_ICON_MAP[value as CharacterClass] ??
        (CLASS_ICON_MAP as Record<string, string | undefined>)[value];

      return iconSrc ? (
        <SafeImage
          src={iconSrc}
          alt={value}
          w={IMAGE_SIZE.ICON_SM}
          h={IMAGE_SIZE.ICON_SM}
          fit="contain"
        />
      ) : null;
    },
  };
}

export function createFactionFilterGroup({
  key = 'factions',
  label = 'Faction',
  options = FACTION_SLUGS,
}: OrderedFilterGroupOptions<FactionSlug> = {}): ChipFilterGroup {
  return {
    key,
    label,
    options: [...options],
    labelFn: (value: string) =>
      FACTION_SLUG_TO_NAME[value as FactionSlug] ?? value,
    icon: (value: string) => {
      const iconSrc =
        FACTION_ICON_MAP[value as FactionSlug] ??
        (FACTION_ICON_MAP as Record<string, string | undefined>)[value];

      return iconSrc ? (
        <SafeImage
          src={iconSrc}
          alt={FACTION_SLUG_TO_NAME[value as FactionSlug] ?? value}
          w={IMAGE_SIZE.ICON_SM}
          h={IMAGE_SIZE.ICON_SM}
          fit="contain"
        />
      ) : null;
    },
  };
}
