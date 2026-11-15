import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success-muted text-success border-success/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  danger: "bg-danger-muted text-danger border-danger/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", {
          "bg-success": tone === "success",
          "bg-warning": tone === "warning",
          "bg-danger": tone === "danger",
          "bg-muted-foreground": tone === "neutral",
        })}
      />
      {children}
    </span>
  );
}
