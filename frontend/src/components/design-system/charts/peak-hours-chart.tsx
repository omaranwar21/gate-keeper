"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PeakHourCount } from "@/lib/api/endpoints";
import { chartGridColor, chartTickStyle, chartTooltipContentStyle } from "../chart-theme";

function formatHour(hour: number) {
  return `${hour}:00`;
}

export function PeakHoursChart({ data }: { data: PeakHourCount[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke={chartGridColor} vertical={false} />
        <XAxis
          dataKey="hour"
          tickFormatter={formatHour}
          tick={chartTickStyle}
          axisLine={{ stroke: chartGridColor }}
          tickLine={false}
          interval={2}
        />
        <YAxis allowDecimals={false} tick={chartTickStyle} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          contentStyle={chartTooltipContentStyle}
          labelFormatter={(value) => formatHour(Number(value))}
          cursor={{ fill: "var(--muted)" }}
        />
        <Bar dataKey="count" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
