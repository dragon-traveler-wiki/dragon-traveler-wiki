import { useMemo } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  Badge,
  Box,
  Collapse,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IoChevronDown } from 'react-icons/io5';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import RichText from '@/components/common/RichText';
import { getLoreGlassStyles } from '@/constants/glass';
import { IMAGE_SIZE, TRANSITION } from '@/constants/ui';
import { useDarkMode, useGradientAccent } from '@/hooks';
import type { Character } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';

interface CharacterLoreSectionProps {
  character: Character;
  statusEffects: StatusEffect[];
  scrollToSkill: (skillName: string) => void;
  scrollToTalent: () => void;
}

function QuoteCard({
  text,
  attribution,
  label,
}: {
  text: string;
  attribution: string;
  label?: string;
}) {
  const isDark = useDarkMode();
  const glassStyles = getLoreGlassStyles(isDark);

  return (
    <Stack gap={4}>
      {label && (
        <Text fw={600} size="sm">
          {label}
        </Text>
      )}
      <Paper p="md" radius="md" style={glassStyles}>
        <Stack gap="xs">
          <Text
            fs="italic"
            size="sm"
            c={isDark ? 'gray.3' : 'dark.4'}
            style={{ lineHeight: 1.7 }}
          >
            "{text}"
          </Text>
          <Text size="xs" c="dimmed" fw={500} ta="right">
            — {attribution}
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}

interface LoreBlockProps {
  lore: string | string[];
  showLabel: boolean;
  statusEffects: StatusEffect[];
  skills: Character['skills'];
  talent: Character['talent'] | null;
  onSkillClick: (skillName: string) => void;
  onTalentClick: () => void;
}

function LoreBlock({
  lore,
  showLabel,
  statusEffects,
  skills,
  talent,
  onSkillClick,
  onTalentClick,
}: LoreBlockProps) {
  const isDark = useDarkMode();
  const [expanded, { toggle }] = useDisclosure(false);

  const entries = useMemo(() => {
    if (Array.isArray(lore)) return lore;
    return lore
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [lore]);

  const firstEntry = entries[0] || '';
  const remaining = entries.slice(1);
  const hasMore = remaining.length > 0;

  const richTextProps = {
    statusEffects,
    skills,
    talent: talent ?? null,
    onSkillClick,
    onTalentClick,
    italic: true,
    lineHeight: 1.7,
  } as const;

  const glassStyles = getLoreGlassStyles(isDark);

  return (
    <Stack gap={4}>
      {showLabel && (
        <Text fw={600} size="sm">
          Lore
        </Text>
      )}
      <Paper p="md" radius="md" style={glassStyles}>
        <Stack gap="md">
          <Box style={{ position: 'relative' }}>
            <RichText text={firstEntry} {...richTextProps} />
            {hasMore && !expanded && (
              <Box
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 48,
                  background: `linear-gradient(to bottom, transparent, ${isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'})`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </Box>
          {hasMore && (
            <>
              <Collapse expanded={expanded}>
                <Stack gap="lg" pt="xs">
                  {remaining.map((entry, i) => (
                    <RichText key={i} text={entry} {...richTextProps} />
                  ))}
                </Stack>
              </Collapse>
              <UnstyledButton
                onClick={toggle}
                style={{ width: '100%' }}
                aria-expanded={expanded}
              >
                <Group gap="xs" wrap="nowrap">
                  <Box
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'var(--mantine-color-default-border)',
                      opacity: 0.5,
                    }}
                  />
                  <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <Text size="xs" fw={600} c="dimmed">
                      {expanded
                        ? 'Show less'
                        : `${remaining.length} more paragraph${remaining.length === 1 ? '' : 's'}`}
                    </Text>
                    <Box
                      aria-hidden="true"
                      style={{
                        display: 'inline-flex',
                        color: 'var(--mantine-color-dimmed)',
                        transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    >
                      <IoChevronDown size={IMAGE_SIZE.ICON_SM} />
                    </Box>
                  </Group>
                  <Box
                    style={{
                      flex: 1,
                      height: 1,
                      background: 'var(--mantine-color-default-border)',
                      opacity: 0.5,
                    }}
                  />
                </Group>
              </UnstyledButton>
            </>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function CharacterLoreSection({
  character,
  statusEffects,
  scrollToSkill,
  scrollToTalent,
}: CharacterLoreSectionProps) {
  const { accent } = useGradientAccent();

  if (!character.lore && !character.summary) return null;

  return (
    <CollapsibleSectionCard
      id="about-section"
      color={accent.primary}
      header={
        <Stack gap={2}>
          <Title order={2} size="h3">
            About
          </Title>
          <Text size="sm" c="dimmed">
            Character overview, lore, quote, origin, and noble phantasm details.
          </Text>
        </Stack>
      }
    >
      <Stack gap="md">
        {character.summary && (
          <Stack gap={4}>
            <Group gap="xs" align="center">
              <Text fw={600} size="sm">
                Overview
              </Text>
              <Badge variant="light" color="gray" size="xs">
                AI-generated
              </Badge>
            </Group>
            <RichText
              text={character.summary}
              statusEffects={statusEffects}
              skills={character.skills}
              talent={character.talent ?? null}
              onSkillClick={scrollToSkill}
              onTalentClick={scrollToTalent}
              lineHeight={1.7}
            />
          </Stack>
        )}

        {character.lore && (
          <LoreBlock
            lore={character.lore}
            showLabel={true}
            statusEffects={statusEffects}
            skills={character.skills}
            talent={character.talent ?? null}
            onSkillClick={scrollToSkill}
            onTalentClick={scrollToTalent}
          />
        )}

        {(character.ssr_quote || character.quote) && (
          <SimpleGrid
            cols={{
              base: 1,
              sm: character.ssr_quote && character.quote ? 2 : 1,
            }}
            spacing="md"
          >
            {character.ssr_quote && (
              <QuoteCard
                text={character.ssr_quote}
                attribution={character.name}
                label="Summon Quote"
              />
            )}
            {character.quote && (
              <QuoteCard
                text={character.quote}
                attribution={character.name}
                label="In-Game Quote"
              />
            )}
          </SimpleGrid>
        )}
      </Stack>
    </CollapsibleSectionCard>
  );
}
