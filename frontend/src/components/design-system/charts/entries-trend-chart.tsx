"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import type { EntriesTrendPoint } from "@/lib/api/endpoints";
import { chartGridColor, chartLegendStyle, chartTickStyle, chartTooltipContentStyle } from "../chart-theme";

function formatChartDate(dateStr: string, locale: string) {
  // dateStr is a plain "YYYY-MM-DD" calendar date, not an instant — format
  // in UTC so no local-timezone shift can move it to an adjacent day.
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(dateStr),
  );
}

export function EntriesTrendChart({ data, locale }: { data: EntriesTrendPoint[]; locale: string }) {
  const t = useTranslations("admin.dashboard");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="entriesTrendAllowed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--allow)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--allow)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="entriesTrendDenied" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--deny)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--deny)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartGridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(value: string) => formatChartDate(value, locale)}
          tick={chartTickStyle}
          axisLine={{ stroke: chartGridColor }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis allowDecimals={false} tick={chartTickStyle} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={chartTooltipContentStyle}
          labelFormatter={(value) => formatChartDate(String(value), locale)}
        />
        <Legend wrapperStyle={chartLegendStyle} />
        <Area
          type="monotone"
          dataKey="allowed"
          name={t("allowed")}
          stroke="var(--allow)"
          fill="url(#entriesTrendAllowed)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="denied"
          name={t("denied")}
          stroke="var(--deny)"
          fill="url(#entriesTrendDenied)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
