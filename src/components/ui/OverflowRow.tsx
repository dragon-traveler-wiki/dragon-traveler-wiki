import { Badge, Box, Group } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import type { ReactNode } from 'react';

interface OverflowChipProps {
  count: number;
  size: number;
}

/** Circular "+N" chip standing in for items that don't fit. */
export function OverflowChip({ count, size }: OverflowChipProps) {
  return (
    <Badge
      size="sm"
      variant="light"
      color="gray"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      +{count}
    </Badge>
  );
}

interface OverflowRowProps {
  /** Pre-keyed, equally sized items. */
  items: ReactNode[];
  /** Item width/height in px, used to work out how many fit. */
  size: number;
  gap?: number;
  /** Upper bound on visible items, even when more would fit. */
  maxVisible?: number;
}

/**
 * A single non-wrapping row that never spills out of its container: it shows
 * as many items as fit (up to `maxVisible`) and reserves the last slot for a
 * "+N" chip when some are cut off.
 */
export default function OverflowRow({
  items,
  size,
  gap = 4,
  maxVisible,
}: OverflowRowProps) {
  const { ref, width } = useElementSize();

  let limit = maxVisible ?? items.length;
  if (width > 0) {
    const fits = Math.max(1, Math.floor((width + gap) / (size + gap)));
    limit = Math.min(limit, items.length > fits ? fits - 1 : fits);
  }
  const visible = items.slice(0, Math.max(0, limit));
  const hidden = items.length - visible.length;

  return (
    <Box
      ref={ref}
      // Hidden until measured so the unmeasured first render can't spill out.
      style={{
        flex: 1,
        minWidth: 0,
        visibility: width > 0 ? 'visible' : 'hidden',
      }}
    >
      <Group gap={gap} wrap="nowrap">
        {visible}
        {hidden > 0 && <OverflowChip count={hidden} size={size} />}
      </Group>
    </Box>
  );
}
