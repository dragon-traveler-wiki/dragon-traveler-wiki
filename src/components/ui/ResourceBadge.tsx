import { Group, Stack, Text } from '@mantine/core';
import SafeImage from './SafeImage';
import { useContext } from 'react';
import { getResourceIcon } from '@/assets';
import { WHITE_SPACE_PRE_LINE_STYLE } from '@/constants/styles';
import { IMAGE_SIZE, POPOVER_BADGE_WIDTH } from '@/constants/ui';
import { ResourcesContext } from '@/contexts';
import IconBadge from '@/components/ui/IconBadge';
import InlineMarkup from '@/components/ui/InlineMarkup';

function humanizeSlug(slug: string): string {
  return slug
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface ResourceBadgeProps {
  /** Resource slug (e.g. "dragonblood") — the canonical key in resources.json. */
  slug: string;
  /** Optional override for the displayed label text. */
  displayName?: string;
  /** Optional quantity — omitted when not applicable. */
  quantity?: number;
  /** Badge size passed to Mantine Badge. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function ResourceBadge({
  slug,
  displayName,
  quantity,
  size = 'sm',
}: ResourceBadgeProps) {
  const { resources } = useContext(ResourcesContext);

  const resource = resources.find((r) => r.slug === slug);

  const iconSrc = resource
    ? getResourceIcon(resource.slug, resource.category)
    : undefined;
  const iconSize = size === 'xs' ? IMAGE_SIZE.ICON_XS : IMAGE_SIZE.ICON_SM;
  const label = `${displayName ?? resource?.name ?? humanizeSlug(slug)}${quantity != null ? ` x${quantity.toLocaleString()}` : ''}`;

  return (
    <IconBadge
      label={label}
      color="yellow"
      size={size}
      iconSrc={iconSrc ?? undefined}
      iconSize={iconSize}
      component="span"
      popoverContent={
        resource ? (
          <Stack gap="xs" maw={POPOVER_BADGE_WIDTH}>
            <Group gap="xs" wrap="nowrap">
              {iconSrc && (
                <SafeImage
                  src={iconSrc}
                  alt={resource.name}
                  w={IMAGE_SIZE.ICON_LG}
                  h={IMAGE_SIZE.ICON_LG}
                />
              )}
              <Text fw={600} size="sm">
                {resource.name}
              </Text>
            </Group>
            <Text size="xs" style={WHITE_SPACE_PRE_LINE_STYLE} component="span">
              <InlineMarkup text={resource.description} />
            </Text>
          </Stack>
        ) : undefined
      }
    />
  );
}
