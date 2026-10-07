import { Link } from 'react-router';
import { Group, SimpleGrid, Stack, Text } from '@mantine/core';
import ExpandableText from '@/components/ui/ExpandableText';
import RichText from '@/components/common/RichText';
import SafeImage from '@/components/ui/SafeImage';
import { getNoblePhantasmIcon } from '@/assets';
import { StaticSurface } from '@/components/ui/Surface';
import { IMAGE_SIZE } from '@/constants/ui';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import { getNoblePhantasmPreviewDescription } from '@/features/wiki/noble-phantasms/utils';
import type { StatusEffect } from '@/features/wiki/status-effects/types';

interface RecommendedNoblePhantasmsProps {
  linkedNoblePhantasms: NoblePhantasm[];
  statusEffects: StatusEffect[];
}

export default function RecommendedNoblePhantasms({
  linkedNoblePhantasms,
  statusEffects,
}: RecommendedNoblePhantasmsProps) {
  return (
    <Stack gap="sm">
      <Text fw={600} size="sm">
        Recommended Noble Phantasms
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
        {linkedNoblePhantasms.map((noblePhantasm) => {
          const npIcon = getNoblePhantasmIcon(noblePhantasm.slug);
          const previewDescription =
            getNoblePhantasmPreviewDescription(noblePhantasm);
          return (
            <Link
              key={noblePhantasm.slug}
              to={`/noble-phantasms/${noblePhantasm.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <StaticSurface p="sm">
                <Group gap="sm" wrap="nowrap">
                  {npIcon && (
                    <SafeImage
                      src={npIcon}
                      alt={noblePhantasm.name}
                      w={IMAGE_SIZE.CARD_ICON_SM}
                      h={IMAGE_SIZE.CARD_ICON_SM}
                      fit="contain"
                      loading="lazy"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={600} truncate>
                      {noblePhantasm.name}
                    </Text>
                    {previewDescription && (
                      <ExpandableText size="xs">
                        <RichText
                          text={previewDescription}
                          statusEffects={statusEffects}
                        />
                      </ExpandableText>
                    )}
                  </Stack>
                </Group>
              </StaticSurface>
            </Link>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
