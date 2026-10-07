/** Trims whitespace and lowercases a string for case-insensitive comparisons. */
export const normalizeName = (value: string): string =>
  value.trim().toLowerCase();

/** Plural form of a simple English noun, e.g. "relic" → "relics", "subclass" → "subclasses". */
export const pluralize = (noun: string): string =>
  /(s|x|z|ch|sh)$/.test(noun) ? `${noun}es` : `${noun}s`;
