import SafeImage from '@/components/ui/SafeImage';
import type { ReactNode } from 'react';
import { getArtifactIcon } from '@/assets';
import { FACTION_WYRM_MAP } from '@/assets';
import LastUpdated from '@/components/common/LastUpdated';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import RichText from '@/components/common/RichText';
import { FACTION_COLOR } from '@/constants/faction-colors';
import AuthorLink from '@/features/community/AuthorLink';
import { getDisplayAuthor } from '@/features/community/display-author';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import {
  GLASS_BORDER,
  GLASS_ICON_BG,
  getLoreGlassStyles,
} from '@/constants/glass';
import {
  DETAIL_HERO_WRAPPER_STYLES,
  getDetailHeroGradient,
  getHeroIconBoxStyles,
} from '@/constants/detail-styles';
import { InteractiveSurface, StaticSurface } from '@/components/ui/Surface';
import { IMAGE_SIZE } from '@/constants/ui';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import type { Team } from '@/features/teams/types';
import type { Artifact } from '@/features/wiki/artifacts/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useMobileTooltip, useGradientAccent } from '@/hooks';
import { FACTION_SLUG_TO_NAME } from '@/types/faction';
import type { Faction } from '@/types/faction';

import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IoCreate, IoTrash } from 'react-icons/io5';
import { Link } from 'react-router';

