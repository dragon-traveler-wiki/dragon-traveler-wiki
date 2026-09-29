import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import JsonModal from '@/components/tools/JsonModal';
import SavedBuilderOverwriteModal from '@/components/common/SavedBuilderOverwriteModal';
import { getTierColor } from '@/constants/tier-colors';
import { STICKY_POOL_COLUMN_STYLE } from '@/constants/styles';
import FilterableCharacterPool from '@/components/common/FilterableCharacterPool';
import PoolLayoutToggle from '@/components/common/PoolLayoutToggle';
import FilterPopoverButton from '@/components/layout/FilterPopoverButton';
import type { Character } from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import {
  buildCharacterByIdentityMap,
  getCharacterIdentityKey,
} from '@/features/characters/utils/character-route';
import CharacterNoteButton from '@/components/common/CharacterNoteButton';
import { useTierListState } from '@/features/tier-list/hooks/use-tier-list-state';
import {
  hasSavedTierList,
  saveTierList,
} from '@/features/tier-list/saved-tier-lists';
import type { TierList, TierListEntityType } from '@/features/tier-list/types';
import PublishModal from '@/features/community/PublishModal';
import { getDisplayAuthor } from '@/features/community/display-author';
import NoblePhantasmFilter from '@/features/wiki/noble-phantasms/components/NoblePhantasmFilter';
import {
  EMPTY_NOBLE_PHANTASM_FILTERS,
  matchesNoblePhantasmFilters,
} from '@/features/wiki/noble-phantasms/filters';
import {
  countActiveFilters,
  useDarkMode,
  useGradientAccent,
  useIsMobile,
} from '@/hooks';
import type { PoolLayout } from '@/hooks';
import { useSavedBuilderItem } from '@/hooks/use-saved-builder-item';
import {
  downloadElementAsImage,
  DARK_BACKGROUND,
  LIGHT_BACKGROUND,
} from '@/utils/export-image';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Box, Flex, Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AddTierRow,
  DraggableTierEntityCard,
  TierDropZone,
  TierListMetaFields,
  UnrankedPool,
} from './BuilderElements';
import { TierListExportView } from './ExportView';
import TierListBuilderToolbar from './TierListBuilderToolbar';

interface TierListBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  noblePhantasms: NoblePhantasm[];
  initialData?: TierList | null;
  poolLayout: PoolLayout;
  onPoolLayoutChange: (layout: PoolLayout) => void;
  canUseSidePoolLayout: boolean;
}

