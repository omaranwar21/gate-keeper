import { Prisma } from '../generated/prisma/client';
import { DenyReason, PassType } from '../generated/prisma/enums';
import { cairoLocalMinutes } from '../shared/utils/cairo-time';

export { cairoLocalMinutes, cairoDayBounds } from '../shared/utils/cairo-time';

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
