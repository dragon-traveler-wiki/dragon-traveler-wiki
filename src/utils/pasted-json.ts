import { isRecord } from './type-guards.ts';

/** Normalizes a pasted JSON value (entry array, wrapped array, or bare object) into a patch record. */
export function resolvePastedPatch<TEntry>(
  value: unknown,
  isEntryLike: (item: unknown) => item is TEntry,
  entriesKey: string,
): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    if (value.every(isEntryLike)) {
      return { [entriesKey]: value };
    }
    if (value.length === 1 && isRecord(value[0])) {
      return value[0];
    }
    return null;
  }

  if (isRecord(value)) {
    return value;
  }

  return null;
}
