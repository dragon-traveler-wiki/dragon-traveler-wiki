import { describe, expect, it } from 'vitest';
import {
  activeSuspension,
  suspensionEnd,
  suspensionMessage,
} from '../src/suspension';

const NOW = 1_000_000;
const none = {
  suspended_until: null,
  suspension_permanent: 0,
  suspension_reason: '',
};

describe('suspensionEnd', () => {
  it('adds the chosen number of days', () => {
    expect(suspensionEnd('1d', NOW)).toBe(NOW + 86400);
    expect(suspensionEnd('7d', NOW)).toBe(NOW + 7 * 86400);
    expect(suspensionEnd('30d', NOW)).toBe(NOW + 30 * 86400);
  });

  it('has no end for permanent bans', () => {
    expect(suspensionEnd('permanent', NOW)).toBeNull();
  });
});

describe('activeSuspension', () => {
  it('is null for users who were never suspended', () => {
    expect(activeSuspension(none, NOW)).toBeNull();
  });

  it('is null once a timeout has expired', () => {
    expect(
      activeSuspension({ ...none, suspended_until: NOW - 1 }, NOW),
    ).toBeNull();
    expect(activeSuspension({ ...none, suspended_until: NOW }, NOW)).toBeNull();
  });

  it('is active until the timeout ends', () => {
    expect(
      activeSuspension(
        { ...none, suspended_until: NOW + 60, suspension_reason: 'spam' },
        NOW,
      ),
    ).toEqual({ until: NOW + 60, permanent: false, reason: 'spam' });
  });

  it('treats permanent bans as always active', () => {
    expect(activeSuspension({ ...none, suspension_permanent: 1 }, NOW)).toEqual(
      { until: null, permanent: true, reason: '' },
    );
  });
});

describe('suspensionMessage', () => {
  it('includes the reason when there is one', () => {
    expect(
      suspensionMessage({ until: null, permanent: true, reason: 'spam' }),
    ).toBe('Your account has been banned. Reason: spam');
  });

  it('describes timeouts with their end date', () => {
    expect(
      suspensionMessage({ until: 86400, permanent: false, reason: '' }),
    ).toBe('Your account is suspended until Fri, 02 Jan 1970 00:00:00 GMT.');
  });
});
