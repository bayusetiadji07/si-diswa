"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, X, LogOut } from "lucide-react";
import { navFor } from "@/components/nav";
import { ROLE_LABEL, type ProfilUser } from "@/lib/types";

export default function Shell({
  profile,
  children,
}: {
  profile: ProfilUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navFor(profile.role);

  const initials = (profile.nama ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden no-print"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`app-sidebar no-print fixed lg:static z-40 inset-y-0 left-0 w-64 bg-white border-r border-[var(--border)] flex flex-col transition-transform ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center gap-3 px-5 border-b border-[var(--border)]">
          <div className="h-9 w-9 rounded-lg bg-[var(--color-brand)] grid place-items-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-bold">Si Diswa</p>
            <p className="text-xs text-[var(--text-3)]">Disiplin Siswa</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]"
                    : "text-[var(--text-2)] hover:bg-slate-50"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border)]">
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost w-full" type="submit">
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="app-topbar no-print h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-[var(--text-2)]"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              className="lg:hidden p-2 hidden"
              aria-label="Tutup"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="font-semibold text-[var(--text)]">
              Sistem Disiplin Siswa
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-semibold">{profile.nama}</p>
              <p className="text-xs text-[var(--text-3)]">
                {ROLE_LABEL[profile.role]}
                {profile.kelas ? ` · ${profile.kelas}` : ""}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] grid place-items-center text-sm font-bold">
              {initials}
            </div>
          </div>
        </header>

        <main className="app-main flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
