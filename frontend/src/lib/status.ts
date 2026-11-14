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
