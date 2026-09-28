import {
  Badge,
  Collapse,
  Group,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IoChevronDown, IoChevronUp, IoStatsChart } from 'react-icons/io5';
import { StaticSurface } from '@/components/ui/Surface';
import { IMAGE_SIZE, TRANSITION } from '@/constants/ui';
import { STAR_TIER_BADGE_COLORS } from '@/features/calculators/star-upgrade/star-upgrade-model';
import type { StarLevel } from '@/features/wiki/star-levels/types';

export default function StarUpgradeReferenceTable({
  levels,
  currentIndex,
  targetIndex,
  validSelection,
  accentColor,
}: {
  levels: StarLevel[];
  currentIndex: number;
  targetIndex: number;
  validSelection: boolean;
  accentColor: string;
}) {
  const [opened, handlers] = useDisclosure(false);

  return (
    <StaticSurface p="lg">
      <Stack gap="sm">
        <UnstyledButton onClick={handlers.toggle}>
          <Group justify="space-between" align="center">
            <Stack gap={2}>
              <Title order={2} size="h3">
                <Group gap="xs">
                  <IoStatsChart />
                  Star Upgrade Reference Table
                </Group>
              </Title>
              <Text size="sm" c="dimmed">
                Cumulative values from 5 Star base.
              </Text>
            </Stack>
            {opened ? (
              <IoChevronUp size={IMAGE_SIZE.ICON_LG} />
            ) : (
              <IoChevronDown size={IMAGE_SIZE.ICON_LG} />
            )}
          </Group>
        </UnstyledButton>
        <Collapse
          expanded={opened}
          transitionDuration={parseInt(TRANSITION.NORMAL, 10)}
        >
          <Table.ScrollContainer minWidth={480}>
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Star Level</Table.Th>
                  <Table.Th ta="right">5 Star Copies</Table.Th>
                  <Table.Th ta="right">6 Star Fodder</Table.Th>
                  <Table.Th ta="right">Divine Crystals</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {levels.map((level, index) => {
                  const inRange =
                    validSelection &&
                    index > currentIndex &&
                    index <= targetIndex;
                  const isCurrent = index === currentIndex;
                  const isTarget = index === targetIndex;
                  const emphasized = isCurrent || isTarget || inRange;
                  return (
                    <Table.Tr key={level.value}>
                      <Table.Td>
                        <Group gap="xs" wrap="wrap">
                          <Badge
                            color={STAR_TIER_BADGE_COLORS[level.tier]}
                            variant={isTarget ? 'filled' : 'light'}
                          >
                            {level.label}
                          </Badge>
                          {isCurrent ? (
                            <Badge color="gray" variant="outline">
                              Current
                            </Badge>
                          ) : null}
                          {isTarget ? (
                            <Badge color="green" variant="outline">
                              Target
                            </Badge>
                          ) : null}
                          {inRange && !isTarget ? (
                            <Badge color={accentColor} variant="dot">
                              In path
                            </Badge>
                          ) : null}
                        </Group>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={emphasized ? 700 : 500}>{level.copies}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={emphasized ? 700 : 500}>{level.fodder}</Text>
                      </Table.Td>
                      <Table.Td ta="right">
                        <Text fw={emphasized ? 700 : 500}>
                          {level.divineCrystals > 0
                            ? level.divineCrystals
                            : '-'}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Collapse>
      </Stack>
    </StaticSurface>
  );
}
