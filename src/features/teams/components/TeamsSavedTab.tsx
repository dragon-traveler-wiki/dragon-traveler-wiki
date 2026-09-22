import SafeImage from '@/components/ui/SafeImage';
import {
  Badge,
  Divider,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Tooltip,
} from '@mantine/core';
import { useNavigate } from 'react-router';
import { FACTION_WYRM_MAP } from '@/assets';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import FactionTag from '@/components/ui/FactionTag';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import NoSavedItemsState from '@/components/ui/NoSavedItemsState';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { getMinWidthStyle } from '@/constants/styles';
import type { Character } from '@/features/characters/types';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import type { Team } from '@/features/teams/types';
import { toEntitySlug } from '@/utils/entity-slug';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import { useGradientAccent } from '@/hooks';
import TeamCard from '@/features/teams/components/TeamCard';
import TeamCharacterAvatars from '@/features/teams/components/TeamCharacterAvatars';

interface TeamsSavedTabProps {
  savedTeams: Team[];
  filteredSavedTeams: Team[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  viewMode: string;
  search: string;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onRequestEdit: (team: Team) => void;
  onRequestDelete: (name: string) => void;
  onGoToBuilder: () => void;
}

export default function TeamsSavedTab({
  savedTeams,
  filteredSavedTeams,
  charMap,
  characterByIdentity,
  viewMode,
  search,
  onClearFilters,
  onOpenFilters,
  onRequestEdit,
  onRequestDelete,
  onGoToBuilder,
}: TeamsSavedTabProps) {
  const { accent } = useGradientAccent();
  const navigate = useNavigate();

  if (savedTeams.length === 0) {
    return (
      <NoSavedItemsState
        title="No saved teams yet"
        description={`Use the "Create Your Own" tab to build and save a team.`}
        actionLabel="Go to Builder"
        onAction={onGoToBuilder}
      />
    );
  }

  const hasNoFilteredResults = filteredSavedTeams.length === 0;

  if (hasNoFilteredResults) {
    return (
      <NoResultsSuggestions
        title={search ? 'No saved teams found' : 'No matching saved teams'}
        message={
          search
            ? 'No saved teams match your search.'
            : 'No saved teams match the current filters.'
        }
        onReset={onClearFilters}
        onOpenFilters={onOpenFilters}
      />
    );
  }

  if (viewMode === 'grid') {
    return (
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {filteredSavedTeams.map((team) => (
          <TeamCard
            key={team.name}
            team={team}
            charMap={charMap}
            characterByIdentity={characterByIdentity}
            onNavigate={() =>
              navigate(`/teams/saved/${toEntitySlug(team.name)}`)
            }
            actions={
              <EntityActionButtons
                onEdit={() => onRequestEdit(team)}
                onDelete={() => onRequestDelete(team.name)}
                size="compact-xs"
                variant="subtle"
                stopPropagation
              />
            }
          />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
      <Table striped highlightOnHover style={getMinWidthStyle(640)}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Members</Table.Th>
            <Table.Th>Faction</Table.Th>
            <Table.Th>Content Type</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filteredSavedTeams.map((team) => (
            <Table.Tr key={team.name}>
              <Table.Td>
                <Group gap="sm" wrap="nowrap">
                  {FACTION_WYRM_MAP[team.faction] && (
                    <SafeImage
                      src={FACTION_WYRM_MAP[team.faction]}
                      alt={`${FACTION_SLUG_TO_NAME[team.faction]} Whelp`}
                      w={28}
                      h={28}
                      fit="contain"
                    />
                  )}
                  <Text size="sm" fw={500} className="dt-link-text">
                    {team.name || 'Untitled'}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Paper
                  p="xs"
                  radius="sm"
                  bg="var(--mantine-color-default-hover)"
                >
                  <Stack gap="xs">
                    <Group gap="xs" align="center" wrap="nowrap">
                      <Badge
                        size="xs"
                        variant="light"
                        color={accent.primary}
                        style={{ minWidth: 56, justifyContent: 'center' }}
                      >
                        Main
                      </Badge>
                      <TeamCharacterAvatars
                        refs={team.members.map((m) => ({
                          name: m.character_slug,
                          quality: m.character_quality,
                        }))}
                        preferredByName={charMap}
                        byIdentity={characterByIdentity}
                        size={32}
                        maxVisible={5}
                      />
                    </Group>
                    {(team.bench?.length ?? 0) > 0 && (
                      <>
                        <Divider size="xs" />
                        <Group gap="xs" align="center" wrap="nowrap">
                          <Tooltip
                            label="Substitutes — direct replacements for main team members"
                            withArrow
                            maw={200}
                            multiline
                          >
                            <Badge
                              size="xs"
                              variant="light"
                              color="gray"
                              style={{
                                minWidth: 56,
                                justifyContent: 'center',
                                cursor: 'default',
                              }}
                            >
                              Subs
                            </Badge>
                          </Tooltip>
                          <TeamCharacterAvatars
                            refs={team.bench!.map((e) => ({
                              name: getTeamBenchEntryName(e),
                              quality: getTeamBenchEntryQuality(e),
                            }))}
                            preferredByName={charMap}
                            byIdentity={characterByIdentity}
                            size={32}
                            isSubstitute
                            maxVisible={5}
                          />
                        </Group>
                      </>
                    )}
                  </Stack>
                </Paper>
              </Table.Td>
              <Table.Td>
                {team.faction && (
                  <FactionTag faction={team.faction} size="sm" />
                )}
              </Table.Td>
              <Table.Td>
                {team.content_type && (
                  <Badge
                    variant="light"
                    size="sm"
                    color={getContentTypeColor(team.content_type, 'All')}
                  >
                    {normalizeContentType(team.content_type, 'All')}
                  </Badge>
                )}
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <EntityActionButtons
                    onEdit={() => onRequestEdit(team)}
                    onDelete={() => onRequestDelete(team.name)}
                    size="compact-xs"
                    variant="subtle"
                  />
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
