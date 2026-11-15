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

// Start (inclusive) / end (exclusive) of "now"'s calendar day in Cairo local
// time, as UTC instants. Cairo currently has no DST, so subtracting the
// local minute-of-day from `now` lands exactly on local midnight.
export function cairoDayBounds(now: Date): { start: Date; end: Date } {
  const { minuteOfDay } = cairoLocalMinutes(now);
  const start = new Date(now.getTime() - minuteOfDay * 60_000);
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { start, end };
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
