"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { arEG, enUS } from "date-fns/locale";
import { format, isAfter, isBefore, isValid, parseISO, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DATE_FNS_LOCALES = { en: enUS, ar: arEG };

/** A calendar-popover date picker, taking/returning plain "YYYY-MM-DD" strings
 * (no timezone conversion — these are calendar dates, not instants). */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  value?: string;
  onChange: (value: string | undefined) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const dateFnsLocale = DATE_FNS_LOCALES[locale as keyof typeof DATE_FNS_LOCALES] ?? enUS;

  const selected = value ? parseISO(value) : undefined;
  const minDate = min ? startOfDay(parseISO(min)) : undefined;
  const maxDate = max ? startOfDay(parseISO(max)) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !(selected && isValid(selected)) && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {selected && isValid(selected) ? format(selected, "PP", { locale: dateFnsLocale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : undefined);
            setOpen(false);
          }}
          disabled={(date) =>
            (minDate ? isBefore(date, minDate) : false) || (maxDate ? isAfter(date, maxDate) : false)
          }
          locale={dateFnsLocale}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
