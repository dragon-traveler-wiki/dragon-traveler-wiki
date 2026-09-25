import { Badge, Box, Group, SimpleGrid, Stack, Title } from '@mantine/core';
import type { RefObject } from 'react';
import WyrmspellCard from '@/features/wiki/wyrmspells/components/WyrmspellCard';
import { useMobileTooltip } from '@/hooks';
import type { Character } from '@/features/characters/types';
import type { Team, TeamWyrmspells } from '@/features/teams/types';
import type { Wyrmspell } from '@/features/wiki/wyrmspells/types';
import { hasTeamWyrmspells } from '@/features/teams/utils/team-page';
import { BattlefieldGrid } from '@/features/teams/components/BattlefieldGrid';
import { BenchSection } from '@/features/teams/components/BenchSection';

interface TeamDetailContentProps {
  team: Team;
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  getCharacterPath: (
    characterName: string,
    characterQuality?: string | null,
  ) => string;
  factionColor: string;
  accentPrimary: string;
  isDark: boolean;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
  wyrmspells: Wyrmspell[];
  exportRef: RefObject<HTMLDivElement | null>;
  exporting: boolean;
}

function renderWyrmspellCard(
  spells: TeamWyrmspells,
  key: keyof TeamWyrmspells,
  label: string,
  allWyrmspells: Wyrmspell[],
) {
  const name = spells[key];
  if (!name) return null;
  return (
    <WyrmspellCard
      key={key}
      name={name}
      type={label}
      wyrmspells={allWyrmspells}
    />
  );
}

export default function TeamDetailContent({
  team,
  charMap,
  characterByIdentity,
  getCharacterPath,
  factionColor,
  accentPrimary,
  isDark,
  tooltipProps,
  wyrmspells,
  exportRef,
  exporting,
}: TeamDetailContentProps) {
  const hasWyrmspells = hasTeamWyrmspells(team);

  return (
    <Stack gap="xl">
      {hasWyrmspells && (
        <Stack gap="md">
          <Title order={2} size="h3">
            Wyrmspells
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {renderWyrmspellCard(
              team.wyrmspells || {},
              'breach',
              'Breach',
              wyrmspells,
            )}
            {renderWyrmspellCard(
              team.wyrmspells || {},
              'refuge',
              'Refuge',
              wyrmspells,
            )}
            {renderWyrmspellCard(
              team.wyrmspells || {},
              'wildcry',
              'Wildcry',
              wyrmspells,
            )}
            {renderWyrmspellCard(
              team.wyrmspells || {},
              'dragons_call',
              "Dragon's Call",
              wyrmspells,
            )}
          </SimpleGrid>
        </Stack>
      )}

      <Stack gap="md">
        <Group gap="sm" justify="space-between">
          <Group gap="sm">
            <Title order={2} size="h3">
              Team Composition
            </Title>
            <Badge variant="light" color={accentPrimary} size="sm">
              {team.members.length} members
            </Badge>
          </Group>
        </Group>
        <Box ref={exportRef} style={{ padding: 8 }}>
          <Stack gap="md">
            <BattlefieldGrid
              members={team.members}
              charMap={charMap}
              characterByIdentity={characterByIdentity}
              getCharacterPath={getCharacterPath}
              factionColor={factionColor}
              isDark={isDark}
              tooltipProps={tooltipProps}
              disableNameClamp={exporting}
              desktopMode={exporting}
            />

            {team.bench && team.bench.length > 0 && (
              <BenchSection
                bench={team.bench}
                charMap={charMap}
                characterByIdentity={characterByIdentity}
                getCharacterPath={getCharacterPath}
                factionColor={factionColor}
                tooltipProps={tooltipProps}
                disableNameClamp={exporting}
                desktopMode={exporting}
              />
            )}
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
