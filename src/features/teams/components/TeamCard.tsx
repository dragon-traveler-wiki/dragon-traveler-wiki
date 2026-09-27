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
import type { ReactNode } from 'react';
import { FACTION_WYRM_MAP } from '@/assets';
import FactionTag from '@/components/ui/FactionTag';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import { FACTION_COLOR } from '@/constants/faction-colors';
import { useCardPreviewLayout } from '@/features/community/use-card-preview-layout';
import CardTitle from '@/features/community/CardTitle';
import AuthorLink from '@/features/community/AuthorLink';
import { getDisplayAuthor } from '@/features/community/display-author';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
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
  /** Makes the whole card a link to this path (title link stretched over the card). */
  to?: string;
  actions: ReactNode;
}

export default function TeamCard({
  team,
  charMap,
  characterByIdentity,
  to,
  actions,
}: TeamCardProps) {
  const { accent } = useGradientAccent();
  const preview = useCardPreviewLayout();

  const borderTopStyle = `3px solid var(--mantine-color-${FACTION_COLOR[team.faction] ?? accent.primary}-5)`;

  const displayAuthor = getDisplayAuthor(team);

  const Surface = to ? InteractiveSurface : StaticSurface;
  const surfaceProps = {
    className: to ? 'dt-link-card' : undefined,
    style: { borderTop: borderTopStyle },
  };

  return (
    <Surface component="div" p="md" {...surfaceProps}>
      <Stack gap="sm">
        {/* Header: whelp + name + actions */}
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xs">
          <Group
            gap="xs"
            wrap="nowrap"
            style={{ minWidth: 0, flex: '1 1 160px' }}
          >
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
            <CardTitle to={to}>{team.name || 'Untitled'}</CardTitle>
          </Group>
          <Group
            gap={4}
            wrap="nowrap"
            className="dt-link-card__above"
            style={{ flexShrink: 0 }}
          >
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
                <AuthorLink
                  author={team.community?.author}
                  fallback={team.author}
                />
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
            <Group gap="xs" align="center" wrap="nowrap">
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
                portraitClassName="dt-link-card__above"
                size={preview.size}
                layout="wrap"
                gap={preview.gap}
                wrap="nowrap"
                maxVisible={6}
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
                    portraitClassName="dt-link-card__above"
                    size={preview.subSize}
                    isSubstitute
                    layout="wrap"
                    gap={preview.gap}
                    wrap="nowrap"
                    maxVisible={6}
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
