import { TIER_COLOR } from '@/constants/tier-colors';
import { normalizeContentType } from '@/constants/content-types';
import { TierListReferenceContext } from '@/contexts/tier-list-reference-context';
import CharacterCard from '@/features/characters/components/CharacterCard';
import { LoadingRegion } from '@/components/layout/PageLoadingSkeleton';
import {
  buildCharacterByIdentityMap,
  buildPreferredCharacterByNameMap,
  getCharacterRoutePath,
  resolveCharacterByNameAndQuality,
} from '@/features/characters/utils/character-route';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { isCharacterTierEntry } from '@/features/tier-list/types';
import styles from '@/features/home/styles/marquee.module.css';
import { Badge, Box, Group, Skeleton, Stack, Text } from '@mantine/core';
import { useContext } from 'react';

export default function FeaturedCharactersMarquee() {
  const { selectedTierList, resolving } = useContext(TierListReferenceContext);
  const { data: characters, loading: loadingChars } = useCharacters();

  // With no default and no chosen list the section is omitted, so only show the
  // skeleton while a reference may still turn up.
  const loading = resolving || (Boolean(selectedTierList) && loadingChars);

  if (loading) {
    return (
      <LoadingRegion label="Loading featured characters">
        <Box
          style={{
            overflowX: 'hidden',
            width: '100%',
            padding: '8px 0',
            maskImage:
              'linear-gradient(to right, transparent, black var(--dt-gradient-fade-edge-start), black var(--dt-gradient-fade-edge-end), transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black var(--dt-gradient-fade-edge-start), black var(--dt-gradient-fade-edge-end), transparent)',
          }}
        >
          <Group gap="md" wrap="nowrap" justify="center">
            {Array.from({ length: 8 }, (_, i) => (
              <Stack key={i} gap={4} align="center" style={{ flexShrink: 0 }}>
                <Skeleton height={64} circle />
                <Skeleton height={18} width={36} radius="sm" />
              </Stack>
            ))}
          </Group>
        </Box>
      </LoadingRegion>
    );
  }

  const tierList = selectedTierList;
  if (!tierList) return null;

  const charMap = buildPreferredCharacterByNameMap(characters);
  const characterByIdentity = buildCharacterByIdentityMap(characters);
  const topTierNames =
    tierList.tiers && tierList.tiers.length >= 2
      ? [tierList.tiers[0].name, tierList.tiers[1].name]
      : ['S+', 'S'];
  const topEntries = tierList.entries
    .filter(isCharacterTierEntry)
    .filter((entry) => topTierNames.includes(entry.tier));

  if (topEntries.length === 0) return null;

  const renderCharacters = (keyPrefix: string) =>
    topEntries.map((entry) => {
      const char = resolveCharacterByNameAndQuality(
        entry.character_slug,
        entry.character_quality,
        charMap,
        characterByIdentity,
      );
      const resolvedName = char?.name ?? entry.character_slug;
      return (
        <Stack
          key={`${keyPrefix}-${entry.character_slug}-${entry.tier}`}
          className={styles.featuredItem}
          gap={2}
          align="center"
          style={{ flexShrink: 0, width: 90 }}
        >
          <CharacterCard
            name={resolvedName}
            quality={char?.quality}
            size={64}
            routePath={
              char
                ? getCharacterRoutePath(char)
                : `/characters/${entry.character_slug}`
            }
          />
          <Badge size="xs" variant="light" color={TIER_COLOR[entry.tier]}>
            {entry.tier}
          </Badge>
        </Stack>
      );
    });

  const duration = Math.max(topEntries.length * 3, 12);

  const tierListMeta = [
    tierList.name,
    normalizeContentType(tierList.content_type, 'All'),
  ];

  return (
    <Stack gap="md">
      {(tierListMeta.length > 0 || tierList.author) && (
        <Text size="xs" c="dimmed">
          {tierListMeta.map((item, index) => (
            <Text key={item} span inherit>
              {index > 0 ? ' · ' : ''}
              {item}
            </Text>
          ))}
          {tierList.author && (
            <>
              {tierListMeta.length > 0 && (
                <Text span inherit>
                  {' '}
                  · by{' '}
                </Text>
              )}
              <Text span className="dt-link-text" fw={500} inherit>
                {tierList.author}
              </Text>
            </>
          )}
        </Text>
      )}
      <Box
        style={{
          overflowX: 'hidden',
          overflowY: 'clip',
          padding: '8px 0',
          width: '100%',
          contain: 'inline-size',
          maskImage:
            'linear-gradient(to right, transparent, black var(--dt-gradient-fade-edge-start), black var(--dt-gradient-fade-edge-end), transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black var(--dt-gradient-fade-edge-start), black var(--dt-gradient-fade-edge-end), transparent)',
        }}
      >
        <Group
          className={styles.marqueeTrack}
          gap="md"
          wrap="nowrap"
          style={{
            '--marquee-duration': `${duration}s`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.animationPlayState = 'running';
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.animationPlayState = 'paused';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.animationPlayState = 'running';
          }}
        >
          {renderCharacters('a')}
          {renderCharacters('b')}
        </Group>
      </Box>
    </Stack>
  );
}
