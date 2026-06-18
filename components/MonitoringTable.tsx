"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Loader2, CheckCircle2, Clock, ImageIcon, ClipboardList, Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Lightbox from "@/components/Lightbox";
import { fmtDateTime } from "@/lib/format";

interface Row {
  id: number;
  tanggal: string | null;
  catatan: string | null;
  langkah_pembinaan: string | null;
  tahap_ids: number[] | null;
  bukti_url: string | null;
  status: "proses" | "selesai";
  siswa: { nama: string | null; kelas: string | null } | null;
  peraturan: { nama_pelanggaran: string | null; bobot_poin: number | null } | null;
  guru: { nama: string | null } | null;
}

export default function MonitoringTable() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [tahapMap, setTahapMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "proses" | "selesai">("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: tah }] = await Promise.all([
      supabase
        .from("log_pelanggaran")
        .select(
          "id, tanggal, catatan, langkah_pembinaan, tahap_ids, bukti_url, status, siswa:siswa_id(nama, kelas), peraturan(nama_pelanggaran, bobot_poin), guru:guru_id(nama)"
        )
        .order("tanggal", { ascending: false }),
      supabase.from("tahap_pembinaan").select("id, nama"),
    ]);
    if (error) setError(error.message);
    setRows((data ?? []) as any);
    const m: Record<number, string> = {};
    (tah ?? []).forEach((t: any) => (m[t.id] = t.nama));
    setTahapMap(m);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleStatus(r: Row) {
    setBusyId(r.id);
    const next = r.status === "proses" ? "selesai" : "proses";
    const { error } = await supabase
      .from("log_pelanggaran")
      .update({ status: next })
      .eq("id", r.id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
  }

  const filtered = rows.filter((r) => {
    const matchesQ =
      !q ||
      (r.siswa?.nama ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.siswa?.kelas ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Monitoring Pelanggaran</h2>
        <p className="text-[var(--text-2)]">
          Ruang kerja digital seluruh kasus pelanggaran siswa.
        </p>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              className="input pl-9"
              placeholder="Cari nama siswa atau kelas…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="select max-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Semua Status</option>
            <option value="proses">Proses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        {error && (
          <p className="m-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {loading ? (
          <div className="py-16 grid place-items-center text-[var(--text-3)]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-3)] flex flex-col items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            <p>Tidak ada kasus yang cocok.</p>
          </div>
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
                  <th>Pelapor</th>
                  <th>Pembinaan</th>
                  <th>Bukti</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{fmtDateTime(r.tanggal)}</td>
                    <td className="font-medium">{r.siswa?.nama ?? "—"}</td>
                    <td>{r.siswa?.kelas ?? "—"}</td>
                    <td>{r.peraturan?.nama_pelanggaran ?? "—"}</td>
                    <td className="font-semibold text-rose-600">{r.peraturan?.bobot_poin ?? 0}</td>
                    <td>{r.guru?.nama ?? "—"}</td>
                    <td className="max-w-[260px]">
                      {r.tahap_ids && r.tahap_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.tahap_ids.map((id) => (
                            <span key={id} className="badge bg-indigo-50 text-indigo-700">
                              {tahapMap[id] ?? `#${id}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[var(--text-3)]">—</span>
                      )}
                      {r.langkah_pembinaan && (
                        <p className="text-xs text-[var(--text-2)] mt-1 line-clamp-2">
                          {r.langkah_pembinaan}
                        </p>
                      )}
                    </td>
                    <td>
                      {r.bukti_url ? (
                        <button onClick={() => setLightbox(r.bukti_url)} className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.bukti_url}
                            alt="Bukti"
                            className="h-12 w-12 rounded-lg object-cover border border-[var(--border)] hover:ring-2 hover:ring-[var(--color-brand)]"
                          />
                        </button>
                      ) : (
                        <span className="text-[var(--text-3)] inline-flex">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(r)}
                        disabled={busyId === r.id}
                        className={`badge ${r.status === "selesai" ? "badge-selesai" : "badge-proses"} cursor-pointer`}
                        title="Klik untuk mengubah status"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : r.status === "selesai" ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {r.status === "selesai" ? "Selesai" : "Proses"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
