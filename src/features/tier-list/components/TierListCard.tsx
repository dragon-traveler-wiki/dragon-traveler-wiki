import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { getNoblePhantasmIcon } from '@/assets';
import OverflowRow from '@/components/ui/OverflowRow';
import SafeImage from '@/components/ui/SafeImage';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { TIER_ORDER } from '@/constants/tier-colors';
import type { Character } from '@/features/characters/types';
import TeamCharacterAvatars from '@/features/teams/components/TeamCharacterAvatars';
import { useCardPreviewLayout } from '@/features/community/use-card-preview-layout';
import CardTitle from '@/features/community/CardTitle';
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
  /** Makes the whole card a link to this path (title link stretched over the card). */
  to?: string;
  actions: ReactNode;
}

export default function TierListCard({
  tierList,
  charMap,
  characterByIdentity,
  to,
  actions,
}: TierListCardProps) {
  const { accent } = useGradientAccent();
  const preview = useCardPreviewLayout();
  const contentColor = getContentTypeColor(tierList.content_type, 'All');
  const displayAuthor = getDisplayAuthor(tierList);
  const entityType = getTierListEntityType(tierList);
  const topEntries = getTopEntries(tierList);
  const previewEntries = topEntries;

  const Surface = to ? InteractiveSurface : StaticSurface;
  const surfaceProps = {
    className: to ? 'dt-link-card' : undefined,
    style: { borderTop: `3px solid var(--mantine-color-${contentColor}-5)` },
  };

  return (
    <Surface component="div" p="md" {...surfaceProps}>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <CardTitle to={to} style={{ minWidth: 0, flex: '1 1 160px' }}>
            {tierList.name || 'Untitled'}
          </CardTitle>
          <Group
            gap={4}
            wrap="nowrap"
            className="dt-link-card__above"
            style={{ flexShrink: 0 }}
          >
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
                  portraitClassName="dt-link-card__above"
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
