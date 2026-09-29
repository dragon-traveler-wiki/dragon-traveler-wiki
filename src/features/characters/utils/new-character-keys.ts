interface CharacterLifecycleChange {
  timestamp: number;
  type?: 'removed' | 'readded';
}

interface CharacterLifecycleHistory {
  added?: number;
  changes?: CharacterLifecycleChange[];
}

export function getNewestActiveCharacterKeys(
  history: Record<string, CharacterLifecycleHistory>,
  activeSlugs: Iterable<string>,
): Set<string> {
  const active = new Set(activeSlugs);
  const introductions = new Map<string, number>();

  for (const [slug, value] of Object.entries(history)) {
    if (!active.has(slug) || !value.added) continue;

    let isActive = true;
    let introducedAt = value.added;
    const lifecycleChanges = [...(value.changes ?? [])]
      .filter((change) => change.type)
      .sort((a, b) => a.timestamp - b.timestamp);

    for (const change of lifecycleChanges) {
      if (change.type === 'removed') {
        isActive = false;
      } else if (change.type === 'readded') {
        isActive = true;
        introducedAt = change.timestamp;
      }
    }

    if (isActive) introductions.set(slug, introducedAt);
  }

  const newestTimestamp = Math.max(0, ...introductions.values());
  if (newestTimestamp === 0) return new Set();

  return new Set(
    [...introductions]
      .filter(([, timestamp]) => timestamp === newestTimestamp)
      .map(([slug]) => slug),
  );
}

/**
 * Returns the active character slugs whose most recent content edit (a
 * regular change record, not a lifecycle add/remove/readded event) falls in
 * the newest such batch. `excludeSlugs` lets a caller drop characters
 * already flagged "new" so a character isn't badged both ways at once.
 */
export function getNewestUpdatedCharacterKeys(
  history: Record<string, CharacterLifecycleHistory>,
  activeSlugs: Iterable<string>,
  excludeSlugs: ReadonlySet<string> = new Set(),
): Set<string> {
  const active = new Set(activeSlugs);
  const lastUpdatedAt = new Map<string, number>();

  for (const [slug, value] of Object.entries(history)) {
    if (!active.has(slug) || excludeSlugs.has(slug)) continue;

    const contentChangeTimestamps = (value.changes ?? [])
      .filter((change) => !change.type)
      .map((change) => change.timestamp);
    if (contentChangeTimestamps.length === 0) continue;

    lastUpdatedAt.set(slug, Math.max(...contentChangeTimestamps));
  }

  const newestTimestamp = Math.max(0, ...lastUpdatedAt.values());
  if (newestTimestamp === 0) return new Set();

  return new Set(
    [...lastUpdatedAt]
      .filter(([, timestamp]) => timestamp === newestTimestamp)
      .map(([slug]) => slug),
  );
}
