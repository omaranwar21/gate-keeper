import type { CSSProperties } from "react";

// Shared visual constants for recharts-based dashboard charts, so every
// chart reads as one system and stays theme-aware (light/dark) by pointing
// at the app's CSS custom properties instead of hardcoded colors.

export const chartGridColor = "var(--border)";
export const chartAxisColor = "var(--muted-foreground)";

export const chartTickStyle = { fill: chartAxisColor, fontSize: 11 };

export const chartTooltipContentStyle: CSSProperties = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  fontSize: "0.75rem",
  padding: "0.5rem 0.75rem",
};

export const chartLegendStyle: CSSProperties = {
  fontSize: 12,
  color: chartAxisColor,
};
