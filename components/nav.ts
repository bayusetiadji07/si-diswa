import {
  LayoutDashboard,
  BookMarked,
  FilePlus2,
  ClipboardList,
  BarChart3,
  User,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["siswa", "guru", "bk", "admin"],
  },
  {
    href: "/dashboard/saya",
    label: "Pelanggaran Saya",
    icon: User,
    roles: ["siswa"],
  },
  {
    href: "/dashboard/peraturan",
    label: "Master Peraturan",
    icon: BookMarked,
    roles: ["bk", "admin"],
  },
  {
    href: "/dashboard/pembinaan",
    label: "Tahap Pembinaan",
    icon: ListChecks,
    roles: ["bk", "admin"],
  },
  {
    href: "/dashboard/catat",
    label: "Catat Pelanggaran",
    icon: FilePlus2,
    roles: ["guru", "bk"],
  },
  {
    href: "/dashboard/pelanggaran",
    label: "Monitoring Pelanggaran",
    icon: ClipboardList,
    roles: ["bk", "admin"],
  },
  {
    href: "/dashboard/laporan",
    label: "Laporan",
    icon: BarChart3,
    roles: ["guru", "bk", "admin"],
  },
];

export function navFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((i) => i.roles.includes(role));
}
