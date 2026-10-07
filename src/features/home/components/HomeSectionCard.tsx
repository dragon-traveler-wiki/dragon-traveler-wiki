import { StaticSurface } from '@/components/ui/Surface';
import { useGradientAccent } from '@/hooks';
import {
  Anchor,
  Box,
  Group,
  Stack,
  ThemeIcon,
  Title,
  type MantineColor,
} from '@mantine/core';
import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router';

interface HomeSectionCardProps {
  title: string;
  icon: ComponentType<{ size?: number }>;
  to?: string;
  linkLabel?: string;
  color?: MantineColor;
  children: ReactNode;
}

export default function HomeSectionCard({
  title,
  icon: Icon,
  to,
  linkLabel,
  color,
  children,
}: HomeSectionCardProps) {
  const { accent } = useGradientAccent();
  const iconColor = color ?? accent.primary;

  return (
    <StaticSurface
      p={{ base: 'sm', sm: 'lg' }}
      h="100%"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, var(--mantine-color-${iconColor}-5), var(--mantine-color-${iconColor}-3))`,
        }}
      />
      <Stack gap="md">
        <Group justify="space-between" align="center" gap="sm">
          <Group gap="sm">
            <ThemeIcon variant="light" color={iconColor} size="lg" radius="md">
              <Icon size={20} />
            </ThemeIcon>
            <Title order={2} size="h3">
              {title}
            </Title>
          </Group>
          {to && linkLabel && (
            <Anchor component={Link} to={to} size="xs" c={iconColor}>
              {linkLabel}
            </Anchor>
          )}
        </Group>
        {children}
      </Stack>
    </StaticSurface>
  );
}
