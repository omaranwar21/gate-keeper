"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export function DayOfWeekPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (days: number[]) => void;
}) {
  const t = useTranslations("passes.days");

  function toggle(day: number) {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  }

  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((day) => {
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => toggle(day)}
            aria-pressed={active}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {t(String(day))}
          </button>
        );
      })}
    </div>
  );
}
