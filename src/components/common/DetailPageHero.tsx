import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getDetailHeroGradient,
} from '@/constants/detail-styles';
import {
  Box,
  Container,
  Stack,
  type ContainerProps,
  type StyleProp,
  type MantineSpacing,
} from '@mantine/core';
import type { ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface DetailPageHeroProps {
  isDark: boolean;
  /** Mantine color name for the primary gradient color */
  qualityColor: string;
  /** Mantine color name for the secondary gradient color (default: 'violet') */
  secondaryColor?: string;
  /** Opacity overrides for gradient in dark/light mode */
  gradientOpacity?: { dark: number; light: number };
  breadcrumbItems: BreadcrumbItem[];
  /** Container size; match the page's main content container (default: 'lg') */
  size?: ContainerProps['size'];
  py?: StyleProp<MantineSpacing>;
  children: ReactNode;
}

export default function DetailPageHero({
  isDark,
  qualityColor,
  secondaryColor,
  gradientOpacity,
  breadcrumbItems,
  size = 'lg',
  py = { base: 'lg', sm: 'xl' },
  children,
}: DetailPageHeroProps) {
  return (
    <Box style={DETAIL_HERO_WRAPPER_STYLES}>
      <Box
        style={getDetailHeroGradient(
          isDark,
          qualityColor,
          secondaryColor,
          gradientOpacity,
        )}
      />
      <Container
        size={size}
        style={{ position: 'relative', zIndex: 1 }}
        py={py}
      >
        <Stack gap="lg">
          <Breadcrumbs items={breadcrumbItems} />
          {children}
        </Stack>
      </Container>
    </Box>
  );
}
