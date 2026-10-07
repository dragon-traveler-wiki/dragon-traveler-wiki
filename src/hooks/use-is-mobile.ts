import { useMediaQuery } from '@mantine/hooks';
import { BREAKPOINTS } from '@/constants/ui';

export function useIsMobile() {
  return useMediaQuery(BREAKPOINTS.MOBILE, undefined, {
    getInitialValueInEffect: false,
  });
}
