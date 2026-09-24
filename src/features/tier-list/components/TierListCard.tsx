import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { type KeyboardEvent, type ReactNode } from 'react';
import { getNoblePhantasmIcon } from '@/assets';
import OverflowRow from '@/components/ui/OverflowRow';
import SafeImage from '@/components/ui/SafeImage';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import { TIER_ORDER } from '@/constants/tier-colors';
import type { Character } from '@/features/characters/types';
import TeamCharacterAvatars from '@/features/teams/components/TeamCharacterAvatars';
import { useCardPreviewLayout } from '@/features/community/use-card-preview-layout';
import AuthorLink from '@/features/community/AuthorLink';
import { getDisplayAuthor } from '@/features/community/display-author';
import {
  getTierEntrySlug,
  getTierListEntityType,
  isCharacterTierEntry,
  type TierEntry,
  type TierList,
} from '@/features/tier-list/types';
import { useGradientAccent } from '@/hooks';

const PREVIEW_COUNT = 6;

/** Entries ordered best-tier-first so the preview shows the top of the list. */
function getTopEntries(tierList: TierList): TierEntry[] {
  const order = tierList.tiers?.map((tier) => tier.name) ?? TIER_ORDER;
  const rank = (entry: TierEntry) => {
    const index = order.indexOf(entry.tier);
    return index === -1 ? order.length : index;
  };
  return [...tierList.entries].sort((a, b) => rank(a) - rank(b));
}

interface TierListCardProps {
  tierList: TierList;
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  onNavigate?: () => void;
  actions: ReactNode;
}

export default function TierListCard({
  tierList,
  charMap,
  characterByIdentity,
  onNavigate,
  actions,
}: TierListCardProps) {
  const { accent } = useGradientAccent();
  const preview = useCardPreviewLayout();
  const contentColor = getContentTypeColor(tierList.content_type, 'All');
  const displayAuthor = getDisplayAuthor(tierList);
  const entityType = getTierListEntityType(tierList);
  const topEntries = getTopEntries(tierList);
  const previewEntries = topEntries;

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
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <Text
            fw={700}
            size="md"
            className="dt-link-text"
            lineClamp={1}
            style={{ minWidth: 0, flex: '1 1 160px' }}
          >
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

        {previewEntries.length > 0 && (
          <Paper p="xs" radius="sm" bg="var(--mantine-color-default-hover)">
            <Group gap="xs" align="center" wrap="nowrap">
              <Badge
                size="xs"
                variant="light"
                color="gray"
                style={{
                  minWidth: 66,
                  justifyContent: 'center',
                  cursor: 'default',
                }}
              >
                Top {Math.min(previewEntries.length, PREVIEW_COUNT)}
              </Badge>
              {entityType === 'noble_phantasm' ? (
                <OverflowRow
                  items={previewEntries.map((entry) => {
                    const slug = getTierEntrySlug(entry);
                    return (
                      <SafeImage
                        key={slug}
                        src={getNoblePhantasmIcon(slug)}
                        alt={slug}
                        w={preview.subSize}
                        h={preview.subSize}
                        fit="contain"
                        radius="sm"
                        loading="lazy"
                        style={{ flexShrink: 0 }}
                      />
                    );
                  })}
                  size={preview.subSize}
                  gap={preview.gap}
                  maxVisible={PREVIEW_COUNT}
                />
              ) : (
                <TeamCharacterAvatars
                  refs={previewEntries
                    .filter(isCharacterTierEntry)
                    .map((entry) => ({
                      name: entry.character_slug,
                      quality: entry.character_quality,
                    }))}
                  preferredByName={charMap}
                  byIdentity={characterByIdentity}
                  size={preview.subSize}
                  wrap="nowrap"
                  gap={preview.gap}
                  maxVisible={PREVIEW_COUNT}
                />
              )}
            </Group>
          </Paper>
        )}
      </Stack>
    </Surface>
  );
}
