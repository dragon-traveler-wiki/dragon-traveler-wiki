import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import SavedBuilderOverwriteModal from '@/components/common/SavedBuilderOverwriteModal';
import { STICKY_POOL_COLUMN_STYLE } from '@/constants/styles';
import CharacterCard from '@/features/characters/components/CharacterCard';
import FilterableCharacterPool from '@/components/common/FilterableCharacterPool';
import type { Character } from '@/features/characters/types';
import {
  getCharacterIdentityKey,
  getCharacterRoutePath,
} from '@/features/characters/utils/character-route';
import { BattlefieldGrid } from '@/features/teams/components/BattlefieldGrid';
import { BenchSection } from '@/features/teams/components/BenchSection';
import { useTeamBuilderState } from '@/features/teams/hooks/use-team-builder-state';
import { hasSavedTeam, saveTeam } from '@/features/teams/saved-teams';
import type { Team } from '@/features/teams/types';
import PublishModal from '@/features/community/PublishModal';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { useDarkMode, useIsMobile, useMobileTooltip } from '@/hooks';
import { useSavedBuilderItem } from '@/hooks/use-saved-builder-item';
import type { PoolLayout } from '@/hooks';
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
import { Box, Flex, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AvailablePool,
  BenchPool,
  DraggableCharCard,
  PasteJsonModal,
  SlotsGrid,
  TeamMetaFields,
  WyrmspellSelector,
} from './BuilderElements';
import TeamBuilderToolbar from './TeamBuilderToolbar';

interface TeamBuilderProps {
  characters: Character[];
  charMap: Map<string, Character>;
  initialData?: Team | null;
  wyrmspells?: Wyrmspell[];
  poolLayout: PoolLayout;
  onPoolLayoutChange: (layout: PoolLayout) => void;
  canUseSidePoolLayout: boolean;
}

/* ── Main TeamBuilder ── */

