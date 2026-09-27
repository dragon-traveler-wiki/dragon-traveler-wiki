import { describe, expect, it } from 'vitest';
import { REPORT_RETENTION_DAYS, reportCutoff } from '../src/retention';

describe('reportCutoff', () => {
  it('is the retention window before now', () => {
    const now = 10_000_000;
    expect(reportCutoff(now)).toBe(now - REPORT_RETENTION_DAYS * 86400);
  });
});
