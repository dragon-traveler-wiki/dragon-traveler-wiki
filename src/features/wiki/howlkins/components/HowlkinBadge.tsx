import { getHowlkinIcon } from '@/assets';
import IconBadge from '@/components/ui/IconBadge';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR } from '@/constants/quality';
import HowlkinStats from '@/features/wiki/howlkins/components/HowlkinStats';
import type { Howlkin } from '@/features/wiki/howlkins/types';
import type { MantineSize } from '@mantine/core';
import { Group, Stack, Text } from '@mantine/core';
import SafeImage from '@/components/ui/SafeImage';

interface HowlkinBadgeProps {
  name: string;
  howlkin?: Howlkin;
  size?: MantineSize;
  /** Set false when rendered inside another interactive element, e.g. a link card. */
  interactive?: boolean;
}

export default function HowlkinBadge({
  name,
  howlkin,
  size = 'md',
  interactive = true,
}: HowlkinBadgeProps) {
  const iconSrc = howlkin
    ? getHowlkinIcon(howlkin.slug, howlkin.quality)
    : undefined;
  const color = howlkin ? QUALITY_COLOR[howlkin.quality] : 'gray';

  return (
    <IconBadge
      label={name}
      color={color}
      size={size}
      iconSrc={iconSrc ?? undefined}
      popoverContent={
        interactive && howlkin ? (
          <Stack gap="xs">
            <Group gap="xs" wrap="nowrap">
              {iconSrc && (
                <SafeImage
                  src={iconSrc}
                  alt={name}
                  w={32}
                  h={32}
                  fit="contain"
                  radius="sm"
                />
              )}
              <div>
                <Text size="sm" fw={700} lh={1.2}>
                  {name}
                </Text>
                <QualityIcon quality={howlkin.quality} size={16} />
              </div>
            </Group>

            {howlkin.passive_effects.length > 0 && (
              <Stack gap={2}>
                {howlkin.passive_effects.map((e, i) => (
                  <Text key={i} size="xs" c="dimmed">
                    {e}
                  </Text>
                ))}
              </Stack>
            )}

            <HowlkinStats stats={howlkin.basic_stats} size="xs" />
          </Stack>
        ) : undefined
      }
    />
  );
}
