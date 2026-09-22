import ChangeHistory from '@/components/common/ChangeHistory';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import CommunityActions from '@/features/community/CommunityActions';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import { CHARACTER_GRID_SPACING } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import { getCharacterIdentityKey } from '@/features/characters/utils/character-route';
import TierListContent from '@/features/tier-list/components/TierListContent';
import TierListEntityCard from '@/features/tier-list/components/TierListEntityCard';
import {
  getTierListEntityType,
  type TierListRankableEntity,
  type TierList as TierListType,
} from '@/features/tier-list/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import { useEntityTabParam } from '@/hooks';
import type { ChangesFile } from '@/types/changes';
import { useMemo } from 'react';
import {
  Badge,
  Group,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
} from '@mantine/core';

interface TierListViewTabProps {
  visibleTierLists: TierListType[];
  characters: Character[];
  noblePhantasms: NoblePhantasm[];
  resolveTierEntryEntity: (
    entry: TierListType['entries'][number],
  ) => TierListRankableEntity | undefined;
  viewMode: string;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  tierListChanges: ChangesFile;
  onRequestEdit: (tierList: TierListType) => void;
  onRequestExport: (name: string) => void;
  isExporting: string | null;
  exportRefCallback: (name: string, node: HTMLDivElement | null) => void;
  entityFilter: (entity: TierListRankableEntity) => boolean;
  hasEntityFilters: boolean;
}

export default function TierListViewTab({
  visibleTierLists,
  characters,
  noblePhantasms,
  resolveTierEntryEntity,
  viewMode,
  onClearFilters,
  onOpenFilters,
  tierListChanges,
  onRequestEdit,
  onRequestExport,
  isExporting,
  exportRefCallback,
  entityFilter,
  hasEntityFilters,
}: TierListViewTabProps) {
  const tabItems = useMemo(
    () =>
      visibleTierLists.map((tierList) => ({
        name: tierList.community?.id ?? tierList.name,
      })),
    [visibleTierLists],
  );
  const [activeTierListKey, handleSelectTierList] = useEntityTabParam(
    'list',
    tabItems,
  );

  if (visibleTierLists.length === 0) {
    return (
      <NoResultsSuggestions
        title="No tier lists found"
        message="No tier lists match the current filters."
        onReset={onClearFilters}
        onOpenFilters={onOpenFilters}
      />
    );
  }

  return (
    <Tabs value={activeTierListKey} onChange={handleSelectTierList}>
      <ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
        <Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
          {visibleTierLists.map((tierList) => (
            <Tabs.Tab
              key={tierList.community?.id ?? tierList.name}
              value={tierList.community?.id ?? tierList.name}
              style={{ minHeight: 40 }}
            >
              {tierList.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </ScrollArea>

      {visibleTierLists.map((tierList) => {
        const entityType = getTierListEntityType(tierList);
        const rankedKeys = new Set(
          tierList.entries.flatMap((entry) => {
            const entity = resolveTierEntryEntity(entry);
            return entity ? [entity.key] : [];
          }),
        );
        const availableEntities: TierListRankableEntity[] =
          entityType === 'noble_phantasm'
            ? noblePhantasms.map((noblePhantasm) => ({
                key: noblePhantasm.slug,
                entityType: 'noble_phantasm',
                noblePhantasm,
              }))
            : characters.map((character) => ({
                key: getCharacterIdentityKey(character),
                entityType: 'character',
                character,
              }));
        const unranked = availableEntities.filter(
          (entity) =>
            !rankedKeys.has(entity.key) &&
            (!hasEntityFilters || entityFilter(entity)),
        );
        const isOwned = Boolean(tierList.community?.viewerOwns);
        const headerActions = (
          <Group gap="xs">
            <EntityActionButtons
              onEdit={
                isOwned
                  ? undefined
                  : () =>
                      onRequestEdit({ ...tierList, community: undefined })
              }
              editLabel="Remix"
              onExport={() => onRequestExport(tierList.name)}
              isExporting={isExporting === tierList.name}
              size="compact-xs"
              variant="subtle"
            />
            {tierList.community && (
              <CommunityActions
                community={tierList.community}
                onEdit={() => onRequestEdit(tierList)}
                onDeleted={() => window.location.reload()}
              />
            )}
          </Group>
        );

        return (
          <Tabs.Panel
            key={tierList.community?.id ?? tierList.name}
            value={tierList.community?.id ?? tierList.name}
            pt="md"
          >
            <Stack gap="md">
              <TierListContent
                tierList={tierList}
                resolveTierEntryEntity={resolveTierEntryEntity}
                viewMode={viewMode}
                headerActions={headerActions}
                disableNameClamp={isExporting === tierList.name}
                exportRefCallback={(node) =>
                  exportRefCallback(tierList.name, node)
                }
                entityFilter={hasEntityFilters ? entityFilter : undefined}
              />

              {unranked.length > 0 && (
                <CollapsibleSectionCard
                  defaultExpanded
                  color="gray"
                  header={
                    <Badge variant="filled" color="gray" size="lg" radius="sm">
                      N/A ({unranked.length})
                    </Badge>
                  }
                >
                  {viewMode === 'grid' ? (
                    <SimpleGrid
                      cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                      spacing={CHARACTER_GRID_SPACING}
                    >
                      {unranked.map((entity) => (
                        <TierListEntityCard
                          key={entity.key}
                          entity={entity}
                          fallbackName={entity.key}
                        />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Table striped highlightOnHover>
                      <Table.Tbody>
                        {unranked.map((entity) => (
                          <Table.Tr key={entity.key}>
                            <Table.Td>
                              <TierListEntityCard
                                entity={entity}
                                fallbackName={entity.key}
                                size={40}
                              />
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </CollapsibleSectionCard>
              )}

              <ChangeHistory history={tierListChanges[tierList.name]} />
            </Stack>
          </Tabs.Panel>
        );
      })}
    </Tabs>
  );
}
