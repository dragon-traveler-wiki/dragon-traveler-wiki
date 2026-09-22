import SafeImage from '@/components/ui/SafeImage';
import {
  Badge,
  Divider,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { type KeyboardEvent, type ReactNode } from 'react';
import { FACTION_WYRM_MAP } from '@/assets';
import FactionTag from '@/components/ui/FactionTag';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import { FACTION_COLOR } from '@/constants/faction-colors';
import { getDisplayAuthor } from '@/features/community/display-author';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { LINK_BLOCK_RESET_STYLE } from '@/constants/styles';
import { useGradientAccent } from '@/hooks';
import type { Character } from '@/features/characters/types';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import type { Team } from '@/features/teams/types';
import {
  getTeamBenchEntryName,
  getTeamBenchEntryQuality,
} from '@/features/teams/utils/team-bench';
import TeamCharacterAvatars from '@/features/teams/components/TeamCharacterAvatars';

interface TeamCardProps {
  team: Team;
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  onNavigate?: () => void;
  actions: ReactNode;
}

export default function TeamCard({
  team,
  charMap,
  characterByIdentity,
  onNavigate,
  actions,
}: TeamCardProps) {
  const { accent } = useGradientAccent();
  const isLargeTeamCardLayout = useMediaQuery('(min-width: 75em)');

  const borderTopStyle = `3px solid var(--mantine-color-${FACTION_COLOR[team.faction] ?? accent.primary}-5)`;

  const displayAuthor = getDisplayAuthor(team);

  const Surface = onNavigate ? InteractiveSurface : StaticSurface;
  const surfaceProps = onNavigate
    ? {
        style: {
          ...LINK_BLOCK_RESET_STYLE,
          borderTop: borderTopStyle,
        },
        onClick: onNavigate,
        role: 'link' as const,
        tabIndex: 0,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigate();
          }
        },
      }
    : {
        style: { borderTop: borderTopStyle },
      };

  return (
    <Surface component="div" p="md" {...surfaceProps}>
      <Stack gap="sm">
        {/* Header: whelp + name + actions */}
        <Group
          justify="space-between"
          align="flex-start"
          wrap="nowrap"
          gap="xs"
        >
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            {FACTION_WYRM_MAP[team.faction] && (
              <SafeImage
                src={FACTION_WYRM_MAP[team.faction]}
                alt={`${FACTION_SLUG_TO_NAME[team.faction]} Whelp`}
                w={32}
                h={32}
                fit="contain"
                style={{ flexShrink: 0 }}
              />
            )}
            <Text fw={700} size="md" className="dt-link-text" lineClamp={1}>
              {team.name || 'Untitled'}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            {actions}
          </Group>
        </Group>

        {/* Tags */}
        <Group gap="xs">
          {team.faction && <FactionTag faction={team.faction} size="sm" />}
          {team.content_type && (
            <Badge
              variant="light"
              size="sm"
              color={getContentTypeColor(team.content_type, 'All')}
            >
              {normalizeContentType(team.content_type, 'All')}
            </Badge>
          )}
        </Group>

        {/* Author + description */}
        {(displayAuthor || team.description) && (
          <Text size="xs" c="dimmed" lineClamp={1}>
            {displayAuthor && (
              <>
                by{' '}
                <Text span className="dt-link-text" fw={500} inherit>
                  {displayAuthor}
                </Text>
              </>
            )}
            {team.description && (
              <Text span inherit>
                {displayAuthor ? ' · ' : ''}
                {team.description}
              </Text>
            )}
          </Text>
        )}

        {/* Member portraits */}
        <Paper p="xs" radius="sm" bg="var(--mantine-color-default-hover)">
          <Stack gap="xs">
            <Group gap="xs" align="flex-start" wrap="nowrap">
              <Badge
                size="xs"
                variant="light"
                color={accent.primary}
                style={{
                  minWidth: 66,
                  justifyContent: 'center',
                }}
              >
                Main {team.members.length}
              </Badge>
              <TeamCharacterAvatars
                refs={team.members.map((member) => ({
                  name: member.character_slug,
                  quality: member.character_quality,
                }))}
                preferredByName={charMap}
                byIdentity={characterByIdentity}
                size={isLargeTeamCardLayout ? 64 : 56}
                layout="wrap"
                gap={isLargeTeamCardLayout ? 6 : 4}
                wrap={isLargeTeamCardLayout ? 'nowrap' : 'wrap'}
                maxVisible={isLargeTeamCardLayout ? 6 : 5}
              />
            </Group>
            {(team.bench?.length ?? 0) > 0 && (
              <>
                <Divider size="xs" />
                <Group gap="xs" align="flex-start" wrap="nowrap">
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
                        minWidth: 66,
                        justifyContent: 'center',
                        cursor: 'default',
                      }}
                    >
                      Subs {team.bench!.length}
                    </Badge>
                  </Tooltip>
                  <TeamCharacterAvatars
                    refs={team.bench!.map((entry) => ({
                      name: getTeamBenchEntryName(entry),
                      quality: getTeamBenchEntryQuality(entry),
                    }))}
                    preferredByName={charMap}
                    byIdentity={characterByIdentity}
                    size={isLargeTeamCardLayout ? 52 : 44}
                    isSubstitute
                    layout="wrap"
                    gap={isLargeTeamCardLayout ? 6 : 4}
                    wrap={isLargeTeamCardLayout ? 'nowrap' : 'wrap'}
                    maxVisible={isLargeTeamCardLayout ? 6 : 5}
                  />
                </Group>
              </>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Surface>
  );
}
