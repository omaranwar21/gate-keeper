import { cairoDayBounds } from './cairo-time';

const HOUR_MS = 60 * 60_000;

function bounds(iso: string) {
  const { start, end } = cairoDayBounds(new Date(iso));
  return { start: start.toISOString(), end: end.toISOString(), hours: (end.getTime() - start.getTime()) / HOUR_MS };
}

describe('cairoDayBounds', () => {
  it('starts exactly at local midnight in winter (UTC+2), ignoring seconds', () => {
    // 14:35:27.123 Cairo time
    expect(bounds('2026-11-16T12:35:27.123Z')).toEqual({
      start: '2026-11-15T22:00:00.000Z',
      end: '2026-11-16T22:00:00.000Z',
      hours: 24,
    });
  });

  it('starts exactly at local midnight in summer (UTC+3)', () => {
    expect(bounds('2026-07-01T09:00:00Z')).toEqual({
      start: '2026-06-30T21:00:00.000Z',
      end: '2026-07-01T21:00:00.000Z',
      hours: 24,
    });
  });

  it('includes the first second of the day and excludes the next midnight', () => {
    expect(bounds('2026-11-15T22:00:00.000Z').start).toBe('2026-11-15T22:00:00.000Z');
    expect(bounds('2026-11-15T21:59:59.999Z').start).toBe('2026-11-14T22:00:00.000Z');
  });

  it('handles the spring-forward day, which skips 00:00-00:59 and lasts 23h', () => {
    // 2026-04-24 (last Friday of April): clocks jump from 00:00 EET to 01:00 EEST.
    expect(bounds('2026-04-24T09:00:00Z')).toEqual({
      start: '2026-04-23T22:00:00.000Z', // 01:00 local, the first instant of the day
      end: '2026-04-24T21:00:00.000Z',
      hours: 23,
    });
  });

  it('handles the fall-back day, which repeats 23:00-23:59 and lasts 25h', () => {
    // 2026-10-29 (last Thursday of October): clocks go back from 24:00 EEST to 23:00 EET.
    expect(bounds('2026-10-29T09:00:00Z')).toEqual({
      start: '2026-10-28T21:00:00.000Z',
      end: '2026-10-29T22:00:00.000Z',
      hours: 25,
    });
    // The repeated hour still belongs to Thursday.
    expect(bounds('2026-10-29T21:30:00Z').start).toBe('2026-10-28T21:00:00.000Z');
  });
});
