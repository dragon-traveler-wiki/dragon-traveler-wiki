import { StaticSurface } from '@/components/ui/Surface';
import { parseNumberInput } from '@/utils';
import {
  useGradientAccent,
  useNullableNumber,
  usePersistedState,
} from '@/hooks';
import { readStoredJson } from '@/utils/saved-storage';
import { isRecord } from '@/utils/type-guards';
import {
  Alert,
  Button,
  Container,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Title,
} from '@mantine/core';
import { DateInput, type DateValue } from '@mantine/dates';
import { useDeferredValue, useMemo, useState } from 'react';
import {
  IoCalendar,
  IoInformationCircleOutline,
  IoWallet,
} from 'react-icons/io5';
import DiamondSourceTable from '@/features/calculators/diamond/components/DiamondSourceTable';
import DiamondResults from '@/features/calculators/diamond/components/DiamondResults';
import type {
  DiamondCalculatorState as CalculatorState,
  DiamondSourceRow as SourceRow,
  DiamondSourceType as SourceType,
} from '@/features/calculators/diamond/types';
import {
  ARENA_OPTIONS,
  BASE_GAIN_SOURCES,
  BASE_SPEND_SOURCES,
  COLOSSEUM_OPTIONS,
  POINTS_LEAGUE_DAILY_BY_RANK,
  POINTS_LEAGUE_OPTIONS,
  SUPREME_MONTHLY_CARD,
  WILD_HUNT_OPTIONS,
} from '@/features/calculators/diamond/diamond-data';
import {
  buildDefaultRows,
  createCustomSource,
  dateToInputValue,
  dayDiffFromToday,
  getStartOfToday,
  getTodayIsoDate,
  isoDateToDate,
  normalizeIsoDate,
  sanitizeSourceRows,
  sortSourcesByCadenceThenLabel,
  sumSourcesPerDay,
} from '@/features/calculators/diamond/diamond-model';

const LOCAL_STORAGE_KEY = 'diamond-calculator:v1';

function readStoredCalculatorState(): Partial<CalculatorState> | null {
  return readStoredJson<Partial<CalculatorState> | null>(
    LOCAL_STORAGE_KEY,
    null,
    (value): value is Partial<CalculatorState> => isRecord(value),
  );
}

