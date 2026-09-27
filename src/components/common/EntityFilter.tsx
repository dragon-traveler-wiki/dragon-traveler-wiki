import { useIsMobile } from '@/hooks';
import { Group, Stack } from '@mantine/core';
import { useState, type ReactNode } from 'react';
import type { ChipFilterGroup } from './EntityFilterGroups';
import {
  FilterChipGroup,
  FilterClearButton,
  FilterSearchInput,
  FilterSection,
  type FilterChipOption,
} from './FilterControls';

export type { ChipFilterGroup } from './EntityFilterGroups';

export interface EntityFilterProps {
  groups?: ChipFilterGroup[];
  selected?: Record<string, string[]>;
  onChange?: (key: string, values: string[]) => void;
  onClear: () => void;
  hasActiveFilters?: boolean;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  beforeGroups?: ReactNode;
  afterGroups?: ReactNode;
}

export default function EntityFilter({
  groups = [],
  selected = {},
  onChange,
  onClear,
  hasActiveFilters,
  search,
  onSearchChange,
  searchPlaceholder = 'Search by name...',
  beforeGroups,
  afterGroups,
}: EntityFilterProps) {
  const isMobile = useIsMobile();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const hasChipFilters = Object.values(selected).some((v) => v.length > 0);
  const hasSearch = search !== undefined && search !== '';
  const hasFilters = (hasActiveFilters ?? hasChipFilters) || hasSearch;
  const handleClear = () => {
    setSearchResetKey((current) => current + 1);
    onClear();
  };

  return (
    <Stack gap={8}>
      {onSearchChange !== undefined && (
        <Group gap="xs" align="center" wrap="wrap">
          <FilterSearchInput
            key={searchResetKey}
            placeholder={searchPlaceholder}
            value={search ?? ''}
            onSearch={onSearchChange}
            size={isMobile ? 'md' : 'xs'}
            style={{ flex: 1, minWidth: 180 }}
          />
          {hasFilters && (
            <FilterClearButton
              size={isMobile ? 'md' : 'compact-xs'}
              onClick={handleClear}
            />
          )}
        </Group>
      )}

      {onSearchChange === undefined && hasFilters && (
        <Group justify="flex-end">
          <FilterClearButton
            size={isMobile ? 'md' : 'compact-xs'}
            onClick={handleClear}
          />
        </Group>
      )}

      {beforeGroups}

      {groups.map((group) => (
        <FilterSection key={group.key} label={group.label}>
          <FilterChipGroup
            value={selected[group.key] ?? []}
            onChange={(val) => onChange?.(group.key, val)}
            size={isMobile ? 'md' : 'xs'}
            options={group.options.map((option): FilterChipOption => ({
              value: option,
              label: (
                <Group gap={4} wrap="nowrap" align="center">
                  {group.icon?.(option)}
                  <span>{group.labelFn ? group.labelFn(option) : option}</span>
                </Group>
              ),
            }))}
          />
        </FilterSection>
      ))}

      {afterGroups}
    </Stack>
  );
}
