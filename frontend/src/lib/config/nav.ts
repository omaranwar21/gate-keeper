import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Building2, DoorOpen, ScrollText, Ticket, ScanLine } from "lucide-react";
import type { Role } from "@/types/api";

export interface NavItem {
  href: string;
  labelKey: string;
  icon: LucideIcon;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/admin/buildings", labelKey: "buildings", icon: Building2 },
    { href: "/admin/units", labelKey: "units", icon: DoorOpen },
    { href: "/admin/access-log", labelKey: "accessLog", icon: ScrollText },
  ],
  resident: [{ href: "/resident/passes", labelKey: "myPasses", icon: Ticket }],
  guard: [{ href: "/guard/scan", labelKey: "scan", icon: ScanLine }],
};
