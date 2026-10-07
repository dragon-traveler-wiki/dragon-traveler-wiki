import { Badge, Box, Divider, Group, Stack, Text, Title } from '@mantine/core';
import SafeImage from '@/components/ui/SafeImage';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import RichText from '@/components/common/RichText';
import { StaticSurface } from '@/components/ui/Surface';
import type { Character } from '@/features/characters/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { getDivinityIcon } from '@/assets';

interface CharacterPageSkillsSectionProps {
  character: Character;
  statusEffects: StatusEffect[];
  talentIcon: string | undefined;
  skillIcons: Map<string, string>;
  scrollToSkill: (skillName: string) => void;
  scrollToTalent: () => void;
}

export default function CharacterPageSkillsSection({
  character,
  statusEffects,
  talentIcon,
  skillIcons,
  scrollToSkill,
  scrollToTalent,
}: CharacterPageSkillsSectionProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();
  const skillIconSize = isMobile ? 40 : 60;
  const divinityIconSize = isMobile ? 44 : 60;
  const badgeSize = isMobile ? 'md' : 'lg';
  const talent = character.talent;
  const talentLevels = talent?.talent_levels ?? [];

  return (
    <>
      {/* Talent Section */}
      {talentLevels.length > 0 && (
        <CollapsibleSectionCard
          id="talent-section"
          color={accent.primary}
          header={
            <Stack gap={2}>
              <Title order={2} size="h3">
                Talent
              </Title>
              <Text size="sm" c="dimmed">
                Talent levels and progression effects for this character.
              </Text>
            </Stack>
          }
        >
          <Stack gap="md">
            <Group gap="md">
              {talentIcon && (
                <SafeImage
                  src={talentIcon}
                  alt={talent?.name ?? 'Talent'}
                  w={54}
                  h={74}
                  fit="contain"
                  loading="lazy"
                />
              )}
              <Title order={3} size="h4">
                {talent?.name ?? 'Talent'}
              </Title>
            </Group>

            <Stack gap="sm">
              {talentLevels.map((talentLevel, idx) => (
                <Box key={talentLevel.level}>
                  <Group gap="xs" mb="xs">
                    <Badge variant="filled" color={accent.primary}>
                      Level {talentLevel.level}
                    </Badge>
                  </Group>
                  <RichText
                    text={talentLevel.effect}
                    statusEffects={statusEffects}
                    skills={character.skills}
                    talent={character.talent ?? null}
                    onSkillClick={scrollToSkill}
                    onTalentClick={scrollToTalent}
                  />
                  {idx < talentLevels.length - 1 && <Divider mt="sm" />}
                </Box>
              ))}
            </Stack>
          </Stack>
        </CollapsibleSectionCard>
      )}

      {/* Skills Section */}
      {character.skills.length > 0 && (
        <CollapsibleSectionCard
          id="skills-section"
          color={accent.primary}
          header={
            <Stack gap={2}>
              <Title order={2} size="h3">
                Skills
              </Title>
              <Text size="sm" c="dimmed">
                Core skill descriptions, type tags, and cooldown information.
              </Text>
            </Stack>
          }
        >
          <Stack gap="md">
            {character.skills.map((skill) => {
              const typeKey = (skill.type ?? '')
                .replace(/ Skill$/i, '')
                .toLowerCase();
              const skillIcon = skillIcons.get(skill.type ?? typeKey);
              const isPassiveCooldown =
                skill.cooldown === 0 || skill.cooldown === '0';
              const cooldownLabel = isPassiveCooldown
                ? 'Passive'
                : `${skill.cooldown}s`;

              return (
                <StaticSurface
                  key={skill.name}
                  id={`skill-${skill.name}`}
                  p={{ base: 'sm', sm: 'md' }}
                >
                  <Stack gap="sm">
                    <Group gap="sm" wrap="nowrap">
                      {skillIcon && (
                        <SafeImage
                          src={skillIcon}
                          alt={skill.name}
                          w={skillIconSize}
                          h={skillIconSize}
                          fit="contain"
                          loading="lazy"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} size="lg" style={{ lineHeight: 1.3 }}>
                          {skill.name}
                        </Text>
                        <Group gap="xs" wrap="wrap">
                          {skill.type && (
                            <Badge
                              size={badgeSize}
                              variant="light"
                              color={accent.secondary}
                            >
                              {skill.type}
                            </Badge>
                          )}
                          <Badge
                            size={badgeSize}
                            variant={isPassiveCooldown ? 'light' : 'filled'}
                            color={isPassiveCooldown ? 'gray' : accent.primary}
                          >
                            {cooldownLabel}
                          </Badge>
                          {skill.cost != null && (
                            <Badge
                              size={badgeSize}
                              variant="light"
                              color={accent.secondary}
                            >
                              Cost {skill.cost}
                            </Badge>
                          )}
                        </Group>
                      </Stack>
                    </Group>
                    <RichText
                      text={skill.description}
                      statusEffects={statusEffects}
                      skills={character.skills}
                      talent={character.talent ?? null}
                      onSkillClick={scrollToSkill}
                      onTalentClick={scrollToTalent}
                    />
                  </Stack>
                </StaticSurface>
              );
            })}
          </Stack>
        </CollapsibleSectionCard>
      )}

      {/* Divinity Section */}
      {character.divinity && character.divinity.length > 0 && (
        <CollapsibleSectionCard
          id="divinity-section"
          color={accent.primary}
          header={
            <Stack gap={2}>
              <Title order={2} size="h3">
                Divinity
              </Title>
              <Text size="sm" c="dimmed">
                Divinity level upgrades and choices for this character.
              </Text>
            </Stack>
          }
        >
          <Stack gap="md">
            {character.divinity.map((divinityLevel, idx) => {
              const isLevel6 = divinityLevel.level === 6;
              return (
                <Box key={divinityLevel.level}>
                  <Group gap="xs" mb="xs">
                    <Badge variant="filled" color={accent.primary}>
                      Level {divinityLevel.level}
                    </Badge>
                  </Group>
                  <Stack gap="sm">
                    {divinityLevel.choices.map((choice) => (
                      <StaticSurface
                        key={choice.name}
                        p={{ base: 'sm', sm: 'md' }}
                      >
                        <Stack gap="sm">
                          <Group gap="sm" wrap="nowrap">
                            {choice.icon && (
                              <SafeImage
                                src={getDivinityIcon(choice.icon)}
                                alt={choice.name}
                                w={divinityIconSize}
                                h={divinityIconSize}
                                fit="contain"
                                loading="lazy"
                                style={{ flexShrink: 0 }}
                              />
                            )}
                            <Group
                              gap="xs"
                              align="center"
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <Text fw={600} size="lg">
                                {choice.name}
                              </Text>
                              {isLevel6 && (
                                <Badge
                                  size={badgeSize}
                                  variant="light"
                                  color={accent.secondary}
                                >
                                  Divine Skill
                                </Badge>
                              )}
                            </Group>
                          </Group>
                          <RichText
                            text={choice.description}
                            statusEffects={statusEffects}
                            skills={character.skills}
                            talent={character.talent ?? null}
                            onSkillClick={scrollToSkill}
                            onTalentClick={scrollToTalent}
                          />
                        </Stack>
                      </StaticSurface>
                    ))}
                  </Stack>
                  {idx < (character.divinity?.length ?? 0) - 1 && (
                    <Divider mt="md" />
                  )}
                </Box>
              );
            })}
          </Stack>
        </CollapsibleSectionCard>
      )}
    </>
  );
}
