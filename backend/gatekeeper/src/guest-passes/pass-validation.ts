import { Prisma } from '../generated/prisma/client';
import { DenyReason, PassType } from '../generated/prisma/enums';

const CAIRO_TIME_ZONE = 'Africa/Cairo';

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

export interface ScannablePass {
  type: PassType;
  validFrom: Date;
  validUntil: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  daysOfWeek: number[];
  dailyStartMin: number | null;
  dailyEndMin: number | null;
}

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

// Pure scan decision: no DB access, so it is directly unit-testable.
// Returns null when the pass is allowed, otherwise the reason it is denied.
// Does NOT decide the one-time "claim" race (see GuestPassesService.scan).
export function validatePassForScan(
  pass: ScannablePass,
  now: Date,
): DenyReason | null {
  if (pass.revokedAt) {
    return DenyReason.revoked;
  }

  if (pass.type === PassType.one_time && pass.usedAt) {
    return DenyReason.already_used;
  }

  if (now < pass.validFrom) {
    return DenyReason.not_yet_valid;
  }

  if (now > pass.validUntil) {
    return DenyReason.expired;
  }

  if (pass.type === PassType.recurring) {
    const { weekday, minuteOfDay } = cairoLocalMinutes(now);
    const withinDay = pass.daysOfWeek.includes(weekday);
    const withinWindow =
      pass.dailyStartMin !== null &&
      pass.dailyEndMin !== null &&
      minuteOfDay >= pass.dailyStartMin &&
      minuteOfDay < pass.dailyEndMin;

    if (!withinDay || !withinWindow) {
      return DenyReason.outside_time_window;
    }
  }

  return null;
}

export type PassStatus = 'active' | 'used' | 'expired' | 'revoked';
export const PASS_STATUSES: PassStatus[] = [
  'active',
  'used',
  'expired',
  'revoked',
];

// Display status for the resident's pass list — derived, never stored.
export function derivePassStatus(
  pass: Pick<ScannablePass, 'type' | 'validUntil' | 'usedAt' | 'revokedAt'>,
  now: Date,
): PassStatus {
  if (pass.revokedAt) return 'revoked';
  if (pass.type === PassType.one_time && pass.usedAt) return 'used';
  if (now > pass.validUntil) return 'expired';
  return 'active';
}

// DB-query counterpart to derivePassStatus, for filtering at the Prisma level
// instead of in memory (pagination totals need to match). Keep the branches
// in sync with derivePassStatus's precedence: revoked > used > expired > active.
export function passStatusWhereClause(
  status: PassStatus,
  now: Date,
): Prisma.GuestPassWhereInput {
  const notUsedOneTime: Prisma.GuestPassWhereInput = {
    OR: [{ type: { not: PassType.one_time } }, { usedAt: null }],
  };

  switch (status) {
    case 'revoked':
      return { revokedAt: { not: null } };
    case 'used':
      return { revokedAt: null, type: PassType.one_time, usedAt: { not: null } };
    case 'expired':
      return { revokedAt: null, validUntil: { lt: now }, ...notUsedOneTime };
    case 'active':
      return { revokedAt: null, validUntil: { gte: now }, ...notUsedOneTime };
  }
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
