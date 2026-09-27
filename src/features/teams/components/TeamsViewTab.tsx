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
import { Link, useNavigate } from 'react-router';
import { FACTION_WYRM_MAP } from '@/assets';
import AuthorLink from '@/features/community/AuthorLink';
import CommunityActions from '@/features/community/CommunityActions';
import FactionTag from '@/components/ui/FactionTag';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import CommunityLoadMore from '@/features/community/CommunityLoadMore';
import PaginationControl from '@/components/ui/PaginationControl';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { CURSOR_POINTER_STYLE, getMinWidthStyle } from '@/constants/styles';
import type { Character } from '@/features/characters/types';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import type { Team } from '@/features/teams/types';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import { useGradientAccent } from '@/hooks';
import TeamCard from '@/features/teams/components/TeamCard';
import TeamCharacterAvatars from '@/features/teams/components/TeamCharacterAvatars';

interface TeamsViewTabProps {
  paginatedTeams: Team[];
  filteredTeams: Team[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  viewMode: string;
  search: string;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (pageSize: number) => void;
  onRequestEdit: (team: Team) => void;
  hasMore: boolean;
  loadedCount: number;
  paginationTotal: number;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export default function TeamsViewTab({
  paginatedTeams,
  filteredTeams,
  charMap,
  characterByIdentity,
  viewMode,
  search,
  onClearFilters,
  onOpenFilters,
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onRequestEdit,
  hasMore,
  loadedCount,
  paginationTotal,
  loadingMore,
  onLoadMore,
}: TeamsViewTabProps) {
  const { accent } = useGradientAccent();
  const navigate = useNavigate();

  return (
    <>
      {filteredTeams.length === 0 && (
        <NoResultsSuggestions
          title={search ? 'No teams found' : 'No matching teams'}
          message={
            search
              ? 'No teams match your search.'
              : 'No teams match the current filters.'
          }
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      )}

      {viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {paginatedTeams.map((team) => (
            <TeamCard
              key={team.community?.id ?? team.name}
              team={team}
              charMap={charMap}
              characterByIdentity={characterByIdentity}
              to={getTeamRoutePath(team)}
              actions={
                team.community ? (
                  <CommunityActions
                    community={team.community}
                    onEdit={() => onRequestEdit(team)}
                    onDeleted={() => window.location.reload()}
                  />
                ) : null
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
          <Table striped highlightOnHover style={getMinWidthStyle(640)}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Members</Table.Th>
                <Table.Th>Faction</Table.Th>
                <Table.Th>Content Type</Table.Th>
                <Table.Th>Author</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedTeams.map((team) => {
                return (
                  <Table.Tr
                    key={team.community?.id ?? team.name}
                    style={CURSOR_POINTER_STYLE}
                    onClick={() => navigate(getTeamRoutePath(team))}
                  >
                    <Table.Td>
                      <Group gap="sm" wrap="nowrap">
                        <SafeImage
                          src={FACTION_WYRM_MAP[team.faction]}
                          alt={`${FACTION_SLUG_TO_NAME[team.faction]} Whelp`}
                          w={28}
                          h={28}
                          fit="contain"
                        />
                        <Text
                          component={Link}
                          to={getTeamRoutePath(team)}
                          size="sm"
                          fw={500}
                          className="dt-link-text"
                          style={{ textDecoration: 'none' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {team.name}
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
                              style={{
                                minWidth: 56,
                                justifyContent: 'center',
                              }}
                            >
                              Main
                            </Badge>
                            <TeamCharacterAvatars
                              refs={team.members.map((member) => ({
                                name: member.character_slug,
                                quality: member.character_quality,
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
                                  refs={team.bench!.map((entry) => ({
                                    name: getTeamBenchEntryName(entry),
                                    quality: getTeamBenchEntryQuality(entry),
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
                      <FactionTag faction={team.faction} size="sm" />
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        size="sm"
                        color={getContentTypeColor(team.content_type, 'All')}
                      >
                        {normalizeContentType(team.content_type, 'All')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <AuthorLink
                        author={team.community?.author}
                        fallback={team.author}
                        size="sm"
                        fw={400}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        {team.community && (
                          <CommunityActions
                            community={team.community}
                            onEdit={() => onRequestEdit(team)}
                            onDeleted={() => window.location.reload()}
                          />
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      <PaginationControl
        currentPage={page}
        totalPages={totalPages}
        onChange={onPageChange}
        totalItems={paginationTotal}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
      />

      <CommunityLoadMore
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        atLastPage={page * pageSize >= filteredTeams.length}
        loadedCount={loadedCount}
      />
    </>
  );
}
