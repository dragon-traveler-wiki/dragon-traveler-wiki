import type {
  DiamondSourceRow as SourceRow,
  DiamondSourceType as SourceType,
} from '@/features/calculators/diamond/types';
import type { DiamondBaseSource } from '@/features/calculators/diamond/diamond-data';

export function buildDefaultRows(
  baseSources: DiamondBaseSource[],
): SourceRow[] {
  return baseSources.map((source) => ({
    id: source.id,
    label: source.label,
    amount: source.defaultAmount,
    cadenceDays: source.defaultCadenceDays,
    isCustom: false,
    enabled: true,
  }));
}

export function sumSourcesPerDay(sources: SourceRow[]): number {
  return sources.reduce((sum, source) => {
    if (!source.enabled) {
      return sum;
    }

    const amount = source.amount ?? 0;
    const cadenceDays = source.cadenceDays ?? 0;
    if (amount <= 0 || cadenceDays <= 0) {
      return sum;
    }

    return sum + amount / cadenceDays;
  }, 0);
}

export function dateToInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  return dateToInputValue(new Date());
}

export function isValidIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return dateToInputValue(parsed) === value;
}

export function normalizeIsoDate(value: string, fallback: string): string {
  return isValidIsoDateString(value) ? value : fallback;
}

export function isoDateToDate(value: string): Date | null {
  if (!isValidIsoDateString(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
}

export function dayDiffFromToday(targetIsoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${targetIsoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return 0;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

export function getStartOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function createCustomSource(type: SourceType): SourceRow {
  const suffix = Math.random().toString(36).slice(2, 8);
  const prefix = type === 'gain' ? 'gain' : 'spend';
  return {
    id: `custom-${prefix}-${Date.now()}-${suffix}`,
    label: `Custom ${type === 'gain' ? 'gain' : 'spend'}`,
    amount: null,
    cadenceDays: 7,
    isCustom: true,
    enabled: true,
  };
}

export function sanitizeSourceRow(input: unknown): SourceRow | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const source = input as Partial<SourceRow>;
  if (typeof source.id !== 'string' || typeof source.label !== 'string') {
    return null;
  }

  const amount =
    typeof source.amount === 'number' && Number.isFinite(source.amount)
      ? source.amount
      : null;
  const cadenceDays =
    typeof source.cadenceDays === 'number' &&
    Number.isFinite(source.cadenceDays)
      ? source.cadenceDays
      : null;

  return {
    id: source.id,
    label: source.label,
    amount,
    cadenceDays,
    isCustom: Boolean(source.isCustom),
    enabled: source.enabled !== false,
  };
}

export function sanitizeSourceRows(
  input: unknown,
  fallback: SourceRow[],
): SourceRow[] {
  if (!Array.isArray(input)) {
    return fallback;
  }

  const sanitized = input
    .map((row) => sanitizeSourceRow(row))
    .filter((row): row is SourceRow => row !== null);

  if (input.length === 0) {
    return [];
  }

  return sanitized.length > 0 ? sanitized : fallback;
}

export function sortSourcesByCadenceThenLabel(
  sources: SourceRow[],
): SourceRow[] {
  return [...sources].sort((a, b) => {
    const cadenceA = a.cadenceDays ?? Number.POSITIVE_INFINITY;
    const cadenceB = b.cadenceDays ?? Number.POSITIVE_INFINITY;

    if (cadenceA !== cadenceB) {
      return cadenceA - cadenceB;
    }

    return a.label.localeCompare(b.label, undefined, {
      sensitivity: 'base',
    });
  });
}
