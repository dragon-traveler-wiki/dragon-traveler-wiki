import TranslationNote from '@/components/common/TranslationNote';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { StaticSurface } from '@/components/ui/Surface';
import { getMinWidthStyle } from '@/constants/styles';
import { BREAKPOINTS, PAGE_WIDTH } from '@/constants/ui';
import {
  Code,
  Container,
  List,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

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

interface GuideColumn<Row> {
  key: keyof Row;
  label: string;
}

interface GuideTableProps<Row> {
  columns: GuideColumn<Row>[];
  rows: Row[];
  minWidth: number;
}

/** Table on wider screens; stacked label/value cards on phones. */
function GuideTable<Row extends Record<string, string>>({
  columns,
  rows,
  minWidth,
}: GuideTableProps<Row>) {
  const isWide = useMediaQuery(BREAKPOINTS.XS);
  const [primary, ...rest] = columns;

  if (!isWide) {
    return (
      <Stack gap="xs">
        {rows.map((row) => (
          <Paper key={row[primary.key]} withBorder p="sm" radius="sm">
            <Stack gap={6}>
              <Text fw={600}>{row[primary.key]}</Text>
              {rest.map((column) => (
                <div key={String(column.key)}>
                  <Text size="xs" c="dimmed">
                    {column.label}
                  </Text>
                  <Text size="sm">{row[column.key]}</Text>
                </div>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
      <Table striped highlightOnHover style={getMinWidthStyle(minWidth)}>
        <Table.Thead>
          <Table.Tr>
            {columns.map((column) => (
              <Table.Th key={String(column.key)}>{column.label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row[primary.key]}>
              <Table.Td>
                <Text fw={600}>{row[primary.key]}</Text>
              </Table.Td>
              {rest.map((column) => (
                <Table.Td key={String(column.key)}>{row[column.key]}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}

const TARGET_COLUMNS: GuideColumn<(typeof TARGET_ROWS)[number]>[] = [
  { key: 'target', label: 'Target' },
  { key: 'recommendation', label: 'When to Aim' },
  { key: 'cost', label: 'Diamond Cost' },
  { key: 'rewards', label: 'Notable Reward' },
];

const EFFICIENCY_COLUMNS: GuideColumn<(typeof EFFICIENCY_ROWS)[number]>[] = [
  { key: 'metric', label: 'Metric' },
  { key: 'value', label: 'Value' },
  { key: 'note', label: 'Interpretation' },
];

export default function ShovelEventGuide() {
  return (
    <Container size={PAGE_WIDTH.READING} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <ListPageHeader
          title="Shovel Event Guide"
          description="Practical strategy for weekly shovel events: spend timing, efficiency checks, and stop points."
        />

        <TranslationNote
          sourceHref="https://www.gamekee.com/lhlr/671116.html"
          sourceLabel="铲子活动"
        />

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Main Conclusion &amp; Schedule
            </Title>
            <List spacing="xs">
              <List.Item>
                Daily buy: 800-
                <ResourceBadge slug="diamond" /> pack (20 shovels).
              </List.Item>
              <List.Item>
                Hoard for days 1–4. Spend in bulk on day 5 onward.
              </List.Item>
              <List.Item>
                Reason: bulk digging improves bomb/rocket efficiency and makes
                your progress-efficiency calculation much more accurate.
              </List.Item>
              <List.Item>
                Floor objective: expose any tile in the far-right column as fast
                as possible to advance layers.
              </List.Item>
            </List>
          </Stack>
        </StaticSurface>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Event Targets
            </Title>
            <GuideTable
              columns={TARGET_COLUMNS}
              rows={TARGET_ROWS}
              minWidth={540}
            />
            <Text size="sm" c="dimmed">
              Priority is layer push, not stars. Stars carry over to next event;
              layers do not.
            </Text>
          </Stack>
        </StaticSurface>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Efficiency &amp; Investment Check
            </Title>
            <Text>
              Formula:{' '}
              <Code fz="sm" fw={600}>
                Efficiency Score = Floors Advanced ÷ Base Shovels Used
              </Code>
            </Text>
            <Text size="sm" c="dimmed">
              Base shovels = guaranteed task rewards + daily pack/free income
              only (364 total over 7 days).
            </Text>
            <GuideTable
              columns={EFFICIENCY_COLUMNS}
              rows={EFFICIENCY_ROWS}
              minWidth={500}
            />
          </Stack>
        </StaticSurface>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Pro Digging Tips
            </Title>
            <List type="ordered" spacing="xs">
              <List.Item>
                Trade up, never waste explosives: bombs/rockets are worth about
                2 shovels. Use them to clear yellow dirt (2-for-2) or to reveal
                multiple items at once.
              </List.Item>
              <List.Item>
                Stars are a distraction during push. Your only objective is
                far-right exposure for floor advancement.
              </List.Item>
              <List.Item>
                After Day 5 bulk digging, calculate your Efficiency Score before
                spending extra diamonds.
              </List.Item>
              <List.Item>
                If your score is near 3.0, prepare late expensive shovel buys.
                If 4.0+, you can often save thousands of diamonds.
              </List.Item>
            </List>
          </Stack>
        </StaticSurface>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Diamond Value Note
            </Title>
            <Text>
              If you have surplus diamonds (roughly 20,000–30,000), pushing to
              2,160 for weapon chests can be worth it because specific weapons
              are very rare elsewhere.
            </Text>
            <Text size="sm" c="dimmed">
              Use your own measured efficiency before committing extra packs.
            </Text>
          </Stack>
        </StaticSurface>
      </Stack>
    </Container>
  );
}
