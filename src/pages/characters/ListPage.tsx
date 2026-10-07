import {
  CharacterListLoading,
  ListPageHeader,
  ListPageShell,
} from '@/components';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import ExportButton from '@/components/tools/ExportButton';
import CharacterList from '@/features/characters/components/CharacterList';
import { CharacterOwnershipContext } from '@/contexts';
import CharacterOwnershipManager from '@/features/characters/components/CharacterOwnershipManager';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { useCharacterListData } from '@/features/characters/hooks/use-character-list-data';
import { useNewCharacters } from '@/features/characters/hooks/use-new-characters';
import { useUpdatedCharacters } from '@/features/characters/hooks/use-updated-characters';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import {
  ActionIcon,
  Button,
  Container,
  Group,
  Stack,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useMemo } from 'react';
import { IoPeople, IoPersonOutline } from 'react-icons/io5';
import { PAGE_WIDTH } from '@/constants/ui';

export default function Characters() {
  const { accent } = useGradientAccent();
  const { data: characters, loading, error, retry } = useCharacters();

  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(characters),
    [characters],
  );

  const listData = useCharacterListData(characters);
  const newCharacterKeys = useNewCharacters();
  const updatedCharacterKeys = useUpdatedCharacters(newCharacterKeys);
  const isMobile = useIsMobile();
  const { characterTrackingEnabled } = useContext(CharacterOwnershipContext);

  const [managerOpened, { open: openManager, close: closeManager }] =
    useDisclosure(false);

  return (
    <Container size={PAGE_WIDTH.WIDE} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Characters" timestamp={mostRecentUpdate}>
          <Group gap="xs">
            {characterTrackingEnabled &&
              (isMobile ? (
                <Tooltip label="My Characters">
                  <ActionIcon
                    variant="light"
                    color={accent.primary}
                    size="lg"
                    onClick={openManager}
                    aria-label="My Characters"
                  >
                    <IoPersonOutline size={16} />
                  </ActionIcon>
                </Tooltip>
              ) : (
                <Button
                  variant="light"
                  color={accent.primary}
                  size="xs"
                  leftSection={<IoPersonOutline size={16} />}
                  onClick={openManager}
                  aria-label="My Characters"
                >
                  My Characters
                </Button>
              ))}
            <ExportButton data={characters} filename="characters.json" />
            <DataCorrectionButton entityType="character" />
          </Group>
        </ListPageHeader>

        {characterTrackingEnabled && (
          <CharacterOwnershipManager
            characters={listData.filteredAndSorted}
            totalCharacters={characters.length}
            activeFilterCount={listData.activeFilterCount}
            opened={managerOpened}
            onClose={closeManager}
          />
        )}

        <ListPageShell
          loading={loading}
          error={error}
          onRetry={retry}
          errorTitle="Could not load characters"
          hasData={characters.length > 0}
          emptyMessage="No characters yet"
          emptyDescription="Character data will appear here once available."
          emptyIcon={<IoPeople size={32} />}
          loadingFallback={
            <CharacterListLoading viewMode={listData.viewMode} />
          }
        >
          <CharacterList
            data={listData}
            newCharacterKeys={newCharacterKeys}
            updatedCharacterKeys={updatedCharacterKeys}
          />
        </ListPageShell>
      </Stack>
    </Container>
  );
}
