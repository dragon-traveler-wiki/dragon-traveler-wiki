import {
  ActionIcon,
  Alert,
  Button,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IoAdd,
  IoDiamond,
  IoInformationCircleOutline,
  IoTrashOutline,
  IoTrendingDown,
  IoTrendingUp,
} from 'react-icons/io5';
import { StaticSurface } from '@/components/ui/Surface';
import { BREAKPOINTS } from '@/constants/ui';
import { useIsMobile } from '@/hooks';
import type {
  DiamondSourceRow,
  DiamondSourceType,
} from '@/features/calculators/diamond/types';
import { parseNumberInput } from '@/utils';

interface DiamondSourceTableProps {
  type: DiamondSourceType;
  sources: DiamondSourceRow[];
  accentColor: string;
  onUpdate: (
    type: DiamondSourceType,
    id: string,
    updater: (source: DiamondSourceRow) => DiamondSourceRow,
  ) => void;
  onAdd: (type: DiamondSourceType) => void;
  onRemove: (type: DiamondSourceType, id: string) => void;
}

const COVERAGE_NOTES: Record<DiamondSourceType, string> = {
  gain: 'This calculator does not include every possible diamond income source by default. Common extras include Level 8 affection date, Luminary codex, Wyrmbone Ruins, Lifetime achievements, and World Tree Covenant. Add missing entries as custom sources.',
  spend:
    'This calculator does not include every possible diamond spend source by default. Common extras include Shovel event, Fate treasure hunt items, Aurora Crystal, and Auction House. Add missing entries as custom sources.',
};

export default function DiamondSourceTable({
  type,
  sources,
  accentColor,
  onUpdate,
  onAdd,
  onRemove,
}: DiamondSourceTableProps) {
  const isGain = type === 'gain';
  const label = isGain ? 'Gain' : 'Spend';
  const isWide = useMediaQuery(BREAKPOINTS.XS);
  const isMobile = useIsMobile();
  const customInputStyles = {
    input: { borderColor: 'var(--mantine-primary-color-6)' },
  };

  const getRowStyle = (source: DiamondSourceRow) => ({
    opacity: source.enabled ? 1 : 0.4,
    ...(source.isCustom
      ? { backgroundColor: 'var(--mantine-primary-color-light)' }
      : undefined),
  });

  const renderToggle = (source: DiamondSourceRow) => (
    <Switch
      size="xs"
      color={accentColor}
      checked={source.enabled}
      onChange={(event) => {
        const enabled = event.currentTarget.checked;
        onUpdate(type, source.id, (current) => ({ ...current, enabled }));
      }}
      aria-label={source.enabled ? 'Disable source' : 'Enable source'}
    />
  );

  const renderName = (source: DiamondSourceRow) =>
    source.isCustom ? (
      <TextInput
        value={source.label}
        onChange={(event) => {
          const labelValue = event.currentTarget.value;
          onUpdate(type, source.id, (current) => ({
            ...current,
            label: labelValue,
          }));
        }}
        placeholder="Source name"
        aria-label="Source name"
        size="xs"
        styles={customInputStyles}
      />
    ) : (
      source.label
    );

  const renderCadenceInput = (source: DiamondSourceRow) => (
    <NumberInput
      aria-label="Every (days)"
      leftSection={isWide ? undefined : <Text size="xs">every</Text>}
      leftSectionWidth={44}
      rightSection={isWide ? undefined : <Text size="xs">days</Text>}
      rightSectionWidth={40}
      value={source.cadenceDays ?? ''}
      onChange={(value) =>
        onUpdate(type, source.id, (current) => ({
          ...current,
          cadenceDays: parseNumberInput(value),
        }))
      }
      min={1}
      max={365}
      size="xs"
      placeholder={isWide ? 'days' : undefined}
      hideControls={isMobile}
      styles={source.isCustom ? customInputStyles : undefined}
    />
  );

  const renderAmountInput = (source: DiamondSourceRow) => (
    <NumberInput
      aria-label="Amount"
      leftSection={isWide ? undefined : <IoDiamond size={12} />}
      value={source.amount ?? ''}
      onChange={(value) =>
        onUpdate(type, source.id, (current) => ({
          ...current,
          amount: parseNumberInput(value),
        }))
      }
      min={0}
      max={999999999}
      size="xs"
      thousandSeparator=","
      hideControls={isMobile}
      styles={source.isCustom ? customInputStyles : undefined}
    />
  );

  const renderRemoveButton = (source: DiamondSourceRow) => (
    <ActionIcon
      color="red"
      variant="light"
      size={isWide ? 'md' : 'lg'}
      onClick={() => onRemove(type, source.id)}
      aria-label="Remove source"
    >
      <IoTrashOutline size={16} />
    </ActionIcon>
  );

  return (
    <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
      <Stack gap="md">
        <Title order={2} size="h3">
          <Group gap="xs">
            {isGain ? <IoTrendingUp /> : <IoTrendingDown />}
            {isGain ? 'Gains' : 'Spending'}
          </Group>
        </Title>
        <Alert
          variant="light"
          color={accentColor}
          title="Coverage Note"
          icon={<IoInformationCircleOutline />}
        >
          {COVERAGE_NOTES[type]}
        </Alert>
        {isWide ? (
          <ScrollArea>
            <Table striped highlightOnHover withTableBorder miw={480}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th w={48} />
                  <Table.Th>Source</Table.Th>
                  <Table.Th w={110}>Every (days)</Table.Th>
                  <Table.Th w={110}>Amount</Table.Th>
                  <Table.Th w={56}>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sources.map((source) => (
                  <Table.Tr key={source.id} style={getRowStyle(source)}>
                    <Table.Td w={48}>{renderToggle(source)}</Table.Td>
                    <Table.Td>{renderName(source)}</Table.Td>
                    <Table.Td>{renderCadenceInput(source)}</Table.Td>
                    <Table.Td>{renderAmountInput(source)}</Table.Td>
                    <Table.Td>{renderRemoveButton(source)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <Stack gap="xs">
            {sources.map((source) => (
              <Paper
                key={source.id}
                withBorder
                p="xs"
                radius="sm"
                style={getRowStyle(source)}
              >
                <Stack gap={6}>
                  <Group gap="xs" wrap="nowrap" align="center">
                    {renderToggle(source)}
                    <Text
                      component="div"
                      size="sm"
                      fw={500}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      {renderName(source)}
                    </Text>
                    {renderRemoveButton(source)}
                  </Group>
                  <Group gap="xs" wrap="nowrap" grow>
                    {renderCadenceInput(source)}
                    {renderAmountInput(source)}
                  </Group>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
        <Group justify="flex-end">
          <Button
            size="xs"
            color={accentColor}
            variant="light"
            leftSection={<IoAdd size={14} />}
            onClick={() => onAdd(type)}
          >
            Add {label} Source
          </Button>
        </Group>
      </Stack>
    </StaticSurface>
  );
}