export default function DiamondCalculatorPage() {
  const { accent } = useGradientAccent();
  const minDate = useMemo(() => getStartOfToday(), []);
  const storedState = useMemo(() => readStoredCalculatorState(), []);

  const [bank, safeBank, setBank] = useNullableNumber(
    typeof storedState?.bank === 'number' && Number.isFinite(storedState.bank)
      ? storedState.bank
      : 0,
  );
  const [targetDate, setTargetDate] = useState<string>(() => getTodayIsoDate());
  const [gainSources, setGainSources] = useState<SourceRow[]>(
    sanitizeSourceRows(
      storedState?.gainSources,
      buildDefaultRows(BASE_GAIN_SOURCES),
    ),
  );
  const [spendSources, setSpendSources] = useState<SourceRow[]>(
    sanitizeSourceRows(
      storedState?.spendSources,
      buildDefaultRows(BASE_SPEND_SOURCES),
    ),
  );

  const [pointsLeagueDaily, setPointsLeagueDaily] = useState<string>(
    typeof storedState?.pointsLeagueRank === 'string'
      ? storedState.pointsLeagueRank
      : POINTS_LEAGUE_OPTIONS[0].value,
  );
  const [arenaDaily, setArenaDaily] = useState<string>(
    typeof storedState?.arenaDaily === 'string'
      ? storedState.arenaDaily
      : ARENA_OPTIONS[7].value,
  );
  const [colosseumBiweekly, setColosseumBiweekly] = useState<string>(
    typeof storedState?.colosseumBiweekly === 'string'
      ? storedState.colosseumBiweekly
      : COLOSSEUM_OPTIONS[4].value,
  );
  const [wildHuntBiweekly, setWildHuntBiweekly] = useState<string>(
    typeof storedState?.wildHuntBiweekly === 'string'
      ? storedState.wildHuntBiweekly
      : WILD_HUNT_OPTIONS[7].value,
  );
  const [includeSupremeCard, setIncludeSupremeCard] = useState<boolean>(
    Boolean(storedState?.includeSupremeCard),
  );

  usePersistedState<CalculatorState>(LOCAL_STORAGE_KEY, {
    bank,
    targetDate,
    gainSources,
    spendSources,
    pointsLeagueRank: pointsLeagueDaily,
    arenaDaily,
    colosseumBiweekly,
    wildHuntBiweekly,
    includeSupremeCard,
  });

  const selectedPointsLeagueDaily =
    POINTS_LEAGUE_DAILY_BY_RANK[pointsLeagueDaily] ?? 0;

  const selectedArenaDaily = Number(arenaDaily) || 0;
  const selectedColosseumDaily = (Number(colosseumBiweekly) || 0) / 14;
  const selectedWildHuntDaily = (Number(wildHuntBiweekly) || 0) / 14;
  const supremeCardDaily = includeSupremeCard ? SUPREME_MONTHLY_CARD / 30 : 0;

  const baseGainPerDay = useMemo(
    () => sumSourcesPerDay(gainSources),
    [gainSources],
  );
  const baseSpendPerDay = useMemo(
    () => sumSourcesPerDay(spendSources),
    [spendSources],
  );

  const totalGainPerDay =
    baseGainPerDay +
    selectedPointsLeagueDaily +
    selectedArenaDaily +
    selectedColosseumDaily +
    selectedWildHuntDaily +
    supremeCardDaily;

  const totalSpendPerDay = baseSpendPerDay;
  const netPerDay = totalGainPerDay - totalSpendPerDay;

  const netPerWeek = netPerDay * 7;
  const netPerMonth = netPerDay * 30;

  const daysUntilZero =
    netPerDay < 0 && safeBank > 0 ? safeBank / Math.abs(netPerDay) : null;

  const runOutDate = useMemo(() => {
    if (daysUntilZero === null) {
      return null;
    }

    const date = new Date();
    date.setDate(date.getDate() + Math.floor(daysUntilZero));
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [daysUntilZero]);

  const projectedBank = useMemo(() => {
    const diffDays = dayDiffFromToday(targetDate);
    return safeBank + netPerDay * diffDays;
  }, [safeBank, netPerDay, targetDate]);

  const targetDateLabel = useMemo(() => {
    const date = new Date(`${targetDate}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return targetDate;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [targetDate]);

  const targetDateValue = useMemo(
    () => isoDateToDate(targetDate),
    [targetDate],
  );
  const deferredGainSources = useDeferredValue(gainSources);
  const deferredSpendSources = useDeferredValue(spendSources);

  const sortedGainSources = useMemo(
    () => sortSourcesByCadenceThenLabel(deferredGainSources),
    [deferredGainSources],
  );
  const sortedSpendSources = useMemo(
    () => sortSourcesByCadenceThenLabel(deferredSpendSources),
    [deferredSpendSources],
  );

  const updateSource = (
    type: SourceType,
    id: string,
    updater: (source: SourceRow) => SourceRow,
  ) => {
    const setter = type === 'gain' ? setGainSources : setSpendSources;
    setter((prev) =>
      prev.map((source) => (source.id === id ? updater(source) : source)),
    );
  };

  const addSource = (type: SourceType) => {
    const setter = type === 'gain' ? setGainSources : setSpendSources;
    setter((prev) => [...prev, createCustomSource(type)]);
  };

  const removeSource = (type: SourceType, id: string) => {
    const setter = type === 'gain' ? setGainSources : setSpendSources;
    setter((prev) => prev.filter((source) => source.id !== id));
  };

  const resetEverything = () => {
    setBank(0);
    setTargetDate(getTodayIsoDate());
    setGainSources(buildDefaultRows(BASE_GAIN_SOURCES));
    setSpendSources(buildDefaultRows(BASE_SPEND_SOURCES));
    setPointsLeagueDaily(POINTS_LEAGUE_OPTIONS[0].value);
    setArenaDaily(ARENA_OPTIONS[7].value);
    setColosseumBiweekly(COLOSSEUM_OPTIONS[4].value);
    setWildHuntBiweekly(WILD_HUNT_OPTIONS[7].value);
    setIncludeSupremeCard(false);

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignore local storage write failures.
    }
  };

  return (
    <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Stack gap={2}>
          <Title order={1}>Diamond Calculator</Title>
          <Text size="sm" c="dimmed">
            Estimate average gain, spend, runway, and projected balance by date.
          </Text>
        </Stack>

        <Alert
          variant="light"
          color={accent.primary}
          title="How to use"
          icon={<IoInformationCircleOutline />}
        >
          This is an average-value planner based on recurring income and
          spending from your reference list. Set your current bank and cadence
          values, then use the date field for rough balance projection.
        </Alert>

        <StaticSurface p="lg">
          <Stack gap="md">
            <Title order={2} size="h3">
              <Group gap="xs">
                <IoWallet />
                Core Inputs
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <NumberInput
                label="Current Diamond Bank"
                value={bank ?? ''}
                onChange={(value) => setBank(parseNumberInput(value))}
                min={0}
                max={999999999}
                thousandSeparator=","
              />
              <DateInput
                label="Projection Date"
                value={targetDateValue}
                onChange={(value: DateValue | string) => {
                  if (value instanceof Date && !Number.isNaN(value.getTime())) {
                    const selected = new Date(value);
                    selected.setHours(0, 0, 0, 0);
                    if (selected < minDate) {
                      setTargetDate(dateToInputValue(minDate));
                      return;
                    }

                    setTargetDate(dateToInputValue(value));
                    return;
                  }

                  if (typeof value === 'string') {
                    const normalized = normalizeIsoDate(
                      value,
                      getTodayIsoDate(),
                    );
                    setTargetDate(normalized);
                  }
                }}
                leftSection={<IoCalendar />}
                valueFormat="YYYY-MM-DD"
                minDate={minDate}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Select
                label="Arena Rank"
                data={ARENA_OPTIONS}
                value={arenaDaily}
                onChange={(value) =>
                  setArenaDaily(value ?? ARENA_OPTIONS[0].value)
                }
                searchable
              />
              <Select
                label="Points League"
                data={POINTS_LEAGUE_OPTIONS}
                value={pointsLeagueDaily}
                onChange={(value) =>
                  setPointsLeagueDaily(value ?? POINTS_LEAGUE_OPTIONS[0].value)
                }
              />
              <Select
                label="Colosseum Rank"
                data={COLOSSEUM_OPTIONS}
                value={colosseumBiweekly}
                onChange={(value) =>
                  setColosseumBiweekly(value ?? COLOSSEUM_OPTIONS[0].value)
                }
                searchable
              />
              <Select
                label="Wild Hunt Rank"
                data={WILD_HUNT_OPTIONS}
                value={wildHuntBiweekly}
                onChange={(value) =>
                  setWildHuntBiweekly(value ?? WILD_HUNT_OPTIONS[0].value)
                }
                searchable
              />
            </SimpleGrid>

            <Group justify="space-between" align="end" wrap="wrap">
              <Switch
                label="Include Supreme Monthly Card (10,200 over 30 days)"
                color={accent.primary}
                checked={includeSupremeCard}
                onChange={(event) =>
                  setIncludeSupremeCard(event.currentTarget.checked)
                }
              />
              <Button color="red" variant="light" onClick={resetEverything}>
                Reset
              </Button>
            </Group>
          </Stack>
        </StaticSurface>

        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
          <DiamondSourceTable
            type="gain"
            sources={sortedGainSources}
            accentColor={accent.primary}
            onUpdate={updateSource}
            onAdd={addSource}
            onRemove={removeSource}
          />
          <DiamondSourceTable
            type="spend"
            sources={sortedSpendSources}
            accentColor={accent.primary}
            onUpdate={updateSource}
            onAdd={addSource}
            onRemove={removeSource}
          />
        </SimpleGrid>

        <DiamondResults
          gainPerDay={totalGainPerDay}
          spendPerDay={totalSpendPerDay}
          netPerDay={netPerDay}
          netPerWeek={netPerWeek}
          netPerMonth={netPerMonth}
          projectedBank={projectedBank}
          targetDateLabel={targetDateLabel}
          currentBank={safeBank}
          daysUntilZero={daysUntilZero}
          runOutDate={runOutDate}
        />
      </Stack>
    </Container>
  );
}
