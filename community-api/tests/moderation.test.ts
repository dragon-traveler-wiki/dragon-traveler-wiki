import { describe, expect, it } from 'vitest';
import { statusForModerationAction } from '../src/moderation';

describe('statusForModerationAction', () => {
  it('maps hide to hidden', () => {
    expect(statusForModerationAction('hide')).toBe('hidden');
  });

  it('maps restore to published', () => {
    expect(statusForModerationAction('restore')).toBe('published');
  });

  it('maps delete to deleted', () => {
    expect(statusForModerationAction('delete')).toBe('deleted');
  });
});
