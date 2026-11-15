import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatTileConfig {
  key: string;
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger";
}

export function StatTileGrid({ tiles }: { tiles: StatTileConfig[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map(({ key, ...tile }) => (
        <StatTile key={key} {...tile} />
      ))}
    </div>
  );
}

function StatTile({ label, value, icon: Icon, tone = "default" }: Omit<StatTileConfig, "key">) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,28,48,0.04),0_8px_24px_-16px_rgba(15,28,48,0.25)]">
      <div
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", {
          "bg-primary/10 text-primary": tone === "default",
          "bg-success-muted text-success": tone === "success",
          "bg-danger-muted text-danger": tone === "danger",
        })}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}
