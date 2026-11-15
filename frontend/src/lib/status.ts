import type { DenyReason, PassStatus, ScanResult } from "@/types/api";

export type Tone = "success" | "warning" | "danger" | "neutral";

export function passStatusTone(status: PassStatus): Tone {
  switch (status) {
    case "active":
      return "success";
    case "used":
      return "neutral";
    case "expired":
      return "warning";
    case "revoked":
      return "danger";
  }
}

export function scanResultTone(result: ScanResult): Tone {
  return result === "allowed" ? "success" : "danger";
}

export function denyReasonKey(reason: DenyReason | null): string | null {
  return reason;
}

// CSS color for a tone, for contexts that need an actual value (SVG/canvas
// chart fills) rather than a Tailwind class — kept in sync with
// StatusBadge's TONE_CLASSES so charts and badges read as one system.
const TONE_COLOR_VAR: Record<Tone, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  neutral: "var(--muted-foreground)",
};

export function toneColorVar(tone: Tone): string {
  return TONE_COLOR_VAR[tone];
}
