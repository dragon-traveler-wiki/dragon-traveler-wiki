import type { TeamBenchMember } from '@/features/teams/types';
import { normalizeOptionalNote } from '../../../utils/normalize-note.ts';
import { toQuality } from '../../../utils/quality.ts';
import { toEntitySlug } from '../../../utils/entity-slug.ts';

export function isTeamBenchMember(value: unknown): value is TeamBenchMember {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (typeof record.character_slug !== 'string') return false;

  if (
    record.note !== undefined &&
    record.note !== null &&
    typeof record.note !== 'string'
  ) {
    return false;
  }

  if (
    record.character_quality === undefined ||
    record.character_quality === null
  ) {
    return true;
  }

  return toQuality(record.character_quality) !== undefined;
}

export function getTeamBenchEntryName(entry: TeamBenchMember): string {
  return entry.character_slug;
}

export function getTeamBenchEntryQuality(
  entry: TeamBenchMember,
): TeamBenchMember['character_quality'] | undefined {
  return entry.character_quality;
}

export function getTeamBenchEntryNote(
  entry: TeamBenchMember,
): TeamBenchMember['note'] | undefined {
  return normalizeOptionalNote(entry.note);
}

export function normalizeTeamBenchEntry(
  value: unknown,
): TeamBenchMember | null {
  if (typeof value === 'string') {
    // May be a slug already or a legacy display name — toEntitySlug is idempotent on slugs
    const slug = toEntitySlug(value);
    return slug ? { character_slug: slug } : null;
  }

  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;

  // Support both new slug format and legacy character_name format
  const slug =
    typeof record.character_slug === 'string'
      ? record.character_slug
      : typeof record.character_name === 'string'
        ? toEntitySlug(record.character_name as string)
        : null;
  if (!slug) return null;

  const normalizedQuality = toQuality(record.character_quality);
  const normalizedNote = normalizeOptionalNote(record.note);
  return {
    character_slug: slug,
    ...(normalizedQuality ? { character_quality: normalizedQuality } : {}),
    ...(normalizedNote ? { note: normalizedNote } : {}),
  };
}
