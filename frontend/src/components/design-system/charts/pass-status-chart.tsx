"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useTranslations } from "next-intl";
import type { PassStatusCount } from "@/lib/api/endpoints";
import { passStatusTone, toneColorVar } from "@/lib/status";
import { chartLegendStyle, chartTooltipContentStyle } from "../chart-theme";

export function PassStatusChart({ data }: { data: PassStatusCount[] }) {
  const t = useTranslations("passes");
  const chartData = data.map((entry) => ({ ...entry, label: t(`status.${entry.status}`) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} dataKey="count" nameKey="label" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={toneColorVar(passStatusTone(entry.status))} />
          ))}
        </Pie>
        <Tooltip contentStyle={chartTooltipContentStyle} />
        <Legend wrapperStyle={chartLegendStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
