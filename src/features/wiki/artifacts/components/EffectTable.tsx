import RichText from '@/components/common/RichText';
import { COMPACT_COL_STYLE } from '@/constants/styles';
import type { ArtifactEffect } from '@/features/wiki/artifacts/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { Box, Table, Text } from '@mantine/core';
import { useIsMobile } from '@/hooks';

export default function EffectTable({
  effects,
  statusEffects,
}: {
  effects: ArtifactEffect[];
  statusEffects: StatusEffect[];
}) {
  const isMobile = useIsMobile();
  if (effects.length === 0) return null;
  return (
    <Box style={{ overflowX: 'auto' }}>
      <Table
        striped
        withTableBorder
        withColumnBorders
        verticalSpacing={isMobile ? 4 : 'xs'}
        horizontalSpacing={isMobile ? 'xs' : 'sm'}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={COMPACT_COL_STYLE}>Level</Table.Th>
            <Table.Th>Effect</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {effects.map((eff) => (
            <Table.Tr key={eff.level}>
              <Table.Td style={COMPACT_COL_STYLE}>
                <Text size="sm" fw={600}>
                  {eff.level}
                </Text>
              </Table.Td>
              <Table.Td>
                <RichText
                  text={eff.description}
                  statusEffects={statusEffects}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Box>
  );
}
