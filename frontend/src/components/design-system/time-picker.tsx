"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ["AM", "PM"] as const;
type Period = (typeof PERIODS)[number];

function parseValue(value: string | undefined): { hour: number; minute: number; period: Period } | undefined {
  if (!value) return undefined;
  const [h, m] = value.split(":").map(Number);
  const period: Period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour, minute: m, period };
}

function toValue(hour: number, minute: number, period: Period): string {
  const hour24 = period === "PM" ? (hour % 12) + 12 : hour % 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Locale-aware AM/PM label (e.g. "ص"/"م" in Arabic), keyed off our internal
 * English "AM"/"PM" — the value itself always stays a plain "HH:mm" string. */
function periodLabel(period: Period, locale: string): string {
  const probeHour = period === "AM" ? 9 : 21;
  const parts = new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true }).formatToParts(
    new Date(2000, 0, 1, probeHour, 0),
  );
  return parts.find((part) => part.type === "dayPeriod")?.value ?? period;
}

function Column<T extends string | number>({
  items,
  selected,
  format,
  onSelect,
}: {
  items: readonly T[];
  selected: T | undefined;
  format: (item: T) => string;
  onSelect: (item: T) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "center" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <ScrollArea className="h-56 w-16">
      <div ref={listRef} className="flex flex-col gap-0.5 p-1">
        {items.map((item) => (
          <button
            key={String(item)}
            type="button"
            data-selected={item === selected}
            onClick={() => onSelect(item)}
            className={cn(
              "rounded-md px-2 py-1.5 text-center text-sm text-foreground hover:bg-muted",
              item === selected && "bg-primary text-primary-foreground hover:bg-primary",
            )}
          >
            {format(item)}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

/** A time picker with three independently-scrollable wheels — hour,
 * minute, AM/PM — rather than one long flat list. Takes/returns a plain
 * 24-hour "HH:mm" string, same as before; AM/PM is purely a display/input
 * convenience. */
export function TimePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  value?: string; // "HH:mm"
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const parsed = parseValue(value);

  function update(partial: Partial<{ hour: number; minute: number; period: Period }>) {
    const base = parsed ?? { hour: 12, minute: 0, period: "AM" as Period };
    const next = { ...base, ...partial };
    onChange(toValue(next.hour, next.minute, next.period));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn("w-full justify-start gap-2 font-normal", !parsed && "text-muted-foreground", className)}
        >
          <ClockIcon className="size-4 shrink-0" />
          <span dir="ltr">
            {parsed
              ? `${parsed.hour}:${String(parsed.minute).padStart(2, "0")} ${periodLabel(parsed.period, locale)}`
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1" align="start">
        <div dir="ltr" className="flex divide-x divide-border">
          <Column items={HOURS} selected={parsed?.hour} format={(hour) => String(hour)} onSelect={(hour) => update({ hour })} />
          <Column
            items={MINUTES}
            selected={parsed?.minute}
            format={(minute) => String(minute).padStart(2, "0")}
            onSelect={(minute) => update({ minute })}
          />
          <Column
            items={PERIODS}
            selected={parsed?.period}
            format={(period) => periodLabel(period, locale)}
            onSelect={(period) => update({ period })}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