export default function TeamBuilder({
  characters,
  charMap,
  initialData,
  wyrmspells = [],
  poolLayout: layout,
  onPoolLayoutChange: setLayout,
  canUseSidePoolLayout: canUseSideLayout,
}: TeamBuilderProps) {
  const [pasteModalOpened, { open: openPasteModal, close: closePasteModal }] =
    useDisclosure(false);
  const [
    clearConfirmOpened,
    { open: openClearConfirm, close: closeClearConfirm },
  ] = useDisclosure(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [publishOpened, setPublishOpened] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const isDark = useDarkMode();
  const tooltipProps = useMobileTooltip();
  const isMobile = useIsMobile();

  const {
    activeId,
    availableCharacters,
    bench,
    benchNotes,
    characterByIdentity,
    factionColor,
    getCharacterFromKey,
    getCharacterPath,
    handleAddToNextSlot,
    handleBenchNoteChange,
    handleClear,
    handleContentTypeChange,
    handleDescriptionCommit,
    handleDragEnd,
    handleDragStart,
    handleFactionChange,
    handleNameCommit,
    handleOverdriveEnabledChange,
    handleOverdriveOrderChange,
    handlePasteApply,
    handleRemoveFromTeam,
    handleSlotNoteChange,
    handleWyrmspellChange,
    hasAnyBuilderData,
    json,
    meta,
    overdriveEnabled,
    overdriveOrderBySlot,
    slotNotes,
    slots,
    teamData,
    teamSize,
    teamWyrmspells,
  } = useTeamBuilderState({
    characters,
    charMap,
    initialData,
  });
  const {
    pendingOverwriteKey,
    requestSave,
    confirmOverwrite,
    cancelOverwrite,
  } = useSavedBuilderItem({
    item: { ...teamData, community: initialData?.community },
    entityLabel: 'team',
    collectionLabel: 'My Saved Teams',
    hasSavedItem: hasSavedTeam,
    saveItem: saveTeam,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    // Basic keyboard drag support (no grid-aware coordinateGetter yet)
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    if (!isCapturing) return;
    const el = exportRef.current;
    if (!el) return;

    const run = async () => {
      // Brief delay so portrait images (already cached) can paint
      await new Promise((r) => setTimeout(r, 150));
      try {
        await downloadElementAsImage(el, teamData.name || 'team', isDark);
      } finally {
        setIsCapturing(false);
      }
    };

    run();
  }, [isCapturing, isDark, teamData.name]);

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Stack gap="md">
          <TeamMetaFields
            name={meta.name}
            contentType={meta.contentType}
            faction={meta.faction}
            description={meta.description}
            onNameCommit={handleNameCommit}
            onContentTypeChange={handleContentTypeChange}
            onFactionChange={handleFactionChange}
            onDescriptionCommit={handleDescriptionCommit}
          />

          <TeamBuilderToolbar
            json={json}
            teamSize={teamSize}
            isCapturing={isCapturing}
            hasAnyBuilderData={hasAnyBuilderData}
            onPasteOpen={openPasteModal}
            onSave={requestSave}
            onExport={() => setIsCapturing(true)}
            onSubmit={() => setPublishOpened(true)}
            onClear={openClearConfirm}
          />

          <WyrmspellSelector
            wyrmspells={wyrmspells}
            teamWyrmspells={teamWyrmspells}
            onChange={handleWyrmspellChange}
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
              <SlotsGrid
                slots={slots}
                overdriveEnabled={overdriveEnabled}
                overdriveOrderBySlot={overdriveOrderBySlot}
                slotNotes={slotNotes}
                charMap={characterByIdentity}
                onOverdriveEnabledChange={handleOverdriveEnabledChange}
                onOverdriveOrderChange={handleOverdriveOrderChange}
                onRemove={handleRemoveFromTeam}
                onNoteChange={handleSlotNoteChange}
                activeId={activeId}
              />

              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Bench
                </Text>
                <BenchPool
                  bench={bench}
                  charMap={characterByIdentity}
                  benchNotes={benchNotes}
                  onBenchNoteChange={handleBenchNoteChange}
                />
              </Stack>
            </Stack>

            <Box
              style={
                layout === 'side'
                  ? { flex: '2 2 0%', minWidth: 0, ...STICKY_POOL_COLUMN_STYLE }
                  : undefined
              }
            >
              <FilterableCharacterPool
                characters={availableCharacters}
                layout={layout}
                onLayoutChange={setLayout}
                canToggleLayout={canUseSideLayout}
              >
                {(filtered, filterHeader, paginationControl, cols) => (
                  <AvailablePool
                    filterHeader={filterHeader}
                    paginationControl={paginationControl}
                    cols={cols}
                  >
                    {filtered.map((c) => (
                      <DraggableCharCard
                        key={getCharacterIdentityKey(c)}
                        name={c.name}
                        charKey={getCharacterIdentityKey(c)}
                        char={c}
                        size={isMobile ? 56 : undefined}
                        onClick={() =>
                          handleAddToNextSlot(getCharacterIdentityKey(c))
                        }
                      />
                    ))}
                  </AvailablePool>
                )}
              </FilterableCharacterPool>
            </Box>
          </Flex>
        </Stack>

        {typeof document !== 'undefined'
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {activeId
                  ? (() => {
                      const activeChar = getCharacterFromKey(activeId);
                      return (
                        <Box style={{ cursor: 'grabbing' }}>
                          <CharacterCard
                            name={activeChar?.name ?? activeId}
                            label={undefined}
                            quality={activeChar?.quality}
                            disableLink
                            routePath={
                              activeChar
                                ? getCharacterRoutePath(activeChar)
                                : undefined
                            }
                          />
                        </Box>
                      );
                    })()
                  : null}
              </DragOverlay>,
              document.body,
            )
          : null}

        <PasteJsonModal
          mode="paste"
          title="Paste Team JSON"
          description="Paste a team JSON object below to load it into the builder."
          placeholder={'{\n  "name": "...",\n  "members": [...]\n}'}
          opened={pasteModalOpened}
          onClose={closePasteModal}
          onApply={handlePasteApply}
        />

        <ConfirmActionModal
          opened={clearConfirmOpened}
          onCancel={closeClearConfirm}
          title="Clear team builder?"
          message="This will remove all team slots, bench entries, notes, overdrive order, selected wyrmspells, and metadata fields (name, content type, faction, and description) in the builder."
          confirmLabel="Clear All"
          confirmColor="red"
          onConfirm={() => {
            handleClear();
            closeClearConfirm();
          }}
        />

        <SavedBuilderOverwriteModal
          entityLabel="team"
          pendingKey={pendingOverwriteKey}
          onCancel={cancelOverwrite}
          onConfirm={confirmOverwrite}
        />
      </DndContext>

      {/* Temporary container rendered only during export — matches team page style */}
      {/* opacity:0 on the wrapper hides it visually; the ref is on the inner Box so
        getComputedStyle sees opacity:1 (opacity is not inherited in CSS) */}
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
            <Stack gap="md">
              <BattlefieldGrid
                members={teamData.members}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                getCharacterPath={getCharacterPath}
                factionColor={factionColor}
                isDark={isDark}
                tooltipProps={tooltipProps}
                disableNameClamp
                desktopMode
              />
              {teamData.bench && teamData.bench.length > 0 && (
                <BenchSection
                  bench={teamData.bench}
                  charMap={charMap}
                  characterByIdentity={characterByIdentity}
                  getCharacterPath={getCharacterPath}
                  factionColor={factionColor}
                  tooltipProps={tooltipProps}
                  disableNameClamp
                  desktopMode
                />
              )}
            </Stack>
          </Box>
        </Box>
      )}
      <PublishModal
        opened={publishOpened}
        onClose={() => setPublishOpened(false)}
        kind="team"
        payload={teamData}
        publicationId={initialData?.community?.id}
        onPublished={() => window.location.assign('/teams')}
      />
    </>
  );
}
