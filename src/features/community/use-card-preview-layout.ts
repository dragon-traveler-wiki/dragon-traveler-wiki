import { useMediaQuery } from '@mantine/hooks';

/** Portrait sizing shared by every community card's preview strip. */
export function useCardPreviewLayout() {
  const isLarge = useMediaQuery('(min-width: 75em)');
  return {
    isLarge,
    size: isLarge ? 64 : 56,
    subSize: isLarge ? 52 : 44,
    gap: isLarge ? 6 : 4,
  };
}
