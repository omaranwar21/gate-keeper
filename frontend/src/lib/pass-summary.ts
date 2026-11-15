import { formatCairoDate, formatCairoDateTime, minutesToTimeString } from "@/lib/dates";
import type { GuestPass } from "@/types/api";

export function passWindowSummary(
  pass: Pick<GuestPass, "type" | "validFrom" | "validUntil" | "daysOfWeek" | "dailyStartMin" | "dailyEndMin">,
  locale: string,
  dayLabels: string[],
): string {
  if (pass.type === "one_time") {
    return formatCairoDateTime(pass.validFrom, locale);
  }

  const days = pass.daysOfWeek.map((day) => dayLabels[day]).join(", ");
  const start = pass.dailyStartMin !== null ? minutesToTimeString(pass.dailyStartMin) : "";
  const end = pass.dailyEndMin !== null ? minutesToTimeString(pass.dailyEndMin) : "";
  const until = formatCairoDate(pass.validUntil, locale);

  return `${days} · ${start}–${end} · ${until}`;
}