export default function TierListBuilder({
  characters,
  charMap,
  noblePhantasms,
  initialData,
  poolLayout: layout,
  onPoolLayoutChange: setLayout,
  canUseSidePoolLayout: canUseSideLayout,
}: TierListBuilderProps) {
  const { accent } = useGradientAccent();
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [publishOpened, setPublishOpened] = useState(false);
  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const [noblePhantasmFilterOpen, { toggle: toggleNoblePhantasmFilter }] =
    useDisclosure(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [noblePhantasmFilters, setNoblePhantasmFilters] = useState(
    EMPTY_NOBLE_PHANTASM_FILTERS,
  );
  const [pendingEntityType, setPendingEntityType] =
    useState<TierListEntityType | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const actionButtonSize = isMobile ? 'md' : 'sm';
  const {
    activeId,
    getEntityFromKey,
    handleAddTier,
    handleCategoryChange,
    handleCharacterNoteChange,
    handleClear,
    handleDeleteTier,
    handleDescriptionCommit,
    handleEntityTypeChange,
    handleDragEnd,
    handleDragStart,
    handleMoveTierDown,
    handleMoveTierUp,
    handleNameCommit,
    handlePasteApply,
    handleSort,
    handleTierNoteChange,
    hasAnyBuilderData,
    hasAnyPlaced,
    json,
    meta,
    notes,
    placements,
    tierDefs,
    tierExportRows,
    tierListData,
    unrankedEntities,
  } = useTierListState({
    characters,
    charMap,
    noblePhantasms,
    initialData,
  });
  const {
    pendingOverwriteKey,
    requestSave,
    confirmOverwrite,
    cancelOverwrite,
  } = useSavedBuilderItem({
    item: { ...tierListData, community: initialData?.community },
    entityLabel: 'tier list',
    collectionLabel: 'My Saved Tier Lists',
    hasSavedItem: hasSavedTierList,
    saveItem: saveTierList,
    onSaved: () =>
      window.dispatchEvent(new CustomEvent('tier-list:saved-changed')),
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    }),
    // Basic keyboard drag support (no grid-aware coordinateGetter yet)
    useSensor(KeyboardSensor),
  );
  const characterBySlug = useMemo(
    () => buildCharacterByIdentityMap(characters),
    [characters],
  );
  const visibleUnrankedNoblePhantasms = useMemo(
    () =>
      unrankedEntities.filter(
        (entity) =>
          entity.noblePhantasm &&
          matchesNoblePhantasmFilters(
            entity.noblePhantasm,
            noblePhantasmFilters,
            characterBySlug,
          ),
      ),
    [characterBySlug, noblePhantasmFilters, unrankedEntities],
  );
  const noblePhantasmFilterCount = countActiveFilters(noblePhantasmFilters);

  useEffect(() => {
    if (!isCapturing) return;
    const el = exportRef.current;
    if (!el) {
      setIsCapturing(false);
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 150));
      try {
        await downloadElementAsImage(
          el,
          tierListData.name || 'tier-list',
          isDark,
        );
      } finally {
        setIsCapturing(false);
      }
    };
    run();
  }, [isCapturing, isDark, tierListData.name]);

  function requestEntityTypeChange(entityType: TierListEntityType) {
    if (!hasAnyBuilderData) {
      handleEntityTypeChange(entityType);
      return;
    }
    setPendingEntityType(entityType);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack gap="md">
          <TierListMetaFields
            name={meta.name}
            categoryName={meta.categoryName}
            description={meta.description}
            entityType={meta.entityType}
            onNameCommit={handleNameCommit}
            onCategoryChange={handleCategoryChange}
            onDescriptionCommit={handleDescriptionCommit}
            onEntityTypeChange={requestEntityTypeChange}
          />

          <TierListBuilderToolbar
            json={json}
            hasAnyPlaced={hasAnyPlaced}
            hasAnyBuilderData={hasAnyBuilderData}
            isCapturing={isCapturing}
            onPasteOpen={openPasteModal}
            onSave={requestSave}
            onSort={handleSort}
            onExport={() => setIsCapturing(true)}
            onSubmit={() => setPublishOpened(true)}
            onClear={openClearConfirm}
          />

          <Flex
            gap="md"
            align={layout === 'side' ? 'flex-start' : 'stretch'}
            direction={layout === 'side' ? 'row' : 'column'}
          >
            <Stack
              gap="md"
              style={
                layout === 'side' ? { flex: '3 3 0%', minWidth: 0 } : undefined
              }
            >
              {tierDefs.map((tierDef, index) => {
                const tier = tierDef.name;
                const names = placements[tier] || [];
                const color = getTierColor(tier, index);

                return (
                  <TierDropZone
                    key={tier}
                    id={`tier-${tier}`}
                    label={`${tier} Tier`}
                    color={color}
                    note={tierDef.note}
                    onNoteChange={(note) => handleTierNoteChange(tier, note)}
                    onDelete={() => handleDeleteTier(tier)}
                    onMoveUp={() => handleMoveTierUp(index)}
                    onMoveDown={() => handleMoveTierDown(index)}
                    isFirst={index === 0}
                    isLast={index === tierDefs.length - 1}
                    canDelete={tierDefs.length > 1}
                  >
                    {names.map((n) => {
                      const entity = getEntityFromKey(n);
                      return (
                        <Box
                          key={n}
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                          }}
                        >
                          <DraggableTierEntityCard
                            name={
                              entity?.character?.name ??
                              entity?.noblePhantasm?.name ??
                              n
                            }
                            entityKey={n}
                            entity={entity}
                            tier={tier}
                            size={isMobile ? 56 : undefined}
                          />
                          <CharacterNoteButton
                            value={notes[n] || ''}
                            onCommit={(value) =>
                              handleCharacterNoteChange(n, value)
                            }
                            style={{
                              position: 'absolute',
                              top: 2,
                              left: 'calc(50% + 24px)',
                              transform: 'translateX(-50%)',
                            }}
                          />
                        </Box>
                      );
                    })}
                  </TierDropZone>
                );
              })}

              <AddTierRow
                existingNames={tierDefs.map((t) => t.name)}
                onAdd={handleAddTier}
                accentColor={accent.primary}
                size={actionButtonSize}
                isMobile={isMobile}
              />
            </Stack>

            <Box
              style={
                layout === 'side'
                  ? { flex: '2 2 0%', minWidth: 0, ...STICKY_POOL_COLUMN_STYLE }
                  : undefined
              }
            >
              {meta.entityType === 'character' ? (
                <FilterableCharacterPool
                  characters={unrankedEntities.flatMap((entity) =>
                    entity.character ? [entity.character] : [],
                  )}
                  layout={layout}
                  onLayoutChange={setLayout}
                  canToggleLayout={canUseSideLayout}
                >
                  {(filtered, filterHeader, paginationControl, cols) => (
                    <UnrankedPool
                      filterHeader={filterHeader}
                      paginationControl={paginationControl}
                      cols={cols}
                    >
                      {filtered.map((c) => {
                        const key = getCharacterIdentityKey(c);
                        return (
                          <DraggableTierEntityCard
                            key={key}
                            name={c.name}
                            entityKey={key}
                            entity={getEntityFromKey(key)}
                            size={isMobile ? 56 : undefined}
                          />
                        );
                      })}
                    </UnrankedPool>
                  )}
                </FilterableCharacterPool>
              ) : (
                <UnrankedPool
                  emptyLabel="N/A Noble Phantasms"
                  filterHeader={
                    <Group justify="space-between" align="center" wrap="wrap">
                      <Text size="sm" c="dimmed">
                        {visibleUnrankedNoblePhantasms.length} available Noble
                        Phantasm
                        {visibleUnrankedNoblePhantasms.length !== 1 ? 's' : ''}
                      </Text>
                      <Group gap="xs" wrap="nowrap">
                        {canUseSideLayout && (
                          <PoolLayoutToggle
                            layout={layout}
                            onChange={setLayout}
                          />
                        )}
                        <FilterPopoverButton
                          filterCount={noblePhantasmFilterCount}
                          filterOpen={noblePhantasmFilterOpen}
                          onFilterToggle={toggleNoblePhantasmFilter}
                        >
                          <NoblePhantasmFilter
                            filters={noblePhantasmFilters}
                            onChange={setNoblePhantasmFilters}
                          />
                        </FilterPopoverButton>
                      </Group>
                    </Group>
                  }
                >
                  {visibleUnrankedNoblePhantasms.map((entity) => (
                    <DraggableTierEntityCard
                      key={entity.key}
                      name={entity.noblePhantasm?.name ?? entity.key}
                      entityKey={entity.key}
                      entity={entity}
                      size={isMobile ? 56 : undefined}
                    />
                  ))}
                </UnrankedPool>
              )}
            </Box>
          </Flex>
        </Stack>

        {typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {activeId
                  ? (() => {
                      const activeEntity = getEntityFromKey(activeId);
                      return (
                        <DraggableTierEntityCard
                          name={
                            activeEntity?.character?.name ??
                            activeEntity?.noblePhantasm?.name ??
                            activeId
                          }
                          entityKey={activeId}
                          entity={activeEntity}
                          overlay
                        />
                      );
                    })()
                  : null}
              </DragOverlay>,
              document.body,
            )
          : null}

        <JsonModal
          mode="paste"
          title="Paste Tier List JSON"
          description="Paste a tier list JSON object below to load it into the builder."
          placeholder={'{\n  "name": "...",\n  "entries": [...]\n}'}
          opened={pasteModalOpened}
          onClose={closePasteModal}
          onApply={handlePasteApply}
        />

        <ConfirmActionModal
          opened={clearConfirmOpened}
          onCancel={closeClearConfirm}
          title="Clear tier list builder?"
          message="This will remove all ranked entities, notes, custom tier changes, and metadata fields (name, category, and description) in the builder."
          confirmLabel="Clear All"
          confirmColor="red"
          onConfirm={() => {
            handleClear();
            closeClearConfirm();
          }}
        />

        <ConfirmActionModal
          opened={pendingEntityType !== null}
          onCancel={() => setPendingEntityType(null)}
          title="Change ranked entity type?"
          message="Changing between characters and Noble Phantasms clears the current placements, notes, tiers, and metadata."
          confirmLabel="Change Type"
          onConfirm={() => {
            if (pendingEntityType) handleEntityTypeChange(pendingEntityType);
            setPendingEntityType(null);
          }}
        />

        <SavedBuilderOverwriteModal
          entityLabel="tier list"
          pendingKey={pendingOverwriteKey}
          onCancel={cancelOverwrite}
          onConfirm={confirmOverwrite}
        />
      </DndContext>

      {isCapturing && (
        <Box
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <Box
            ref={exportRef}
            style={{
              width: 900,
              backgroundColor: isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
              padding: 16,
            }}
          >
            <TierListExportView
              tierListName={tierListData.name || 'My Tier List'}
              author={getDisplayAuthor({
                ...tierListData,
                community: initialData?.community,
              })}
              tierRows={tierExportRows}
            />
          </Box>
        </Box>
      )}
      <PublishModal
        opened={publishOpened}
        onClose={() => setPublishOpened(false)}
        kind="tier_list"
        payload={tierListData}
        publicationId={initialData?.community?.id}
        onPublished={() => window.location.assign('/tier-list')}
      />
    </>
  );
}
