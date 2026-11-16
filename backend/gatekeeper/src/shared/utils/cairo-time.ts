export const CAIRO_TIME_ZONE = 'Africa/Cairo';

// 0 = Sunday ... 6 = Saturday, matching GuestPass.daysOfWeek in schema.prisma.
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

// Weekday + minutes-since-midnight for `instant`, read in the compound's
// timezone (Africa/Cairo), without pulling in a date library for this one use.
export function cairoLocalMinutes(instant: Date): {
  weekday: number;
  minuteOfDay: number;
} {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(instant);

  const weekdayPart = parts.find((p) => p.type === 'weekday')!.value;
  const hourPart = parts.find((p) => p.type === 'hour')!.value;
  const minutePart = parts.find((p) => p.type === 'minute')!.value;

  // Intl can render midnight as "24" for hour12: false.
  const hour = Number(hourPart) % 24;
  const minute = Number(minutePart);

  return {
    weekday: WEEKDAY_INDEX[weekdayPart],
    minuteOfDay: hour * 60 + minute,
  };
}

// How far Cairo's wall clock is ahead of UTC at `instant`, in ms: +2h in
// winter (EET), +3h in summer (EEST, observed again since 2023).
function cairoOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CAIRO_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const wallClockAsUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return wallClockAsUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// The first instant of the Cairo calendar day year-month-day (month 0-based,
// overflow allowed, e.g. day 32). Usually local 00:00, but on the spring DST
// day Egypt skips 00:00–00:59, so that day starts at 01:00. Guessing with
// the offset at the guess itself, twice, settles on the right side of a
// transition either way.
function cairoStartOfDay(year: number, month: number, day: number): Date {
  const midnightAsUtc = Date.UTC(year, month, day);
  let guess = midnightAsUtc - cairoOffsetMs(new Date(midnightAsUtc));
  guess = midnightAsUtc - cairoOffsetMs(new Date(guess));
  return new Date(guess);
}

// Start (inclusive) / end (exclusive) of "now"'s calendar day in Cairo local
// time, as UTC instants. A day is 24h, except 23h / 25h on DST change days.
export function cairoDayBounds(now: Date): { start: Date; end: Date } {
  const [year, month, day] = cairoDateKey(now).split('-').map(Number);
  return {
    start: cairoStartOfDay(year, month - 1, day),
    end: cairoStartOfDay(year, month - 1, day + 1),
  };
}

// The Cairo-local calendar date of `instant`, as "YYYY-MM-DD" — used to
// bucket timestamped rows (e.g. AccessLog.scannedAt) by day for trend charts.
export function cairoDateKey(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TIME_ZONE }).format(instant);
}

// The Cairo-local hour (0-23) of `instant` — used to bucket rows by
// hour-of-day for a "peak hours" chart.
export function cairoHour(instant: Date): number {
  return Math.floor(cairoLocalMinutes(instant).minuteOfDay / 60);
}
