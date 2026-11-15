import { findDayOverLimit, passOccurrenceDays } from './pass-limit';
import { PassType } from '../generated/prisma/enums';

function cairoMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00+02:00`);
}

describe('passOccurrenceDays', () => {
  it('a one-time pass occupies only the day of validFrom', () => {
    const days = passOccurrenceDays({
      type: PassType.one_time,
      validFrom: new Date('2026-01-15T10:00:00+02:00'),
      validUntil: new Date('2026-01-15T18:00:00+02:00'),
      daysOfWeek: [],
    });

    expect(days).toEqual(new Set(['2026-01-15']));
  });

  it('a recurring pass occupies every matching weekday in its window', () => {
    // 2026-01-15 is a Thursday (weekday 4); window spans two weeks.
    const days = passOccurrenceDays({
      type: PassType.recurring,
      validFrom: cairoMidnight('2026-01-15'),
      validUntil: cairoMidnight('2026-01-29'),
      daysOfWeek: [4], // Thursdays only
    });

    expect(days).toEqual(new Set(['2026-01-15', '2026-01-22']));
  });
});

describe('findDayOverLimit', () => {
  const sameDayOneTime = (day: string): { type: PassType; validFrom: Date; validUntil: Date; daysOfWeek: number[] } => ({
    type: PassType.one_time,
    validFrom: new Date(`${day}T10:00:00+02:00`),
    validUntil: new Date(`${day}T18:00:00+02:00`),
    daysOfWeek: [],
  });

  it('returns undefined when every day stays within the limit', () => {
    const existing = [sameDayOneTime('2026-01-15')];
    expect(findDayOverLimit(sameDayOneTime('2026-01-15'), existing, 2)).toBeUndefined();
  });

  it('returns the day that would exceed the limit', () => {
    const existing = [sameDayOneTime('2026-01-15'), sameDayOneTime('2026-01-15')];
    expect(findDayOverLimit(sameDayOneTime('2026-01-15'), existing, 2)).toBe('2026-01-15');
  });

  it('ignores existing passes on days the candidate does not occupy', () => {
    const existing = [sameDayOneTime('2026-01-16'), sameDayOneTime('2026-01-16')];
    expect(findDayOverLimit(sameDayOneTime('2026-01-15'), existing, 1)).toBeUndefined();
  });

  it('checks every day a recurring candidate would occupy', () => {
    const candidate = {
      type: PassType.recurring,
      validFrom: cairoMidnight('2026-01-15'),
      validUntil: cairoMidnight('2026-01-29'),
      daysOfWeek: [4],
    };
    // One existing pass lands only on the second Thursday (2026-01-22).
    const existing = [sameDayOneTime('2026-01-22')];

    expect(findDayOverLimit(candidate, existing, 1)).toBe('2026-01-22');
  });
});
