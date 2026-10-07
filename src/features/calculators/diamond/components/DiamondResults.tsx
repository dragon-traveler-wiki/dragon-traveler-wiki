import { SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { IoDiamond, IoTrendingDown, IoTrendingUp } from 'react-icons/io5';
import StatCard from '@/components/ui/StatCard';
import { StaticSurface } from '@/components/ui/Surface';

function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatSigned(value: number): string {
  const absoluteValue = formatNumber(Math.abs(value));
  if (value > 0) return `+${absoluteValue}`;
  if (value < 0) return `-${absoluteValue}`;
  return absoluteValue;
}

interface DiamondResultsProps {
  gainPerDay: number;
  spendPerDay: number;
  netPerDay: number;
  netPerWeek: number;
  netPerMonth: number;
  projectedBank: number;
  targetDateLabel: string;
  currentBank: number;
  daysUntilZero: number | null;
  runOutDate: string | null;
}

export default function DiamondResults({
  gainPerDay,
  spendPerDay,
  netPerDay,
  netPerWeek,
  netPerMonth,
  projectedBank,
  targetDateLabel,
  currentBank,
  daysUntilZero,
  runOutDate,
}: DiamondResultsProps) {
  return (
    <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
      <Stack gap="md">
        <Title order={2} size="h3">
          Results
        </Title>
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="sm">
          <StatCard
            icon={<IoTrendingUp size={16} />}
            title="Avg Gain / Day"
            value={formatNumber(gainPerDay)}
            color="teal"
          />
          <StatCard
            icon={<IoTrendingDown size={16} />}
            title="Avg Spend / Day"
            value={formatNumber(spendPerDay)}
            color="red"
          />
          <StatCard
            icon={<IoDiamond size={16} />}
            title="Net / Week"
            value={formatSigned(netPerWeek)}
            color={netPerWeek >= 0 ? 'green' : 'red'}
          />
          <StatCard
            icon={<IoDiamond size={16} />}
            title="Net / Month"
            value={formatSigned(netPerMonth)}
            color={netPerMonth >= 0 ? 'green' : 'red'}
          />
        </SimpleGrid>
        <Table withTableBorder>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>Net per day</Table.Td>
              <Table.Td>
                <Text fw={700} c={netPerDay >= 0 ? 'green.7' : 'red.7'}>
                  {formatSigned(netPerDay)}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Projection on {targetDateLabel}</Table.Td>
              <Table.Td>
                <Text fw={700} c={projectedBank >= 0 ? 'green.7' : 'red.7'}>
                  {formatNumber(projectedBank)}
                </Text>
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Runway status</Table.Td>
              <Table.Td>
                {netPerDay >= 0 ? (
                  <Text fw={700} c="green.7">
                    —
                  </Text>
                ) : currentBank <= 0 ? (
                  <Text fw={700} c="red.7">
                    Already empty
                  </Text>
                ) : (
                  <Stack gap={2}>
                    <Text fw={700} c="red.7">
                      Runs out in {formatNumber(daysUntilZero ?? 0)} days
                    </Text>
                    {runOutDate ? (
                      <Text size="sm" c="dimmed">
                        Approx. date: {runOutDate}
                      </Text>
                    ) : null}
                  </Stack>
                )}
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Stack>
    </StaticSurface>
  );
}
