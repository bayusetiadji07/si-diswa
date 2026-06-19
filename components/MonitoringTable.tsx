"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, Loader2, CheckCircle2, Clock, ImageIcon, ClipboardList, Printer, Pencil, Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Lightbox from "@/components/Lightbox";
import Modal from "@/components/Modal";
import { fmtDateTime } from "@/lib/format";
import type { Peraturan, TahapPembinaan } from "@/lib/types";

interface Row {
  id: number;
  tanggal: string | null;
  peraturan_id: number | null;
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
  const [tahapList, setTahapList] = useState<TahapPembinaan[]>([]);
  const [peraturanList, setPeraturanList] = useState<Peraturan[]>([]);
  const [mapping, setMapping] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "proses" | "selesai">("all");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // edit
  const [editing, setEditing] = useState<Row | null>(null);
  const [eform, setEform] = useState({
    peraturan_id: "" as number | "",
    status: "proses" as "proses" | "selesai",
    catatan: "",
    langkah_pembinaan: "",
  });
  const [eTahap, setETahap] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  // delete
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data, error }, { data: tah }, { data: per }, { data: map }] = await Promise.all([
      supabase
        .from("log_pelanggaran")
        .select(
          "id, tanggal, peraturan_id, catatan, langkah_pembinaan, tahap_ids, bukti_url, status, siswa:siswa_id(nama, kelas), peraturan(nama_pelanggaran, bobot_poin), guru:guru_id(nama)"
        )
        .order("tanggal", { ascending: false }),
      supabase.from("tahap_pembinaan").select("*").order("urutan"),
      supabase.from("peraturan").select("*").order("kategori").order("nama_pelanggaran"),
      supabase.from("peraturan_pembinaan").select("peraturan_id, tahap_id"),
    ]);
    if (error) setError(error.message);
    setRows((data ?? []) as any);
    const tl = (tah ?? []) as TahapPembinaan[];
    setTahapList(tl);
    const m: Record<number, string> = {};
    tl.forEach((t) => (m[t.id] = t.nama));
    setTahapMap(m);
    setPeraturanList((per ?? []) as Peraturan[]);
    const mp: Record<number, number[]> = {};
    (map ?? []).forEach((r: any) => {
      (mp[r.peraturan_id] ??= []).push(r.tahap_id);
    });
    setMapping(mp);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleStatus(r: Row) {
    setBusyId(r.id);
    const next = r.status === "proses" ? "selesai" : "proses";
    const { error } = await supabase.from("log_pelanggaran").update({ status: next }).eq("id", r.id);
    setBusyId(null);
    if (error) return setError(error.message);
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
  }

  function openEdit(r: Row) {
    setEditing(r);
    setEform({
      peraturan_id: r.peraturan_id ?? "",
      status: r.status,
      catatan: r.catatan ?? "",
      langkah_pembinaan: r.langkah_pembinaan ?? "",
    });
    setETahap(new Set(r.tahap_ids ?? []));
    setError(null);
  }

  function toggleETahap(id: number) {
    setETahap((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("log_pelanggaran")
      .update({
        peraturan_id: eform.peraturan_id || null,
        status: eform.status,
        catatan: eform.catatan.trim() || null,
        langkah_pembinaan: eform.langkah_pembinaan.trim() || null,
        tahap_ids: Array.from(eTahap),
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) return setError(error.message);
    setEditing(null);
    load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setError(null);
    // hapus bukti dari storage (best-effort)
    if (toDelete.bukti_url) {
      const marker = "/bukti-pelanggaran/";
      const idx = toDelete.bukti_url.indexOf(marker);
      if (idx >= 0) {
        const path = decodeURIComponent(toDelete.bukti_url.slice(idx + marker.length));
        await supabase.storage.from("bukti-pelanggaran").remove([path]);
      }
    }
    const { error } = await supabase.from("log_pelanggaran").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) return setError(error.message);
    setToDelete(null);
    load();
  }

  const filtered = rows.filter((r) => {
    const matchesQ =
      !q ||
      (r.siswa?.nama ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.siswa?.kelas ?? "").toLowerCase().includes(q.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesQ && matchesStatus;
  });

  // opsi tahap utk pelanggaran terpilih di form edit (gabung dgn yang sudah terpilih)
  const editTahapOptions = (() => {
    const ids = new Set<number>([
      ...(eform.peraturan_id ? mapping[eform.peraturan_id] ?? [] : []),
      ...Array.from(eTahap),
    ]);
    return tahapList.filter((t) => ids.has(t.id));
  })();

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
                  <th className="text-right">Aksi</th>
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
                            loading="lazy"
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
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/surat/${r.id}`}
                          className="btn btn-ghost btn-sm"
                          title="Cetak surat resmi"
                        >
                          <Printer className="h-4 w-4" />
                        </Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(r)}
                          title="Edit pelanggaran"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-600"
                          onClick={() => setToDelete(r)}
                          title="Hapus pelanggaran"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Pelanggaran">
        {editing && (
          <form onSubmit={saveEdit} className="space-y-4">
            <p className="text-sm text-[var(--text-2)]">
              Siswa: <strong className="text-[var(--text)]">{editing.siswa?.nama}</strong>{" "}
              ({editing.siswa?.kelas ?? "-"})
            </p>
            <div>
              <label className="label">Jenis Pelanggaran</label>
              <select
                className="select"
                value={eform.peraturan_id}
                onChange={(e) => setEform({ ...eform, peraturan_id: e.target.value ? Number(e.target.value) : "" })}
                required
              >
                <option value="">— Pilih pelanggaran —</option>
                {peraturanList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.kategori ? `[${p.kategori}] ` : ""}{p.nama_pelanggaran} ({p.bobot_poin} poin)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={eform.status}
                onChange={(e) => setEform({ ...eform, status: e.target.value as any })}
              >
                <option value="proses">Proses</option>
                <option value="selesai">Selesai</option>
              </select>
            </div>
            {editTahapOptions.length > 0 && (
              <div>
                <label className="label">Tahap Pembinaan</label>
                <div className="grid sm:grid-cols-2 gap-1 border border-[var(--border)] rounded-lg p-2 max-h-44 overflow-y-auto">
                  {editTahapOptions.map((t) => (
                    <label key={t.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={eTahap.has(t.id)}
                        onChange={() => toggleETahap(t.id)}
                      />
                      <span className="text-sm">{t.nama}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="label">Kronologi (Catatan)</label>
              <textarea
                className="textarea"
                rows={2}
                value={eform.catatan}
                onChange={(e) => setEform({ ...eform, catatan: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Catatan Pembinaan Tambahan</label>
              <textarea
                className="textarea"
                rows={2}
                value={eform.langkah_pembinaan}
                onChange={(e) => setEform({ ...eform, langkah_pembinaan: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Hapus Pelanggaran" maxWidth="max-w-md">
        <p className="text-[var(--text-2)]">
          Yakin menghapus pelanggaran{" "}
          <strong className="text-[var(--text)]">{toDelete?.peraturan?.nama_pelanggaran}</strong> oleh{" "}
          <strong className="text-[var(--text)]">{toDelete?.siswa?.nama}</strong>? Bukti foto juga
          ikut terhapus dan tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-2 pt-5">
          <button className="btn btn-ghost" onClick={() => setToDelete(null)}>
            Batal
          </button>
          <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Hapus
          </button>
        </div>
      </Modal>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
