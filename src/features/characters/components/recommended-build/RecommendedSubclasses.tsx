import { Center, Group, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import ExpandableText from '@/components/ui/ExpandableText';
import ClassTag from '@/components/ui/ClassTag';
import TierBadge from '@/components/ui/TierBadge';
import RichText from '@/components/common/RichText';
import SafeImage from '@/components/ui/SafeImage';
import { StaticSurface } from '@/components/ui/Surface';
import { RICH_TOOLTIP_STYLES } from '@/constants/styles';
import { POPOVER_MAX_WIDTH } from '@/constants/ui';
import type { RecommendedSubclassEntry } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useMobileTooltip } from '@/hooks';

interface RecommendedSubclassesProps {
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  statusEffects: StatusEffect[];
}

export default function RecommendedSubclasses({
  recommendedSubclassEntries,
  statusEffects,
}: RecommendedSubclassesProps) {
  const mobileTooltip = useMobileTooltip();

  return (
    <Stack gap="sm">
      <Text fw={600} size="sm">
        Recommended Subclasses
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {recommendedSubclassEntries.map((entry) => {
          const tooltipLabel = (
            <Stack gap={6}>
              <Text size="xs" fw={700}>
                {entry.name}
              </Text>
              <Group gap={6} wrap="wrap">
                {typeof entry.tier === 'number' && (
                  <TierBadge tier={String(entry.tier)} showPrefix size="xs" />
                )}
                {entry.className && (
                  <ClassTag characterClass={entry.className} size="xs" />
                )}
              </Group>
              {entry.effect && (
                <RichText
                  text={entry.effect}
                  statusEffects={statusEffects}
                  disablePopovers
                />
              )}
              {entry.bonuses.length > 0 && (
                <Text size="xs" c="dimmed">
                  Bonuses: {entry.bonuses.join(', ')}
                </Text>
              )}
            </Stack>
          );

          return (
            <Tooltip
              key={entry.name}
              label={tooltipLabel}
              multiline
              maw={POPOVER_MAX_WIDTH}
              styles={RICH_TOOLTIP_STYLES}
              {...mobileTooltip}
            >
              <StaticSurface p="sm">
                <Group gap="sm" align="flex-start" wrap="nowrap">
                  {entry.icon && (
                    <Center
                      style={{
                        width: 56,
                        minWidth: 56,
                        height: 52,
                        borderRadius: 8,
                        border: '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <SafeImage
                        src={entry.icon}
                        alt={entry.name}
                        w={50}
                        h={46}
                        fit="contain"
                        loading="lazy"
                      />
                    </Center>
                  )}

                  <Stack gap={4} style={{ minWidth: 0 }}>
                    <Group gap={6} wrap="wrap">
                      <Text fw={600} size="sm" truncate>
                        {entry.name}
                      </Text>
                      {typeof entry.tier === 'number' && (
                        <TierBadge
                          tier={String(entry.tier)}
                          showPrefix
                          size="xs"
                        />
                      )}
                      {entry.className && (
                        <ClassTag characterClass={entry.className} size="xs" />
                      )}
                    </Group>
                    {entry.bonuses.length > 0 && (
                      <ExpandableText size="xs">
                        Bonuses: {entry.bonuses.join(', ')}
                      </ExpandableText>
                    )}
                  </Stack>
                </Group>
              </StaticSurface>
            </Tooltip>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
