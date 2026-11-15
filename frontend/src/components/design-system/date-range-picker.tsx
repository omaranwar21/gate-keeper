"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { arEG, enUS } from "date-fns/locale";
import { format, isValid, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_FNS_LOCALES = { en: enUS, ar: arEG };

function toRangeValue(range: DateRange | undefined): { from?: string; to?: string } {
  return {
    from: range?.from && isValid(range.from) ? format(range.from, "yyyy-MM-dd") : undefined,
    to: range?.to && isValid(range.to) ? format(range.to, "yyyy-MM-dd") : undefined,
  };
}

/** A calendar-popover date-range picker: click one day for the start
 * boundary, then another for the end boundary. The selection is a local
 * draft while the popover is open — onChange only fires once the range is
 * final, either because the popover closes or because a day was
 * double-clicked (picking that single day as both boundaries).
 * Takes/returns plain "YYYY-MM-DD" strings (no timezone conversion —
 * calendar dates, not instants). */
export function DateRangePicker({
  from,
  to,
  onChange,
  placeholder,
  className,
}: {
  from?: string;
  to?: string;
  onChange: (range: { from?: string; to?: string }) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;

  const fromDate = from ? parseISO(from) : undefined;
  const toDate = to ? parseISO(to) : undefined;
  const committed: DateRange | undefined = fromDate ? { from: fromDate, to: toDate } : undefined;

  const [draft, setDraft] = useState<DateRange | undefined>(committed);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft(committed);
    } else {
      onChange(toRangeValue(draft));
    }
    setOpen(nextOpen);
  }

  function handleDayClick(day: Date, _modifiers: unknown, event: React.MouseEvent) {
    // event.detail is the native click count on this target — 2+ means a
    // double-click, which commits that single day as the whole range.
    if (event.detail < 2) return;
    const range: DateRange = { from: day, to: day };
    setDraft(range);
    onChange(toRangeValue(range));
    setOpen(false);
  }

  const label =
    fromDate && isValid(fromDate)
      ? toDate && isValid(toDate)
        ? `${format(fromDate, "PP", { locale: dateFnsLocale })} – ${format(toDate, "PP", { locale: dateFnsLocale })}`
        : format(fromDate, "PP", { locale: dateFnsLocale })
      : undefined;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-start gap-2 font-normal", !label && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">{label ?? placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={draft}
          defaultMonth={draft?.from ?? fromDate}
          onSelect={setDraft}
          onDayClick={handleDayClick}
          locale={dateFnsLocale}
          numberOfMonths={2}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
