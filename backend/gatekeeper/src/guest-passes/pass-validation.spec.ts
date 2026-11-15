import { DenyReason, PassType } from '../generated/prisma/enums';
import { derivePassStatus, validatePassForScan, type ScannablePass } from './pass-validation';

// Wednesday 2026-01-14 10:00 Cairo time (UTC+2 in January) == 08:00 UTC.
const WED_10AM_CAIRO = new Date('2026-01-14T08:00:00.000Z');

function oneTimePass(overrides: Partial<ScannablePass> = {}): ScannablePass {
  return {
    type: PassType.one_time,
    validFrom: new Date('2026-01-14T06:00:00.000Z'),
    validUntil: new Date('2026-01-14T10:00:00.000Z'),
    usedAt: null,
    revokedAt: null,
    daysOfWeek: [],
    dailyStartMin: null,
    dailyEndMin: null,
    ...overrides,
  };
}

function recurringPass(overrides: Partial<ScannablePass> = {}): ScannablePass {
  return {
    type: PassType.recurring,
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validUntil: new Date('2026-12-31T23:59:59.000Z'),
    usedAt: null,
    revokedAt: null,
    daysOfWeek: [0, 1, 2, 3, 4], // Sun-Thu
    dailyStartMin: 8 * 60, // 08:00
    dailyEndMin: 17 * 60, // 17:00
    ...overrides,
  };
}

describe('validatePassForScan', () => {
  it('allows an active one-time pass within its window', () => {
    expect(validatePassForScan(oneTimePass(), WED_10AM_CAIRO)).toBeNull();
  });

  it('denies a revoked pass regardless of type', () => {
    expect(
      validatePassForScan(oneTimePass({ revokedAt: new Date() }), WED_10AM_CAIRO),
    ).toBe(DenyReason.revoked);
  });

  it('denies a one-time pass that was already used', () => {
    expect(
      validatePassForScan(oneTimePass({ usedAt: new Date() }), WED_10AM_CAIRO),
    ).toBe(DenyReason.already_used);
  });

  it('denies a scan before the pass becomes valid', () => {
    const pass = oneTimePass({ validFrom: new Date('2026-01-14T09:00:00.000Z') });
    expect(validatePassForScan(pass, WED_10AM_CAIRO)).toBe(DenyReason.not_yet_valid);
  });

  it('denies a scan after the pass has expired', () => {
    const pass = oneTimePass({ validUntil: new Date('2026-01-14T07:00:00.000Z') });
    expect(validatePassForScan(pass, WED_10AM_CAIRO)).toBe(DenyReason.expired);
  });

  it('ignores usedAt for recurring passes (no single-use concept)', () => {
    expect(
      validatePassForScan(recurringPass({ usedAt: new Date() }), WED_10AM_CAIRO),
    ).toBeNull();
  });

  it('allows a recurring pass on an allowed weekday inside the daily window', () => {
    expect(validatePassForScan(recurringPass(), WED_10AM_CAIRO)).toBeNull();
  });

  it('denies a recurring pass on a day not in daysOfWeek', () => {
    // Saturday 2026-01-17, 10:00 Cairo == 08:00 UTC.
    const saturday10amCairo = new Date('2026-01-17T08:00:00.000Z');
    expect(validatePassForScan(recurringPass(), saturday10amCairo)).toBe(
      DenyReason.outside_time_window,
    );
  });

  it('denies a recurring pass before the daily start minute', () => {
    // Wednesday 07:59 Cairo == 05:59 UTC.
    const before = new Date('2026-01-14T05:59:00.000Z');
    expect(validatePassForScan(recurringPass(), before)).toBe(DenyReason.outside_time_window);
  });

  it('allows a recurring pass exactly at the daily start minute (inclusive)', () => {
    // Wednesday 08:00 Cairo == 06:00 UTC.
    const atStart = new Date('2026-01-14T06:00:00.000Z');
    expect(validatePassForScan(recurringPass(), atStart)).toBeNull();
  });

  it('denies a recurring pass exactly at the daily end minute (exclusive)', () => {
    // Wednesday 17:00 Cairo == 15:00 UTC.
    const atEnd = new Date('2026-01-14T15:00:00.000Z');
    expect(validatePassForScan(recurringPass(), atEnd)).toBe(DenyReason.outside_time_window);
  });
});

describe('derivePassStatus', () => {
  it('reports revoked first, even if also used or expired', () => {
    const pass = oneTimePass({ usedAt: new Date(), revokedAt: new Date() });
    expect(derivePassStatus(pass, WED_10AM_CAIRO)).toBe('revoked');
  });

  it('reports used for a consumed one-time pass', () => {
    expect(derivePassStatus(oneTimePass({ usedAt: new Date() }), WED_10AM_CAIRO)).toBe('used');
  });

  it('reports expired once validUntil has passed', () => {
    const pass = oneTimePass({ validUntil: new Date('2026-01-14T07:00:00.000Z') });
    expect(derivePassStatus(pass, WED_10AM_CAIRO)).toBe('expired');
  });

  it('reports active otherwise', () => {
    expect(derivePassStatus(oneTimePass(), WED_10AM_CAIRO)).toBe('active');
  });
});
