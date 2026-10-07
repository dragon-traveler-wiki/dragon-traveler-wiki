import RichText from '@/components/common/RichText';
import { COMPACT_COL_STYLE } from '@/constants/styles';
import type { Skill, Talent } from '@/features/characters/types';
import type { NoblePhantasmSkill } from '@/features/wiki/noble-phantasms/types';
import {
  getNoblePhantasmTierDetail,
  getNoblePhantasmTierOrder,
} from '@/features/wiki/noble-phantasms/utils';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { Badge, Box, Table, Text } from '@mantine/core';

export default function SkillTable({
  skills,
  statusEffects,
  characterSkills,
  talent,
}: {
  skills: NoblePhantasmSkill[];
  statusEffects: StatusEffect[];
  characterSkills?: Skill[];
  talent?: Talent | null;
}) {
  const sortedSkills = [...skills].sort((a, b) => {
    const levelCmp = a.level - b.level;
    if (levelCmp !== 0) return levelCmp;
    return (
      getNoblePhantasmTierOrder(a.tier) - getNoblePhantasmTierOrder(b.tier)
    );
  });

  const hasTiers = sortedSkills.some((skill) => skill.tier);

  if (sortedSkills.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        No skill levels recorded.
      </Text>
    );
  }

  return (
    <Box style={{ overflowX: 'auto' }}>
      <Table striped withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={COMPACT_COL_STYLE}>Level</Table.Th>
            {hasTiers && <Table.Th style={COMPACT_COL_STYLE}>Tier</Table.Th>}
            <Table.Th>Description</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sortedSkills.map((skill, idx) => {
            const tierDetail = getNoblePhantasmTierDetail(skill.tier);
            return (
              <Table.Tr key={`${skill.level}-${skill.tier ?? 'none'}-${idx}`}>
                <Table.Td style={COMPACT_COL_STYLE}>
                  <Text size="sm" fw={600}>
                    {skill.level}
                  </Text>
                </Table.Td>
                {hasTiers && (
                  <Table.Td style={COMPACT_COL_STYLE}>
                    {skill.tier ? (
                      <Badge
                        size="sm"
                        variant="light"
                        color={tierDetail?.color ?? 'gray'}
                      >
                        {skill.tier}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        —
                      </Text>
                    )}
                  </Table.Td>
                )}
                <Table.Td>
                  <RichText
                    text={skill.description}
                    statusEffects={statusEffects}
                    skills={characterSkills}
                    talent={talent}
                  />
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
