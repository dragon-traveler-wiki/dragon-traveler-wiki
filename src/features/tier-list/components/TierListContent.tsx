import LastUpdated from '@/components/common/LastUpdated';
import CharacterTag from '@/features/characters/components/CharacterTag';
import ClassTag from '@/components/ui/ClassTag';
import AuthorLink from '@/features/community/AuthorLink';
import { getDisplayAuthor } from '@/features/community/display-author';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { StaticSurface } from '@/components/ui/Surface';
import { useGradientAccent } from '@/hooks';
import { getTierColor, TIER_ORDER } from '@/constants/tier-colors';
import { CHARACTER_GRID_SPACING, IMAGE_SIZE } from '@/constants/ui';
import TierListEntityCard from '@/features/tier-list/components/TierListEntityCard';
import {
  getTierEntrySlug,
  getTierListEntityType,
  type TierListRankableEntity,
  type TierList as TierListType,
} from '@/features/tier-list/types';
import {
  Badge,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import type { ReactNode } from 'react';

interface TierListContentProps {
  tierList: TierListType;
  resolveTierEntryEntity: (
    entry: TierListType['entries'][number],
  ) => TierListRankableEntity | undefined;
  viewMode: string;
  /** Rendered under the tags; detail pages omit it and show actions by the breadcrumbs. */
  headerActions?: ReactNode;
  /** Upvote/report controls shown beside the byline on public detail pages. */
  bylineActions?: ReactNode;
  exportRefCallback?: (node: HTMLDivElement | null) => void;
  entityFilter?: (entity: TierListRankableEntity) => boolean;
  disableNameClamp?: boolean;
}

export default function TierListContent({
  tierList,
  resolveTierEntryEntity,
  viewMode,
  headerActions,
  bylineActions,
  exportRefCallback,
  entityFilter,
  disableNameClamp = false,
}: TierListContentProps) {
  const { accent } = useGradientAccent();
  const displayAuthor = getDisplayAuthor(tierList);
  const tierOrder = tierList.tiers?.map((tier) => tier.name) ?? TIER_ORDER;
  const definedTierSet = new Set(tierOrder);
  const extraTiers = [
    ...new Set(tierList.entries.map((entry) => entry.tier)),
  ].filter((tier) => !definedTierSet.has(tier));
  const filteredEntries = tierList.entries.filter((entry) => {
    if (!entityFilter) return true;
    const entity = resolveTierEntryEntity(entry);
    return entity ? entityFilter(entity) : false;
  });
  const byTier = [...tierOrder, ...extraTiers]
    .map((tier, tierIndex) => ({
      tier,
      tierIndex,
      note: tierList.tiers?.find((definition) => definition.name === tier)
        ?.note,
      entries: filteredEntries.filter((entry) => entry.tier === tier),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <Stack gap="md">
      <Stack gap={6}>
        <Group gap="sm" align="center" wrap="wrap">
          {displayAuthor && (
            <Text size="sm" c="dimmed">
              by{' '}
              <AuthorLink
                author={tierList.community?.author}
                fallback={tierList.author}
              />
            </Text>
          )}
          <LastUpdated timestamp={tierList.last_updated} />
          {bylineActions}
        </Group>
        <Group gap="sm" mt={4}>
          <Badge
            size="lg"
            variant="outline"
            color={getContentTypeColor(tierList.content_type, 'All')}
          >
            {normalizeContentType(tierList.content_type, 'All')}
          </Badge>
          <Badge size="lg" variant="outline" color={accent.primary}>
            {getTierListEntityType(tierList) === 'noble_phantasm'
              ? 'Noble Phantasms'
              : 'Characters'}
          </Badge>
        </Group>
        {headerActions && (
          <Group gap="xs" wrap="wrap" mt={4}>
            {headerActions}
          </Group>
        )}
      </Stack>

      {tierList.description && (
        <StaticSurface p="md">
          <Text size="sm" lh={1.6}>
            {tierList.description}
          </Text>
        </StaticSurface>
      )}

      <div ref={exportRefCallback}>
        <Stack gap="md">
          {byTier.map(({ tier, tierIndex, note, entries }) => (
            <CollapsibleSectionCard
              key={tier}
              defaultExpanded
              color={getTierColor(tier, tierIndex)}
              header={
                <Stack gap={4}>
                  <Badge
                    variant="filled"
                    color={getTierColor(tier, tierIndex)}
                    size="lg"
                    radius="sm"
                  >
                    {tier} Tier
                  </Badge>
                  {note?.trim() && (
                    <Text size="xs" c="dimmed">
                      {note}
                    </Text>
                  )}
                </Stack>
              }
            >
              {viewMode === 'grid' ? (
                <SimpleGrid
                  cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                  spacing={CHARACTER_GRID_SPACING}
                  data-export-cols-desktop="6"
                >
                  {entries.map((entry) => (
                    <TierListEntityCard
                      key={`${getTierEntrySlug(entry)}-${entry.tier}`}
                      entity={resolveTierEntryEntity(entry)}
                      fallbackName={getTierEntrySlug(entry)}
                      note={entry.note?.trim() || undefined}
                      clampName={!disableNameClamp}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                  <Table striped highlightOnHover style={{ minWidth: 560 }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Entity</Table.Th>
                        <Table.Th>Quality</Table.Th>
                        <Table.Th>Details</Table.Th>
                        <Table.Th>Note</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {entries.map((entry) => {
                        const entity = resolveTierEntryEntity(entry);
                        const quality =
                          entity?.character?.quality ??
                          entity?.noblePhantasm?.quality;
                        return (
                          <Table.Tr
                            key={`${getTierEntrySlug(entry)}-${entry.tier}`}
                          >
                            <Table.Td>
                              <TierListEntityCard
                                entity={entity}
                                fallbackName={getTierEntrySlug(entry)}
                                size={40}
                              />
                            </Table.Td>
                            <Table.Td>
                              {quality ? (
                                <QualityIcon
                                  quality={quality}
                                  size={IMAGE_SIZE.ICON_LG}
                                />
                              ) : (
                                <Text c="dimmed">—</Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              {entity?.character ? (
                                <Group gap={4} wrap="wrap">
                                  <ClassTag
                                    characterClass={
                                      entity.character.character_class
                                    }
                                    size="sm"
                                  />
                                  {entity.character.factions.map((faction) => (
                                    <FactionTag
                                      key={faction}
                                      faction={faction}
                                      size="xs"
                                    />
                                  ))}
                                </Group>
                              ) : entity?.noblePhantasm?.character_slug ? (
                                <CharacterTag
                                  slug={entity.noblePhantasm.character_slug}
                                  size="sm"
                                />
                              ) : (
                                <Text size="sm" c="dimmed">
                                  Generic
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{entry.note?.trim() || '—'}</Text>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              )}
            </CollapsibleSectionCard>
          ))}
        </Stack>
      </div>
    </Stack>
  );
}
