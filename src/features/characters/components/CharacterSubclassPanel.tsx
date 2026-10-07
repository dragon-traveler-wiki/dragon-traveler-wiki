import { getSubclassIcon } from '@/assets';
import RichText from '@/components/common/RichText';
import ClassTag from '@/components/ui/ClassTag';
import SafeImage from '@/components/ui/SafeImage';
import { StaticSurface } from '@/components/ui/Surface';
import TierBadge from '@/components/ui/TierBadge';
import type { Character } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import type { Subclass } from '@/features/wiki/subclasses/types';
import { useMobileTooltip } from '@/hooks';
import {
  Center,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IMAGE_SIZE } from '@/constants/ui';

interface CharacterSubclassPanelProps {
  character: Character;
  subclassBySlug: Map<string, Subclass>;
  statusEffects: StatusEffect[];
}

export default function CharacterSubclassPanel({
  character,
  subclassBySlug,
  statusEffects,
}: CharacterSubclassPanelProps) {
  const tooltipProps = useMobileTooltip();

  if (character.subclasses.length === 0) {
    return null;
  }

  return (
    <StaticSurface p={{ base: 'sm', sm: 'md' }} radius="lg">
      <Stack gap="sm">
        <Title order={2} size="h4">
          Subclasses
        </Title>
        <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="xs">
          {character.subclasses.map((subclass) => {
            const subclassDetails = subclassBySlug.get(subclass);
            const subclassClass =
              subclassDetails?.class ?? character.character_class;
            const subclassIcon = getSubclassIcon(
              subclassDetails?.slug ?? subclass,
              subclassClass,
            );
            const subclassBonuses = subclassDetails?.bonuses ?? [];
            const tooltipLabel = (
              <Stack gap={6}>
                <Text size="xs" fw={700}>
                  {subclassDetails?.name ?? subclass}
                </Text>
                <Group gap={6} wrap="wrap">
                  {subclassDetails?.tier && (
                    <TierBadge
                      tier={String(subclassDetails.tier)}
                      showPrefix
                      size="xs"
                      index={subclassDetails.tier - 1}
                    />
                  )}
                  {subclassDetails?.class && (
                    <ClassTag
                      characterClass={subclassDetails.class}
                      size="xs"
                    />
                  )}
                </Group>
                {subclassDetails?.effect && (
                  <RichText
                    text={subclassDetails.effect}
                    statusEffects={statusEffects}
                    disablePopovers
                  />
                )}
                {subclassBonuses.length > 0 && (
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
                    Bonuses: {subclassBonuses.join(', ')}
                  </Text>
                )}
              </Stack>
            );

            return (
              <Tooltip
                key={subclass}
                label={tooltipLabel}
                multiline
                {...tooltipProps}
                maw={300}
              >
                <Paper p="xs" radius="sm" withBorder>
                  <Stack gap={6} align="center">
                    {subclassIcon && (
                      <Center>
                        <SafeImage
                          src={subclassIcon}
                          alt={subclass}
                          w={IMAGE_SIZE.CARD_ICON_SM}
                          h={IMAGE_SIZE.CARD_ICON_SM}
                          fit="contain"
                          loading="lazy"
                        />
                      </Center>
                    )}

                    <Group justify="center" align="center" wrap="wrap" gap={6}>
                      <Text size="xs" fw={600} ta="center">
                        {subclassDetails?.name ?? subclass}
                      </Text>
                      {subclassDetails?.tier && (
                        <TierBadge
                          tier={String(subclassDetails.tier)}
                          showPrefix
                          size="xs"
                          index={subclassDetails.tier - 1}
                        />
                      )}
                    </Group>
                  </Stack>
                </Paper>
              </Tooltip>
            );
          })}
        </SimpleGrid>
      </Stack>
    </StaticSurface>
  );
}
