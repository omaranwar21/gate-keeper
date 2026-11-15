import { PassType } from '../generated/prisma/enums';
import { cairoDateKey, cairoLocalMinutes } from '../shared/utils/cairo-time';

export interface PassOccurrenceInput {
  type: PassType;
  validFrom: Date;
  validUntil: Date;
  // Recurring only; ignored for one-time passes.
  daysOfWeek: number[];
}

const DAY_MS = 24 * 60 * 60_000;

/** The Cairo-local calendar days a pass actually occupies. A one-time pass
 * occupies exactly the day of validFrom (the app always creates one-time
 * passes with validFrom/validUntil on the same Cairo day). A recurring pass
 * occupies every matching weekday between validFrom and validUntil — both
 * of which the app always sets to Cairo-local midnight, so stepping by
 * exactly 24h lands on each subsequent Cairo midnight. */
export function passOccurrenceDays(pass: PassOccurrenceInput): Set<string> {
  if (pass.type === PassType.one_time) {
    return new Set([cairoDateKey(pass.validFrom)]);
  }

  const days = new Set<string>();
  for (let t = pass.validFrom.getTime(); t < pass.validUntil.getTime(); t += DAY_MS) {
    const instant = new Date(t);
    if (pass.daysOfWeek.includes(cairoLocalMinutes(instant).weekday)) {
      days.add(cairoDateKey(instant));
    }
  }
  return days;
}

/** The first Cairo-local day (if any) where adding `candidate` to a unit
 * that already has `existing` (its other non-revoked passes) would push
 * that day's count of active passes past `limit`. Returns undefined when
 * every day stays within the limit. */
export function findDayOverLimit(
  candidate: PassOccurrenceInput,
  existing: PassOccurrenceInput[],
  limit: number,
): string | undefined {
  const candidateDays = passOccurrenceDays(candidate);
  const countsByDay = new Map<string, number>();
  for (const pass of existing) {
    for (const day of passOccurrenceDays(pass)) {
      if (candidateDays.has(day)) {
        countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1);
      }
    }
  }

  for (const day of candidateDays) {
    if ((countsByDay.get(day) ?? 0) + 1 > limit) {
      return day;
    }
  }
  return undefined;
}
