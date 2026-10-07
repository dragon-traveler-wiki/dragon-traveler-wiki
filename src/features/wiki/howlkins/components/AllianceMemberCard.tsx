import SafeImage from '@/components/ui/SafeImage';
import { getHowlkinIcon } from '@/assets';
import QualityIcon from '@/components/ui/QualityIcon';
import HowlkinStats from '@/features/wiki/howlkins/components/HowlkinStats';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import { QUALITY_COLOR } from '@/constants/quality';
import { StaticSurface } from '@/components/ui/Surface';
import { Group, Stack, Text } from '@mantine/core';

interface AllianceMemberCardProps {
  howlkin: Howlkin;
  isDark: boolean;
}

export default function AllianceMemberCard({
  howlkin,
  isDark,
}: AllianceMemberCardProps) {
  const iconSrc = getHowlkinIcon(howlkin.slug, howlkin.quality);
  const qualityColor = QUALITY_COLOR[howlkin.quality];
  return (
    <StaticSurface
      p="sm"
      style={{
        borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
      }}
    >
      <Stack gap="xs">
        <Group gap="sm" wrap="nowrap">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={howlkin.name}
              w={44}
              h={44}
              fit="contain"
              radius="sm"
            />
          )}
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="wrap">
              <Text fw={600} size="sm">
                {howlkin.name}
              </Text>
              <QualityIcon quality={howlkin.quality} size={14} />
            </Group>
            {(howlkin.passive_effects ?? []).map((e, i) => (
              <Text key={i} size="xs" c="dimmed">
                {e}
              </Text>
            ))}
          </Stack>
        </Group>
        <HowlkinStats stats={howlkin.basic_stats} />
      </Stack>
    </StaticSurface>
  );
}
