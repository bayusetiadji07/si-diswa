import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookMarked } from "lucide-react";
import type { Peraturan } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AturanPage() {
  await requireRole(["siswa", "guru", "bk", "admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("peraturan")
    .select("*")
    .order("kategori", { ascending: true })
    .order("bobot_poin", { ascending: false });

  const rows = (data ?? []) as Peraturan[];

  // Kelompokkan per kategori
  const groups = new Map<string, Peraturan[]>();
  rows.forEach((r) => {
    const k = r.kategori ?? "Lainnya";
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Daftar Peraturan Sekolah</h2>
        <p className="text-[var(--text-2)]">
          Jenis pelanggaran dan bobot poin yang berlaku di sekolah. Pahami agar
          terhindar dari pelanggaran.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-3)] flex flex-col items-center gap-2">
          <BookMarked className="h-6 w-6" />
          <p>Belum ada data peraturan.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(groups.entries()).map(([kategori, items]) => (
            <div key={kategori} className="card overflow-hidden">
              <div className="px-5 py-3 bg-[var(--color-brand-light)] border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--color-brand-dark)]">{kategori}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-10">No</th>
                      <th>Jenis Pelanggaran</th>
                      <th className="text-right">Bobot Poin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, i) => (
                      <tr key={r.id}>
                        <td className="text-[var(--text-3)]">{i + 1}</td>
                        <td className="font-medium">{r.nama_pelanggaran}</td>
                        <td className="text-right">
                          <span className="badge bg-rose-50 text-rose-700">{r.bobot_poin}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
