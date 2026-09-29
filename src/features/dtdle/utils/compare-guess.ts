import type { Character } from '@/features/characters/types';
import { getQualityRank } from '../../../utils/quality.ts';
import type { GuessComparison } from '../types';

function parseMeasurement(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = parseFloat(value.replace(/,/g, '').replace(/[^0-9.]/g, ''));
  return Number.isNaN(parsed) ? null : parsed;
}

/** 'higher' means the answer's value is greater than the guess's value. */
function compareOrdinal(
  guessValue: number | null,
  answerValue: number | null,
): 'exact' | 'higher' | 'lower' | 'unknown' {
  if (guessValue === null || answerValue === null) return 'unknown';
  if (answerValue === guessValue) return 'exact';
  return answerValue > guessValue ? 'higher' : 'lower';
}

/**
 * Compares a guessed character against today's answer, column by column.
 * For quality, 'higher' means the answer is rarer (lower QUALITY_ORDER index)
 * than the guess; 'lower' means the answer is more common.
 */
export function compareGuessToAnswer(
  guess: Character,
  answer: Character,
): GuessComparison {
  const guessQualityIndex = getQualityRank(guess.quality);
  const answerQualityIndex = getQualityRank(answer.quality);

  const guessFactions = new Set(guess.factions);
  const answerFactions = new Set(answer.factions);
  const sameFactions =
    guessFactions.size === answerFactions.size &&
    [...guessFactions].every((f) => answerFactions.has(f));
  const overlaps = [...guessFactions].some((f) => answerFactions.has(f));

  return {
    classStatus:
      guess.character_class === answer.character_class ? 'exact' : 'none',
    qualityStatus:
      guessQualityIndex === answerQualityIndex
        ? 'exact'
        : answerQualityIndex < guessQualityIndex
          ? 'higher'
          : 'lower',
    factionStatus: sameFactions ? 'exact' : overlaps ? 'partial' : 'none',
    originStatus: guess.origin === answer.origin ? 'exact' : 'none',
    heightStatus: compareOrdinal(
      parseMeasurement(guess.height),
      parseMeasurement(answer.height),
    ),
    weightStatus: compareOrdinal(
      parseMeasurement(guess.weight),
      parseMeasurement(answer.weight),
    ),
  };
}
