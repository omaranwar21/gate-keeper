"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslations } from "next-intl";
import type { BuildingScanCount } from "@/lib/api/endpoints";
import { chartGridColor, chartLegendStyle, chartTickStyle, chartTooltipContentStyle } from "../chart-theme";

export function ScansByBuildingChart({ data }: { data: BuildingScanCount[] }) {
  const t = useTranslations("admin.dashboard");

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid stroke={chartGridColor} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={chartTickStyle} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="buildingName"
          tick={chartTickStyle}
          axisLine={false}
          tickLine={false}
          width={96}
        />
        <Tooltip contentStyle={chartTooltipContentStyle} cursor={{ fill: "var(--muted)" }} />
        <Legend wrapperStyle={chartLegendStyle} />
        <Bar dataKey="allowed" name={t("allowed")} fill="var(--allow)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="denied" name={t("denied")} fill="var(--deny)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
