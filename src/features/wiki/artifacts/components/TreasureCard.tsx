import SafeImage from '@/components/ui/SafeImage';
import { getTreasureIcon } from '@/assets';
import ClassTag from '@/components/ui/ClassTag';
import RichText from '@/components/common/RichText';
import EffectTable from '@/features/wiki/artifacts/components/EffectTable';
import type { ArtifactTreasure } from '@/features/wiki/artifacts/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { StaticSurface } from '@/components/ui/Surface';
import { IMAGE_SIZE } from '@/constants/ui';
import { Group, Stack, Text } from '@mantine/core';
import ExpandableText from '@/components/ui/ExpandableText';
import { useIsMobile } from '@/hooks';

interface TreasureCardProps {
  id?: string;
  treasure: ArtifactTreasure;
  artifactSlug: string;
  isDark: boolean;
  qualityColor: string;
  statusEffects: StatusEffect[];
}

export default function TreasureCard({
  id,
  treasure,
  artifactSlug,
  isDark,
  qualityColor,
  statusEffects,
}: TreasureCardProps) {
  const isMobile = useIsMobile();
  const iconSrc = getTreasureIcon(artifactSlug, treasure.name);
  const iconSize = isMobile ? IMAGE_SIZE.CARD_ICON_SM : IMAGE_SIZE.CARD_ICON;
  const lore = (
    <RichText
      text={treasure.lore}
      statusEffects={statusEffects}
      italic
      lineHeight={1.6}
    />
  );
  return (
    <StaticSurface
      id={id}
      p={{ base: 'sm', sm: 'md' }}
      style={{
        borderTop: `3px solid var(--mantine-color-${qualityColor}-${isDark ? 7 : 5})`,
      }}
    >
      <Stack gap={isMobile ? 'sm' : 'md'}>
        <Group gap={isMobile ? 'sm' : 'md'} wrap="nowrap" align="flex-start">
          {iconSrc && (
            <SafeImage
              src={iconSrc}
              alt={treasure.name}
              w={iconSize}
              h={iconSize}
              fit="contain"
              radius="sm"
              style={{ flexShrink: 0 }}
              loading="lazy"
            />
          )}
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="lg">
              {treasure.name}
            </Text>
            <ClassTag characterClass={treasure.character_class} size="sm" />
          </Stack>
        </Group>
        {isMobile ? <ExpandableText>{lore}</ExpandableText> : lore}
        <EffectTable effects={treasure.effect} statusEffects={statusEffects} />
      </Stack>
    </StaticSurface>
  );
}
