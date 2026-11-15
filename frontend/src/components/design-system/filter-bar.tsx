"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/design-system/date-picker";

export type FilterConfig =
  | { key: string; type: "select"; label: string; options: { value: string; label: string }[] }
  | { key: string; type: "date" };

export function FilterBar({
  filters,
  values,
  onChange,
}: {
  filters: FilterConfig[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
}) {
  const t = useTranslations("common");
  const hasActive = filters.some((filter) => Boolean(values[filter.key]));

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => {
        if (filter.type === "select") {
          return (
            <div key={filter.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{filter.label}</label>
              <Select
                value={values[filter.key] ?? "__all"}
                onValueChange={(value) => onChange(filter.key, value === "__all" ? undefined : value)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">{t("all")}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <div key={filter.key} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">{t("date")}</label>
            <DatePicker
              className="w-44"
              value={values[filter.key]}
              onChange={(value) => onChange(filter.key, value)}
              placeholder={t("date")}
            />
          </div>
        );
      })}

      {hasActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => filters.forEach((filter) => onChange(filter.key, undefined))}
        >
          <X className="size-3.5" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
