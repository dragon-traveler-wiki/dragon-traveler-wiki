import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getDetailHeroGradient,
} from '@/constants/detail-styles';
import { Box, Container, Stack } from '@mantine/core';
import type { ReactNode } from 'react';
import { PAGE_WIDTH } from '@/constants/ui';

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
  children: ReactNode;
}

export default function DetailPageHero({
  isDark,
  qualityColor,
  secondaryColor,
  gradientOpacity,
  breadcrumbItems,
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
        size={PAGE_WIDTH.WIDE}
        style={{ position: 'relative', zIndex: 1 }}
        py={{ base: 'lg', sm: 'xl' }}
      >
        <Stack gap="lg">
          <Breadcrumbs items={breadcrumbItems} />
          {children}
        </Stack>
      </Container>
    </Box>
  );
}
