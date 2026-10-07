import { Link } from 'react-router';
import {
  Badge,
  Divider,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import RichText from '@/components/common/RichText';
import SafeImage from '@/components/ui/SafeImage';
import QualityIcon from '@/components/ui/QualityIcon';
import { StaticSurface } from '@/components/ui/Surface';
import { RICH_TOOLTIP_STYLES } from '@/constants/styles';
import { IMAGE_SIZE, POPOVER_MAX_WIDTH } from '@/constants/ui';
import GearTypeTag from '@/features/wiki/gear/components/GearTypeTag';
import type { RecommendedGearLoadoutData } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import { toQuality } from '@/utils/quality';

interface RecommendedGearLoadoutProps {
  recommendedGearLoadouts: RecommendedGearLoadoutData[];
  selectedLoadoutIndex: number;
  onSelectLoadoutIndex: (index: number) => void;
  statusEffects: StatusEffect[];
}

export default function RecommendedGearLoadout({
  recommendedGearLoadouts,
  selectedLoadoutIndex,
  onSelectLoadoutIndex,
  statusEffects,
}: RecommendedGearLoadoutProps) {
  const { accent } = useGradientAccent();
  const mobileTooltip = useMobileTooltip();

  const activeLoadout =
    recommendedGearLoadouts[selectedLoadoutIndex] ?? recommendedGearLoadouts[0];
  const recommendedGearDetails = activeLoadout?.details ?? [];

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
        <Text fw={600} size="sm">
          Recommended Gear
        </Text>
        {recommendedGearLoadouts.length > 1 && (
          <SegmentedControl
            size="sm"
            value={String(selectedLoadoutIndex)}
            onChange={(val) => onSelectLoadoutIndex(Number(val))}
            data={recommendedGearLoadouts.map((l, i) => ({
              label: l.loadout.label || `Build ${i + 1}`,
              value: String(i),
            }))}
          />
        )}
      </Group>
      {activeLoadout?.loadout.description && (
        <Text size="xs" c="dimmed">
          {activeLoadout.loadout.description}
        </Text>
      )}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
        {recommendedGearDetails.map((entry) => {
          const entryQuality = toQuality(entry.quality);
          const statsEntries = entry.stats
            ? Object.entries(entry.stats).filter(
                ([statName, statValue]) =>
                  Boolean(statName) &&
                  statValue !== null &&
                  statValue !== undefined,
              )
            : [];

          const tooltipLabel = (
            <Stack gap="xs">
              <Group gap="sm" align="center" wrap="nowrap">
                <SafeImage
                  src={entry.slotIcon}
                  alt={entry.label}
                  w={24}
                  h={24}
                  fit="contain"
                  style={{ flexShrink: 0, opacity: 0.85 }}
                />
                <Stack gap={2} style={{ minWidth: 0 }}>
                  <Text fw={700} size="sm" style={{ lineHeight: 1.25 }}>
                    {entry.name}
                  </Text>
                  {(entry.setDisplayName || entry.quality) && (
                    <Group gap={4} wrap="wrap">
                      {entry.setDisplayName && (
                        <Badge
                          variant="light"
                          color={accent.secondary}
                          size="xs"
                        >
                          {entry.setDisplayName} Set
                        </Badge>
                      )}
                      {entryQuality && (
                        <QualityIcon quality={entryQuality} size={16} />
                      )}
                    </Group>
                  )}
                </Stack>
              </Group>
              <Divider />
              {entry.setBonus &&
                entry.setBonus.quantity > 0 &&
                entry.setBonus.description && (
                  <Stack gap={2}>
                    <Badge
                      variant="light"
                      color={accent.primary}
                      size="xs"
                      w="fit-content"
                    >
                      Set Bonus: {entry.setBonus.quantity} Piece
                      {entry.setBonus.quantity > 1 ? 's' : ''}
                    </Badge>
                    <RichText
                      text={entry.setBonus.description}
                      statusEffects={statusEffects}
                      disablePopovers
                    />
                  </Stack>
                )}
              {statsEntries.length > 0 && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600}>
                    Stats
                  </Text>
                  <Group gap={6} wrap="wrap">
                    {statsEntries.map(([statName, statValue]) => (
                      <Badge
                        key={`${entry.slot}-${statName}`}
                        variant="light"
                        color={accent.tertiary}
                        size="xs"
                      >
                        {statName}: {String(statValue)}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              )}
              {entry.lore && (
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={600}>
                    Lore
                  </Text>
                  <RichText
                    text={entry.lore}
                    statusEffects={statusEffects}
                    disablePopovers
                  />
                </Stack>
              )}
            </Stack>
          );

          return (
            <Tooltip
              key={entry.slot}
              label={tooltipLabel}
              multiline
              maw={POPOVER_MAX_WIDTH}
              styles={RICH_TOOLTIP_STYLES}
              {...mobileTooltip}
            >
              {entry.setName ? (
                <Link
                  to={`/gear-sets/${entry.setName}`}
                  style={{
                    textDecoration: 'none',
                    width: '100%',
                    display: 'block',
                  }}
                >
                  <StaticSurface p="sm">
                    <Group gap="sm" wrap="nowrap">
                      <SafeImage
                        src={entry.icon}
                        alt={`${entry.label}: ${entry.name}`}
                        w={IMAGE_SIZE.CARD_ICON_SM}
                        h={IMAGE_SIZE.CARD_ICON_SM}
                        fit="contain"
                        loading="lazy"
                      />
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <GearTypeTag type={entry.type} size="xs" />
                        <Text size="sm" fw={600} truncate>
                          {entry.name}
                        </Text>
                        {entry.setDisplayName && (
                          <Text size="xs" c="dimmed" truncate>
                            {entry.setDisplayName} Set
                          </Text>
                        )}
                      </Stack>
                    </Group>
                  </StaticSurface>
                </Link>
              ) : (
                <StaticSurface p="sm" style={{ width: '100%' }}>
                  <Group gap="sm" wrap="nowrap">
                    <SafeImage
                      src={entry.icon}
                      alt={`${entry.label}: ${entry.name}`}
                      w={48}
                      h={48}
                      fit="contain"
                      loading="lazy"
                    />
                    <Stack gap={2} style={{ minWidth: 0 }}>
                      <GearTypeTag type={entry.type} size="xs" />
                      <Text size="sm" fw={600} truncate>
                        {entry.name}
                      </Text>
                      {entry.setDisplayName && (
                        <Text size="xs" c="dimmed" truncate>
                          {entry.setDisplayName} Set
                        </Text>
                      )}
                    </Stack>
                  </Group>
                </StaticSurface>
              )}
            </Tooltip>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
