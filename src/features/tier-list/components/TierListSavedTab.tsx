import { ScrollArea, Tabs } from '@mantine/core';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import NoSavedItemsState from '@/components/ui/NoSavedItemsState';
import { useEntityTabParam, useIsMobile } from '@/hooks';
import type { TierList as TierListType } from '@/features/tier-list/types';
import TierListContent from '@/features/tier-list/components/TierListContent';
import type { TierListRankableEntity } from '@/features/tier-list/types';

interface TierListSavedTabProps {
  savedTierLists: TierListType[];
  filteredSavedTierLists: TierListType[];
  resolveTierEntryEntity: (
    entry: TierListType['entries'][number],
  ) => TierListRankableEntity | undefined;
  viewMode: string;
  search: string;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onRequestEdit: (tierList: TierListType) => void;
  onRequestExport: (name: string) => void;
  isExporting: string | null;
  exportRefCallback: (name: string, node: HTMLDivElement | null) => void;
  onRequestDelete: (name: string) => void;
  onGoToBuilder: () => void;
  entityFilter: (entity: TierListRankableEntity) => boolean;
  hasEntityFilters: boolean;
}

export default function TierListSavedTab({
  savedTierLists,
  filteredSavedTierLists,
  resolveTierEntryEntity,
  viewMode,
  search,
  onClearFilters,
  onOpenFilters,
  onRequestEdit,
  onRequestExport,
  isExporting,
  exportRefCallback,
  onRequestDelete,
  onGoToBuilder,
  entityFilter,
  hasEntityFilters,
}: TierListSavedTabProps) {
  const isMobile = useIsMobile();
  const [activeValue, handleSelectTierList] = useEntityTabParam(
    'saved-list',
    filteredSavedTierLists,
  );

  if (savedTierLists.length === 0) {
    return (
      <NoSavedItemsState
        title="No saved tier lists yet"
        description={`Use the "Create Your Own" tab to build and save a tier list.`}
        actionLabel="Go to Builder"
        onAction={onGoToBuilder}
      />
    );
  }

  if (filteredSavedTierLists.length === 0) {
    return (
      <>
        <NoResultsSuggestions
          title={
            search
              ? 'No saved tier lists found'
              : 'No matching saved tier lists'
          }
          message={
            search
              ? 'No saved tier lists match your search.'
              : 'No saved tier lists match the current filters.'
          }
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      </>
    );
  }

  return (
    <>
      <Tabs value={activeValue} onChange={handleSelectTierList}>
        <ScrollArea type="auto" scrollbarSize={5} offsetScrollbars>
          <Tabs.List style={{ flexWrap: 'nowrap', minWidth: 'max-content' }}>
            {filteredSavedTierLists.map((tl) => (
              <Tabs.Tab key={tl.name} value={tl.name} style={{ minHeight: 40 }}>
                {tl.name || 'Untitled'}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea>

        {filteredSavedTierLists.map((tierList) => {
          const headerActions = (
            <EntityActionButtons
              onEdit={() => onRequestEdit(tierList)}
              onExport={() => onRequestExport(tierList.name)}
              isExporting={isExporting === tierList.name}
              onDelete={() => onRequestDelete(tierList.name)}
              size={isMobile ? 'xs' : 'compact-xs'}
              variant="light"
            />
          );

          return (
            <Tabs.Panel key={tierList.name} value={tierList.name} pt="md">
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
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </>
  );
}
