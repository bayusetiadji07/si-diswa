import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  FilePlus2,
  ClipboardList,
} from "lucide-react";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  // ---------------- Siswa view ----------------
  if (profile.role === "siswa") {
    const { data: logs } = await supabase
      .from("log_pelanggaran")
      .select("id, status, tanggal, peraturan(nama_pelanggaran, bobot_poin)")
      .eq("siswa_id", profile.id)
      .order("tanggal", { ascending: false });

    const rows = (logs ?? []) as any[];
    const total = rows.reduce((s, r) => s + (r.peraturan?.bobot_poin ?? 0), 0);
    const proses = rows.filter((r) => r.status === "proses").length;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Halo, {profile.nama} 👋</h2>
          <p className="text-[var(--text-2)]">
            Ringkasan poin dan catatan kedisiplinan Anda.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Stat icon={<TrendingUp className="h-5 w-5" />} label="Total Poin Pelanggaran" value={total} tone="rose" />
          <Stat icon={<ClipboardList className="h-5 w-5" />} label="Total Kasus" value={rows.length} tone="indigo" />
          <Stat icon={<Clock className="h-5 w-5" />} label="Sedang Diproses" value={proses} tone="amber" />
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold">Pelanggaran Terbaru</h3>
            <Link href="/dashboard/saya" className="text-sm text-[var(--color-brand)] font-medium">
              Lihat semua
            </Link>
          </div>
          {rows.length === 0 ? (
            <EmptyState text="Belum ada catatan pelanggaran. Pertahankan! 🎉" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Pelanggaran</th>
                    <th>Poin</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.tanggal)}</td>
                      <td>{r.peraturan?.nama_pelanggaran ?? "—"}</td>
                      <td className="font-semibold text-rose-600">{r.peraturan?.bobot_poin ?? 0}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------- Staff view (guru/bk/admin) ----------------
  const [totalLogRes, logsRes, totalSiswaRes, prosesRes, selesaiRes] =
    await Promise.all([
      supabase.from("log_pelanggaran").select("id", { count: "exact", head: true }),
      supabase
        .from("log_pelanggaran")
        .select("id, status, tanggal, siswa:siswa_id(nama, kelas), peraturan(nama_pelanggaran, bobot_poin)")
        .order("tanggal", { ascending: false })
        .limit(6),
      supabase.from("profil_users").select("id", { count: "exact", head: true }).eq("role", "siswa"),
      supabase.from("log_pelanggaran").select("id", { count: "exact", head: true }).eq("status", "proses"),
      supabase.from("log_pelanggaran").select("id", { count: "exact", head: true }).eq("status", "selesai"),
    ]);

  const rows = (logsRes.data ?? []) as any[];
  const role = profile.role as Role;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Selamat datang, {profile.nama}</h2>
          <p className="text-[var(--text-2)]">
            Anda masuk sebagai <strong>{ROLE_LABEL[role]}</strong>.
          </p>
        </div>
        {(role === "guru" || role === "bk") && (
          <Link href="/dashboard/catat" className="btn btn-primary">
            <FilePlus2 className="h-4 w-4" />
            Catat Pelanggaran
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={<ClipboardList className="h-5 w-5" />} label="Total Kasus" value={totalLogRes.count ?? 0} tone="indigo" />
        <Stat icon={<Clock className="h-5 w-5" />} label="Diproses" value={prosesRes.count ?? 0} tone="amber" />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Selesai" value={selesaiRes.count ?? 0} tone="green" />
        <Stat icon={<Users className="h-5 w-5" />} label="Total Siswa" value={totalSiswaRes.count ?? 0} tone="rose" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="font-semibold">Kasus Terbaru</h3>
          {(role === "bk" || role === "admin") && (
            <Link href="/dashboard/pelanggaran" className="text-sm text-[var(--color-brand)] font-medium">
              Buka monitoring
            </Link>
          )}
        </div>
        {rows.length === 0 ? (
          <EmptyState text="Belum ada pelanggaran tercatat." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Siswa</th>
                  <th>Kelas</th>
                  <th>Pelanggaran</th>
                  <th>Poin</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.tanggal)}</td>
                    <td>{r.siswa?.nama ?? "—"}</td>
                    <td>{r.siswa?.kelas ?? "—"}</td>
                    <td>{r.peraturan?.nama_pelanggaran ?? "—"}</td>
                    <td className="font-semibold text-rose-600">{r.peraturan?.bobot_poin ?? 0}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- shared presentational helpers ----------

const toneMap: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
};

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${toneMap[tone]}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-[var(--text-2)]">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${status === "selesai" ? "badge-selesai" : "badge-proses"}`}>
      {status === "selesai" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {status === "selesai" ? "Selesai" : "Proses"}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-12 text-center text-[var(--text-3)] flex flex-col items-center gap-2">
      <AlertTriangle className="h-6 w-6" />
      <p>{text}</p>
    </div>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
