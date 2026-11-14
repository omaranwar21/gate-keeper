import { fromZonedTime, toZonedTime, format } from "date-fns-tz";

export const COMPOUND_TIME_ZONE = "Africa/Cairo";

/** Combines a `YYYY-MM-DD` date and `HH:mm` time, both read as Cairo wall-clock
 * time, into the UTC ISO string the backend expects. */
export function cairoDateTimeToIso(date: string, time: string): string {
  return fromZonedTime(`${date}T${time}:00`, COMPOUND_TIME_ZONE).toISOString();
}

/** Splits a backend UTC ISO timestamp back into Cairo-local `date`/`time`
 * parts, for pre-filling an edit form. */
export function isoToCairoDateTimeParts(iso: string): { date: string; time: string } {
  const zoned = toZonedTime(iso, COMPOUND_TIME_ZONE);
  return {
    date: format(zoned, "yyyy-MM-dd", { timeZone: COMPOUND_TIME_ZONE }),
    time: format(zoned, "HH:mm", { timeZone: COMPOUND_TIME_ZONE }),
  };
}

/** Displays a UTC ISO timestamp in Cairo local time for the given UI locale. */
export function formatCairoDateTime(iso: string, locale: string): string {
  const zoned = toZonedTime(iso, COMPOUND_TIME_ZONE);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: COMPOUND_TIME_ZONE,
  }).format(zoned);
}

export function formatCairoDate(iso: string, locale: string): string {
  const zoned = toZonedTime(iso, COMPOUND_TIME_ZONE);
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: COMPOUND_TIME_ZONE }).format(
    zoned,
  );
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Today's date as `YYYY-MM-DD` in Cairo local time (not the server's TZ). */
export function todayInCairo(): string {
  return format(toZonedTime(new Date(), COMPOUND_TIME_ZONE), "yyyy-MM-dd", {
    timeZone: COMPOUND_TIME_ZONE,
  });
}
