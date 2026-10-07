import SafeImage from '@/components/ui/SafeImage';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR } from '@/constants/quality';
import { InteractiveSurface } from '@/components/ui/Surface';
import { getWyrmIcon } from '@/assets';
import { WYRM_PHASE_COLOR } from '@/constants/wyrm-colors';
import type { Wyrm } from '@/features/wiki/wyrms/types';

import { Badge, Group, Stack, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { Link } from 'react-router';

function EvolutionCard({
  label,
  w,
  isDark,
}: {
  label: 'Evolves From' | 'Evolves To';
  w: Wyrm;
  isDark: boolean;
}) {
  const iconSrc = getWyrmIcon(w.slug);
  const qualityColor = QUALITY_COLOR[w.quality];
  const phaseColor = WYRM_PHASE_COLOR[w.phase];

  return (
    <InteractiveSurface
      component={Link}
      to={`/wyrms/${w.slug}`}
      p="lg"
      style={{
        textDecoration: 'none',
        flex: 1,
        borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
      }}
    >
      <Stack gap="sm">
        <Text
          size="xs"
          tt="uppercase"
          fw={700}
          c={`${qualityColor}.${isDark ? 4 : 6}`}
          style={{ letterSpacing: '0.06em' }}
        >
          {label}
        </Text>
        <Group gap="md" align="center" wrap="nowrap">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={w.name}
              w={56}
              h={56}
              fit="contain"
              style={{ flexShrink: 0 }}
            />
          )}
          <Stack gap={6}>
            <Text
              fw={700}
              size="md"
              className="dt-link-text"
              style={{ lineHeight: 1.2 }}
            >
              {w.name}
            </Text>
            <Group gap="xs" wrap="wrap">
              <QualityIcon quality={w.quality} />
              <Badge variant="light" size="xs" color={phaseColor}>
                {w.phase}
              </Badge>
            </Group>
            <FactionTag faction={w.faction} size="sm" />
          </Stack>
        </Group>
      </Stack>
    </InteractiveSurface>
  );
}

export default function EvolutionSection({
  wyrm,
  allWyrms,
  isDark,
}: {
  wyrm: Wyrm;
  allWyrms: Wyrm[];
  isDark: boolean;
}) {
  const bySlug = useMemo(
    () => new Map(allWyrms.map((w) => [w.slug, w])),
    [allWyrms],
  );
  const prev = wyrm.evolves_from ? bySlug.get(wyrm.evolves_from) : undefined;
  const next = wyrm.evolves_to ? bySlug.get(wyrm.evolves_to) : undefined;

  if (!prev && !next) return null;

  return (
    <Stack gap="md">
      <Title order={2} size="h3">
        Evolution
      </Title>
      <Group gap="sm" align="stretch" wrap="wrap">
        {prev && (
          <EvolutionCard label="Evolves From" w={prev} isDark={isDark} />
        )}
        {next && <EvolutionCard label="Evolves To" w={next} isDark={isDark} />}
      </Group>
    </Stack>
  );
}
