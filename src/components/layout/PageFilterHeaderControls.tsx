import ViewToggle from '@/components/ui/ViewToggle';
import { Z_INDEX } from '@/constants/ui';
import type { ViewMode } from '@/hooks/use-filters';
import { Box, Group } from '@mantine/core';
import { type ReactNode } from 'react';
import FilterPopoverButton from './FilterPopoverButton';

interface PageFilterHeaderControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterCount: number;
  filterOpen?: boolean;
  onFilterToggle: () => void;
  buttonLabel?: string;
  children?: ReactNode;
  sticky?: boolean;
  /** Extra controls rendered before the view toggle, e.g. a sort select. */
  extraControls?: ReactNode;
}

export default function PageFilterHeaderControls({
  viewMode,
  onViewModeChange,
  filterCount,
  filterOpen = false,
  onFilterToggle,
  buttonLabel = 'Filters',
  children,
  sticky = false,
  extraControls,
}: PageFilterHeaderControlsProps) {
  return (
    <Box
      className={sticky ? 'dt-themed-surface' : undefined}
      style={
        sticky
          ? {
              position: 'sticky',
              top: 'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-xs))',
              zIndex: Z_INDEX.STICKY,
              padding: 'var(--mantine-spacing-xs)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-default-border)',
            }
          : undefined
      }
    >
      <Group gap="xs" justify={sticky ? 'flex-end' : undefined}>
        {extraControls}
        <ViewToggle viewMode={viewMode} onChange={onViewModeChange} />
        <FilterPopoverButton
          filterCount={filterCount}
          filterOpen={filterOpen}
          onFilterToggle={onFilterToggle}
          buttonLabel={buttonLabel}
        >
          {children}
        </FilterPopoverButton>
      </Group>
    </Box>
  );
}
