import {
  Badge,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import ExpandableText from '@/components/ui/ExpandableText';
import RichText from '@/components/common/RichText';
import { StaticSurface } from '@/components/ui/Surface';
import { RICH_TOOLTIP_STYLES } from '@/constants/styles';
import { POPOVER_MAX_WIDTH } from '@/constants/ui';
import type { ActivatedSetBonus } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent, useMobileTooltip } from '@/hooks';

interface ActivatedSetBonusesProps {
  activatedSetBonuses: ActivatedSetBonus[];
  statusEffects: StatusEffect[];
}

export default function ActivatedSetBonuses({
  activatedSetBonuses,
  statusEffects,
}: ActivatedSetBonusesProps) {
  const { accent } = useGradientAccent();
  const mobileTooltip = useMobileTooltip();

  return (
    <Stack gap="xs">
      <Text fw={600} size="sm">
        Activated Set Bonuses
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {activatedSetBonuses.map((setBonus) => {
          const tooltipLabel = (
            <Stack gap="xs">
              <Text fw={700} size="sm" style={{ lineHeight: 1.25 }}>
                {setBonus.setDisplayName} Set
              </Text>
              <Divider />
              <Group gap={6} wrap="wrap">
                <Badge variant="light" color="gray" size="xs">
                  Pieces: {setBonus.pieces}/{setBonus.requiredPieces}
                </Badge>
                <Badge variant="light" color={accent.primary} size="xs">
                  Activations: ×{setBonus.activations}
                </Badge>
              </Group>
              <Stack gap={2}>
                <Text size="xs" c="dimmed" fw={600}>
                  Effect
                </Text>
                <RichText
                  text={setBonus.description}
                  statusEffects={statusEffects}
                  disablePopovers
                />
              </Stack>
            </Stack>
          );

          return (
            <Tooltip
              key={setBonus.setName}
              label={tooltipLabel}
              multiline
              maw={POPOVER_MAX_WIDTH}
              styles={RICH_TOOLTIP_STYLES}
              {...mobileTooltip}
            >
              <StaticSurface p="sm">
                <Stack gap={4}>
                  <Group justify="space-between" gap="xs">
                    <Text fw={600} size="sm" truncate>
                      {setBonus.setDisplayName}
                    </Text>
                    <Badge variant="filled" color={accent.primary} size="xs">
                      ×{setBonus.activations}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {setBonus.pieces}/{setBonus.requiredPieces} pieces
                  </Text>
                  <ExpandableText size="xs">
                    <RichText
                      text={setBonus.description}
                      statusEffects={statusEffects}
                    />
                  </ExpandableText>
                </Stack>
              </StaticSurface>
            </Tooltip>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
