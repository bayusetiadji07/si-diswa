import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";
import { CheckCircle2, Clock, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PelanggaranSayaPage() {
  const profile = await requireRole(["siswa"]);
  const supabase = await createClient();

  const [{ data: logs }, { data: tah }] = await Promise.all([
    supabase
      .from("log_pelanggaran")
      .select(
        "id, status, tanggal, catatan, langkah_pembinaan, tahap_ids, bukti_url, peraturan(nama_pelanggaran, kategori, bobot_poin)"
      )
      .eq("siswa_id", profile.id)
      .order("tanggal", { ascending: false }),
    supabase.from("tahap_pembinaan").select("id, nama"),
  ]);

  const rows = (logs ?? []) as any[];
  const tahapMap: Record<number, string> = {};
  (tah ?? []).forEach((t: any) => (tahapMap[t.id] = t.nama));
  const total = rows.reduce((s, r) => s + (r.peraturan?.bobot_poin ?? 0), 0);

  // Cumulative point trend (oldest -> newest)
  const chrono = [...rows].reverse();
  let running = 0;
  const trend = chrono.map((r) => {
    running += r.peraturan?.bobot_poin ?? 0;
    return { date: r.tanggal as string, value: running };
  });
  const maxTrend = Math.max(1, ...trend.map((t) => t.value));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pelanggaran Saya</h2>
        <p className="text-[var(--text-2)]">
          Riwayat lengkap catatan kedisiplinan dan tren akumulasi poin Anda.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl grid place-items-center bg-rose-50 text-rose-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">{total}</p>
            <p className="text-xs text-[var(--text-2)]">Akumulasi Poin</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl grid place-items-center bg-amber-50 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">
              {rows.filter((r) => r.status === "proses").length}
            </p>
            <p className="text-xs text-[var(--text-2)]">Sedang Diproses</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl grid place-items-center bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-tight">
              {rows.filter((r) => r.status === "selesai").length}
            </p>
            <p className="text-xs text-[var(--text-2)]">Selesai Dibina</p>
          </div>
        </div>
      </div>

      {/* Point trend */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">Tren Akumulasi Poin</h3>
        {trend.length === 0 ? (
          <p className="text-[var(--text-3)] text-sm py-8 text-center">
            Belum ada data untuk ditampilkan.
          </p>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="text-[10px] text-[var(--text-3)] opacity-0 group-hover:opacity-100">
                  {t.value}
                </div>
                <div
                  className="w-full bg-[var(--color-brand)] rounded-t-md transition-all"
                  style={{ height: `${(t.value / maxTrend) * 100}%`, minHeight: "4px" }}
                  title={`${t.value} poin`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail list */}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <div className="card p-12 text-center text-[var(--text-3)]">
            Belum ada catatan pelanggaran. Pertahankan kedisiplinanmu! 🎉
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{r.peraturan?.nama_pelanggaran ?? "—"}</p>
                  <p className="text-xs text-[var(--text-3)]">
                    {r.peraturan?.kategori ?? "—"} · {fmtDateTime(r.tanggal)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 font-bold">+{r.peraturan?.bobot_poin ?? 0} poin</span>
                  <span className={`badge ${r.status === "selesai" ? "badge-selesai" : "badge-proses"}`}>
                    {r.status === "selesai" ? "Selesai" : "Proses"}
                  </span>
                </div>
              </div>
              {r.catatan && (
                <p className="mt-3 text-sm text-[var(--text-2)]">
                  <span className="font-medium text-[var(--text)]">Kronologi: </span>
                  {r.catatan}
                </p>
              )}
              {r.tahap_ids && r.tahap_ids.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm font-medium text-[var(--text)]">Tahap Pembinaan: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.tahap_ids.map((id: number) => (
                      <span key={id} className="badge bg-indigo-50 text-indigo-700">
                        {tahapMap[id] ?? `#${id}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {r.langkah_pembinaan && (
                <p className="mt-2 text-sm text-[var(--text-2)]">
                  <span className="font-medium text-[var(--text)]">Catatan: </span>
                  {r.langkah_pembinaan}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
