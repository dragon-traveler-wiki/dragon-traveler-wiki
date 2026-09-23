import { Badge, Group, Stack, Text } from '@mantine/core';
import { type KeyboardEvent, type ReactNode } from 'react';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import AuthorLink from '@/features/community/AuthorLink';
import { getDisplayAuthor } from '@/features/community/display-author';
import {
  getTierListEntityType,
  type TierList,
} from '@/features/tier-list/types';
import { useGradientAccent } from '@/hooks';

interface TierListCardProps {
  tierList: TierList;
  onNavigate?: () => void;
  actions: ReactNode;
}

export default function TierListCard({
  tierList,
  onNavigate,
  actions,
}: TierListCardProps) {
  const { accent } = useGradientAccent();
  const contentColor = getContentTypeColor(tierList.content_type, 'All');
  const displayAuthor = getDisplayAuthor(tierList);
  const entityType = getTierListEntityType(tierList);

  const Surface = onNavigate ? InteractiveSurface : StaticSurface;
  const surfaceProps = onNavigate
    ? {
        style: {
          ...LINK_BLOCK_RESET_STYLE,
          borderTop: `3px solid var(--mantine-color-${contentColor}-5)`,
        },
        onClick: onNavigate,
        role: 'link' as const,
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate();
          }
        },
      }
    : {
        style: {
          borderTop: `3px solid var(--mantine-color-${contentColor}-5)`,
        },
      };

  return (
    <Surface component="div" p="md" {...surfaceProps}>
      <Stack gap="sm">
        <Group
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="xs"
        >
          <Text fw={700} size="md" className="dt-link-text" lineClamp={1}>
            {tierList.name || 'Untitled'}
          </Text>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            {actions}
          </Group>
        </Group>

        <Group gap="xs">
          <Badge variant="light" size="sm" color={contentColor}>
            {normalizeContentType(tierList.content_type, 'All')}
          </Badge>
          <Badge variant="outline" size="sm" color={accent.primary}>
            {entityType === 'noble_phantasm' ? 'Noble Phantasms' : 'Characters'}
          </Badge>
        </Group>

        {(displayAuthor || tierList.description) && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {displayAuthor && (
              <>
                by{' '}
                <AuthorLink
                  author={tierList.community?.author}
                  fallback={tierList.author}
                />
              </>
            )}
            {tierList.description && (
              <Text span inherit>
                {displayAuthor ? ' · ' : ''}
                {tierList.description}
              </Text>
            )}
          </Text>
        )}
      </Stack>
    </Surface>
  );
}
