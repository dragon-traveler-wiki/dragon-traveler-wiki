import { StaticSurface } from '@/components/ui/Surface';
import { getMinWidthStyle } from '@/constants/styles';
import ResourceBadge from '@/components/ui/ResourceBadge';
import {
  Alert,
  Anchor,
  Badge,
  Container,
  Divider,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useGradientAccent } from '@/hooks';
import { IoInformationCircleOutline } from 'react-icons/io5';

const TARGET_ROWS = [
  {
    target: '1,050 layers',
    recommendation: 'F2P safe zone; recommended for almost all players',
    cost: '~5,600 Diamonds total',
    rewards: '2 Golden Slimes',
  },
  {
    target: '2,160 layers',
    recommendation: 'Whale/hoarder push if you have 20k–30k Diamonds saved',
    cost: 'Depends on efficiency + late top-ups',
    rewards: 'Selectable Monsters + Refinement Crystals + 2x Weapon Chests',
  },
];

const EFFICIENCY_ROWS = [
  {
    metric: 'Efficiency Score',
    value: 'Floors Advanced ÷ Base Shovels Used',
    note: 'Base shovels only; do not count extra shovels found on the map',
  },
  {
    metric: 'Guaranteed Base Shovels (7 days)',
    value: '210 (tasks) + 154 (daily pack + free) = 364',
    note: 'Use this fixed baseline after your Day 5 bulk dig to judge whether to push',
  },
  {
    metric: 'Score around 3.0',
    value:
      'Usually on track but 2,160 often needs expensive 120-Diamond shovel buys for final 3 days',
    note: 'Plan late top-ups and re-check score daily',
  },
  {
    metric: 'Score 4.0+',
    value: 'Very efficient routeing (often with maps/guides)',
    note: 'You can reach end milestones with far fewer expensive shovel buys',
  },
];

export default function ShovelEventGuide() {
  const { accent } = useGradientAccent();

  return (
    <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Stack gap={2}>
          <Title order={1}>Shovel Event Guide</Title>
          <Text size="sm" c="dimmed">
            Practical strategy for weekly shovel events: spend timing,
            efficiency checks, and stop points.
          </Text>
        </Stack>

        <Alert
          variant="light"
          color="yellow"
          title="Translation note"
          icon={<IoInformationCircleOutline />}
        >
          This section is translated and adapted from a Chinese community guide
          on GameKee:{' '}
          <Anchor
            href="https://www.gamekee.com/lhlr/671116.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            铲子活动
          </Anchor>
          . Source terms may contain typos or naming differences.
        </Alert>

        <StaticSurface p="lg">
          <Stack gap="sm">
            <Title order={2}>Main Conclusion &amp; Schedule</Title>
            <StaticSurface p="md">
              <Stack gap="xs">
                <Text>
                  • Daily buy: 800-
                  <ResourceBadge slug="diamond" /> pack (20 shovels).
                </Text>
                <Text>
                  • Hoard for days 1–4. Spend in bulk on day 5 onward.
                </Text>
                <Text>
                  • Reason: bulk digging improves bomb/rocket efficiency and
                  makes your progress-efficiency calculation much more accurate.
                </Text>
                <Text>
                  • Floor objective: expose any tile in the far-right column as
                  fast as possible to advance layers.
                </Text>
              </Stack>
            </StaticSurface>
          </Stack>
        </StaticSurface>

        <Divider />

        <StaticSurface p="lg">
          <Stack gap="sm">
            <Title order={2}>Event Targets</Title>
            <StaticSurface p="md">
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(540)}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Target</Table.Th>
                      <Table.Th>When to Aim</Table.Th>
                      <Table.Th>Diamond Cost</Table.Th>
                      <Table.Th>Notable Reward</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {TARGET_ROWS.map((row) => (
                      <Table.Tr key={row.target}>
                        <Table.Td>
                          <Text fw={600}>{row.target}</Text>
                        </Table.Td>
                        <Table.Td>{row.recommendation}</Table.Td>
                        <Table.Td>{row.cost}</Table.Td>
                        <Table.Td>{row.rewards}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </StaticSurface>
            <Text size="sm" c="dimmed">
              Priority is layer push, not stars. Stars carry over to next event;
              layers do not.
            </Text>
          </Stack>
        </StaticSurface>

        <Divider />

        <StaticSurface p="lg">
          <Stack gap="sm">
            <Title order={2}>Efficiency &amp; Investment Check</Title>
            <StaticSurface p="md">
              <Stack gap="xs">
                <Text>
                  Formula:{' '}
                  <Badge
                    variant="light"
                    color={accent.primary}
                    size="lg"
                    component="span"
                  >
                    Efficiency Score = Floors Advanced ÷ Base Shovels Used
                  </Badge>
                </Text>
                <Text size="sm" c="dimmed">
                  Base shovels = guaranteed task rewards + daily pack/free
                  income only (364 total over 7 days).
                </Text>
              </Stack>
            </StaticSurface>
            <StaticSurface p="md">
              <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
                <Table striped highlightOnHover style={getMinWidthStyle(500)}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Metric</Table.Th>
                      <Table.Th>Value</Table.Th>
                      <Table.Th>Interpretation</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {EFFICIENCY_ROWS.map((row) => (
                      <Table.Tr key={row.metric}>
                        <Table.Td>
                          <Text fw={600}>{row.metric}</Text>
                        </Table.Td>
                        <Table.Td>{row.value}</Table.Td>
                        <Table.Td>{row.note}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </StaticSurface>
          </Stack>
        </StaticSurface>

        <Divider />

        <StaticSurface p="lg">
          <Stack gap="sm">
            <Title order={2}>Pro Digging Tips</Title>
            <StaticSurface p="md">
              <Stack gap="xs">
                <Text>
                  1) Trade up, never waste explosives: bombs/rockets are worth
                  about 2 shovels. Use them to clear yellow dirt (2-for-2) or to
                  reveal multiple items at once.
                </Text>
                <Text>
                  2) Stars are a distraction during push. Your only objective is
                  far-right exposure for floor advancement.
                </Text>
                <Text>
                  3) After Day 5 bulk digging, calculate your Efficiency Score
                  before spending extra diamonds.
                </Text>
                <Text>
                  4) If your score is near 3.0, prepare late expensive shovel
                  buys. If 4.0+, you can often save thousands of diamonds.
                </Text>
              </Stack>
            </StaticSurface>
          </Stack>
        </StaticSurface>

        <Divider />

        <StaticSurface p="lg">
          <Stack gap="sm">
            <Title order={2}>Diamond Value Note</Title>
            <StaticSurface p="md">
              <Stack gap="xs">
                <Text>
                  If you have surplus diamonds (roughly 20,000–30,000), pushing
                  to 2,160 for weapon chests can be worth it because specific
                  weapons are very rare elsewhere.
                </Text>
                <Text size="sm" c="dimmed">
                  Use your own measured efficiency before committing extra
                  packs.
                </Text>
              </Stack>
            </StaticSurface>
          </Stack>
        </StaticSurface>
      </Stack>
    </Container>
  );
}
