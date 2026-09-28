import { useState } from 'react';

/**
 * State for a NumberInput that can be cleared (Mantine reports an empty
 * field as null). Pairs the raw nullable value with a `?? 0` fallback so
 * callers doing arithmetic don't repeat the same guard everywhere.
 */
export function useNullableNumber(
  initial: number | null,
): [number | null, number, (value: number | null) => void] {
  const [value, setValue] = useState<number | null>(initial);
  return [value, value ?? 0, setValue];
}