export function TeamHeroSection({
  team,
  factionInfo,
  artifactMap,
  statusEffects,
  isDark,
  tooltipProps,
  onRequestEdit,
  onRequestDelete,
  bylineActions,
  ownerActions,
}: {
  team: Team;
  factionInfo: Faction | null;
  artifactMap: Map<string, Artifact>;
  statusEffects: StatusEffect[];
  isDark: boolean;
  tooltipProps: ReturnType<typeof useMobileTooltip>;
  onRequestEdit: () => void;
  onRequestDelete?: () => void;
  /** Upvote/report controls shown beside the byline on public detail pages. */
  bylineActions?: ReactNode;
  /** Extra owner-only actions (e.g. delete) shown next to Edit. */
  ownerActions?: ReactNode;
}) {
  const { accent } = useGradientAccent();
  const factionColor = FACTION_COLOR[team.faction];
  const displayAuthor = getDisplayAuthor(team);

  return (
    <Box style={DETAIL_HERO_WRAPPER_STYLES}>
      <Box style={getDetailHeroGradient(isDark, factionColor)} />

      <Container
        size="lg"
        style={{ position: 'relative', zIndex: 1 }}
        py={{ base: 'lg', sm: 'xl' }}
      >
        <Stack gap="lg">
          <Group justify="space-between">
            <Breadcrumbs
              items={[{ label: 'Teams', path: '/teams' }, { label: team.name }]}
            />
            <Group gap="xs">
              <Button
                variant="light"
                color={accent.primary}
                leftSection={<IoCreate size={14} />}
                onClick={onRequestEdit}
              >
                {team.community && !team.community.viewerOwns
                  ? 'Remix Team'
                  : 'Edit Team'}
              </Button>
              {ownerActions}
              {onRequestDelete && (
                <Button
                  variant="light"
                  color="red"
                  leftSection={<IoTrash size={14} />}
                  onClick={onRequestDelete}
                >
                  Delete
                </Button>
              )}
            </Group>
          </Group>

          <Group gap="lg" align="flex-start" wrap="nowrap">
            <Box style={getHeroIconBoxStyles(isDark, factionColor, true)}>
              <SafeImage
                src={FACTION_WYRM_MAP[team.faction]}
                alt={`${FACTION_SLUG_TO_NAME[team.faction]} Whelp`}
                w={IMAGE_SIZE.CARD_ICON}
                h={IMAGE_SIZE.CARD_ICON}
                fit="contain"
              />
            </Box>

            <Stack gap={6} style={{ flex: 1 }}>
              <Title
                order={1}
                c={isDark ? 'white' : 'dark'}
                fz={{ base: '1.5rem', sm: '2.125rem' }}
                style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
              >
                {team.name}
              </Title>
              <Group gap="sm" align="center">
                {displayAuthor && (
                  <Text size="sm" c="dimmed">
                    by{' '}
                    <AuthorLink
                      author={team.community?.author}
                      fallback={team.author}
                    />
                  </Text>
                )}
                <LastUpdated timestamp={team.last_updated} />
                {bylineActions}
              </Group>
              <Group gap="sm" mt={4}>
                <FactionTag faction={team.faction} size="lg" />
                <Badge
                  size="lg"
                  variant="outline"
                  color={getContentTypeColor(team.content_type, 'All')}
                >
                  {normalizeContentType(team.content_type, 'All')}
                </Badge>
              </Group>
            </Stack>
          </Group>

          {team.description && (
            <StaticSurface p="md" style={getLoreGlassStyles(isDark)}>
              <Text size="sm" lh={1.6}>
                {team.description}
              </Text>
            </StaticSurface>
          )}

          {factionInfo && (
            <StaticSurface p="md" style={getLoreGlassStyles(isDark)}>
              <Stack gap="sm">
                <Title order={2} size="h3">
                  Faction Overview
                </Title>
                <RichText
                  text={factionInfo.description}
                  statusEffects={statusEffects}
                  lineHeight={1.6}
                />
                {factionInfo.recommended_artifacts.length > 0 && (
                  <Stack gap="xs" mt={4}>
                    <Text size="sm" fw={600}>
                      Recommended Artifacts
                    </Text>
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                      {factionInfo.recommended_artifacts.map((artifactSlug) => {
                        const artifact = artifactMap.get(artifactSlug);
                        const iconSrc = getArtifactIcon(artifactSlug);
                        return (
                          <Tooltip
                            key={artifactSlug}
                            label={artifact?.name}
                            {...tooltipProps}
                          >
                            <Link
                              to={`/artifacts/${artifactSlug}`}
                              style={{ textDecoration: 'none' }}
                            >
                              <InteractiveSurface component="div" p="sm">
                                <Group
                                  gap="sm"
                                  wrap="nowrap"
                                  align="flex-start"
                                >
                                  <Box
                                    style={{
                                      width: 64,
                                      height: 64,
                                      borderRadius: 'var(--mantine-radius-md)',
                                      background: isDark
                                        ? GLASS_ICON_BG.dark
                                        : GLASS_ICON_BG.light,
                                      border: isDark
                                        ? GLASS_BORDER.dark
                                        : GLASS_BORDER.light,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {iconSrc && (
                                      <SafeImage
                                        src={iconSrc}
                                        alt={artifact?.name}
                                        w={52}
                                        h={52}
                                        fit="contain"
                                        radius="sm"
                                        loading="lazy"
                                      />
                                    )}
                                  </Box>
                                  <Stack gap={4} style={{ minWidth: 0 }}>
                                    <Text size="sm" fw={600} lineClamp={1}>
                                      <Text
                                        span
                                        size="sm"
                                        fw={600}
                                        className="dt-link-text"
                                      >
                                        {artifact?.name}
                                      </Text>
                                    </Text>
                                    <Group gap={6} align="center">
                                      {artifact?.quality && (
                                        <QualityIcon
                                          quality={artifact.quality}
                                          size={IMAGE_SIZE.ICON_LG}
                                        />
                                      )}
                                      {artifact && (
                                        <Badge
                                          variant="light"
                                          size="xs"
                                          color={accent.secondary}
                                        >
                                          {artifact.rows}x{artifact.columns}
                                        </Badge>
                                      )}
                                    </Group>
                                    {artifact && (
                                      <Text size="xs" c="dimmed" lineClamp={1}>
                                        {artifact.lore || 'No lore available.'}
                                      </Text>
                                    )}
                                  </Stack>
                                </Group>
                                {!artifact && (
                                  <Text size="xs" c="dimmed" mt={4}>
                                    Artifact info unavailable
                                  </Text>
                                )}
                              </InteractiveSurface>
                            </Link>
                          </Tooltip>
                        );
                      })}
                    </SimpleGrid>
                  </Stack>
                )}
              </Stack>
            </StaticSurface>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
