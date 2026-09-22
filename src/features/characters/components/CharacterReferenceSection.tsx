import { Badge, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useMemo } from 'react';
import { useGradientAccent } from '@/hooks';
import { Link } from 'react-router';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import FactionTag from '@/components/ui/FactionTag';
import { normalizeContentType } from '@/constants/content-types';
import { StaticSurface } from '@/components/ui/Surface';
import type { Character } from '@/features/characters/types';
import type { FactionSlug } from '@/types/faction';
import type { Team, TeamMemberPosition } from '@/features/teams/types';
import { getTeamRoutePath } from '@/features/teams/utils/team-route';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryNote,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';

interface CharacterReferenceSectionProps {
  character: Character;
  teams: Team[];
  enableNameBasedReferences?: boolean;
  selectedTierListName: string | null;
  tierLabel: string | null;
  tierListCharacterNote: string | null;
}

interface TeamInclusion {
  teamName: string;
  teamPath: string;
  role: 'Main' | 'Bench';
  faction: FactionSlug;
  contentType: string;
  overdriveOrder: number | null;
  note: string | null;
  position: TeamMemberPosition | null;
}

const ROW_LABELS: Record<number, string> = {
  0: 'Front',
  1: 'Middle',
  2: 'Back',
};

const COL_LABELS: Record<number, string> = {
  0: 'Left',
  1: 'Center',
  2: 'Right',
};

function formatPosition(position: TeamMemberPosition | null): string | null {
  if (!position) return null;
  const row = ROW_LABELS[position.row] ?? `Row ${position.row + 1}`;
  const col = COL_LABELS[position.col] ?? `Col ${position.col + 1}`;
  return `${row} • ${col}`;
}

export default function CharacterReferenceSection({
  character,
  teams,
  enableNameBasedReferences = true,
  selectedTierListName,
  tierLabel,
  tierListCharacterNote,
}: CharacterReferenceSectionProps) {
  const { accent } = useGradientAccent();

  const teamInclusions = useMemo<TeamInclusion[]>(() => {
    if (!enableNameBasedReferences) {
      return [];
    }

    const results: TeamInclusion[] = [];

    for (const team of teams) {
      const member =
        team.members?.find(
          (entry) =>
            (entry.character_slug === character.slug ||
              entry.character_slug === character.legacy_slug) &&
            (!entry.character_quality ||
              entry.character_quality === character.quality),
        ) ?? null;

      if (member) {
        results.push({
          teamName: team.name,
          teamPath: getTeamRoutePath(team),
          role: 'Main',
          faction: team.faction,
          contentType: normalizeContentType(team.content_type, 'All'),
          overdriveOrder: member.overdrive_order,
          note: member.note?.trim() || null,
          position: member.position ?? null,
        });
      }

      const benchEntry =
        team.bench?.find((entry) => {
          const benchSlug = getTeamBenchEntryName(entry);
          const benchQuality = getTeamBenchEntryQuality(entry);
          return (
            (benchSlug === character.slug ||
              benchSlug === character.legacy_slug) &&
            (!benchQuality || benchQuality === character.quality)
          );
        }) ?? null;

      if (benchEntry) {
        const benchNote = getTeamBenchEntryNote(benchEntry) ?? null;
        results.push({
          teamName: team.name,
          teamPath: getTeamRoutePath(team),
          role: 'Bench',
          faction: team.faction,
          contentType: normalizeContentType(team.content_type, 'All'),
          overdriveOrder: null,
          note: benchNote?.trim() || null,
          position: null,
        });
      }
    }

    const roleOrder: Record<TeamInclusion['role'], number> = {
      Main: 0,
      Bench: 1,
    };

    return results.sort((a, b) => {
      if (a.role !== b.role) {
        return roleOrder[a.role] - roleOrder[b.role];
      }
      return a.teamName.localeCompare(b.teamName);
    });
  }, [character, enableNameBasedReferences, teams]);

  const hasTierContext =
    Boolean(selectedTierListName) &&
    Boolean(tierLabel) &&
    Boolean(tierListCharacterNote);
  const hasTeamContext = teamInclusions.length > 0;

  if (!hasTierContext && !hasTeamContext) {
    return null;
  }

  return (
    <CollapsibleSectionCard
      color={accent.primary}
      header={
        <Stack gap={2}>
          <Title order={2} size="h3">
            Character Usage
          </Title>
          <Text size="sm" c="dimmed">
            Quick reference from tier list notes and saved team examples.
          </Text>
        </Stack>
      }
    >
      <Stack gap="md">
        {hasTierContext && (
          <StaticSurface p="sm">
            <Stack gap={6}>
              <Group gap="xs" wrap="wrap">
                <Text fw={600} size="sm">
                  Tier List Note
                </Text>
                <Badge variant="light" color={accent.primary} size="sm">
                  {selectedTierListName}
                </Badge>
                {tierLabel && (
                  <Badge variant="light" color={accent.secondary} size="sm">
                    {tierLabel === 'N/A' ? tierLabel : `Tier ${tierLabel}`}
                  </Badge>
                )}
              </Group>
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                {tierListCharacterNote}
              </Text>
            </Stack>
          </StaticSurface>
        )}

        {hasTeamContext && (
          <Stack gap="sm">
            <Text fw={600} size="sm">
              Included in Teams ({teamInclusions.length})
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {teamInclusions.map((entry) => {
                const placement = formatPosition(entry.position);

                return (
                  <StaticSurface key={`${entry.teamName}-${entry.role}`} p="sm">
                    <Stack gap={6}>
                      <Group
                        justify="space-between"
                        align="flex-start"
                        gap="xs"
                      >
                        <Link
                          to={entry.teamPath}
                          style={{ textDecoration: 'none' }}
                        >
                          <Text fw={600} size="sm" className="dt-link-text">
                            {entry.teamName}
                          </Text>
                        </Link>
                        <Badge
                          variant="light"
                          color={
                            entry.role === 'Main'
                              ? accent.secondary
                              : accent.tertiary
                          }
                          size="xs"
                        >
                          {entry.role}
                        </Badge>
                      </Group>

                      <Group gap={6} wrap="wrap">
                        <FactionTag faction={entry.faction} size="xs" />
                        <Badge
                          variant="light"
                          color={accent.secondary}
                          size="xs"
                        >
                          {entry.contentType}
                        </Badge>
                      </Group>

                      {(placement || entry.overdriveOrder != null) && (
                        <Text size="xs" c="dimmed">
                          {placement ? `Position: ${placement}` : null}
                          {placement && entry.overdriveOrder != null
                            ? ' • '
                            : null}
                          {entry.overdriveOrder != null
                            ? `Overdrive: #${entry.overdriveOrder}`
                            : null}
                        </Text>
                      )}

                      {entry.note && (
                        <Text size="xs" c="dimmed" style={{ lineHeight: 1.5 }}>
                          {entry.note}
                        </Text>
                      )}
                    </Stack>
                  </StaticSurface>
                );
              })}
            </SimpleGrid>
          </Stack>
        )}
      </Stack>
    </CollapsibleSectionCard>
  );
}
