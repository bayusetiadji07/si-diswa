"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, BookMarked, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Peraturan, TahapPembinaan } from "@/lib/types";
import Modal from "@/components/Modal";

const empty = { nama_pelanggaran: "", kategori: "", bobot_poin: 0 };

export default function PeraturanManager() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Peraturan[]>([]);
  const [tahapList, setTahapList] = useState<TahapPembinaan[]>([]);
  // peraturan_id -> tahap_id[]
  const [mapping, setMapping] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Peraturan | null>(null);
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<Peraturan | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const [{ data: per, error: e1 }, { data: tah }, { data: map }] = await Promise.all([
      supabase
        .from("peraturan")
        .select("*")
        .order("kategori", { ascending: true })
        .order("nama_pelanggaran", { ascending: true }),
      supabase.from("tahap_pembinaan").select("*").order("urutan"),
      supabase.from("peraturan_pembinaan").select("peraturan_id, tahap_id"),
    ]);
    if (e1) setError(e1.message);
    setRows((per ?? []) as Peraturan[]);
    setTahapList((tah ?? []) as TahapPembinaan[]);
    const m: Record<number, number[]> = {};
    (map ?? []).forEach((r: any) => {
      (m[r.peraturan_id] ??= []).push(r.tahap_id);
    });
    setMapping(m);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter(
    (r) =>
      r.nama_pelanggaran.toLowerCase().includes(q.toLowerCase()) ||
      (r.kategori ?? "").toLowerCase().includes(q.toLowerCase())
  );

  function openAdd() {
    setEditing(null);
    setForm(empty);
    setSelected(new Set());
    setError(null);
    setFormOpen(true);
  }
  function openEdit(r: Peraturan) {
    setEditing(r);
    setForm({
      nama_pelanggaran: r.nama_pelanggaran,
      kategori: r.kategori ?? "",
      bobot_poin: r.bobot_poin,
    });
    setSelected(new Set(mapping[r.id] ?? []));
    setError(null);
    setFormOpen(true);
  }

  function toggleTahap(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /** Sync the peraturan_pembinaan pivot for a given peraturan id. */
  async function syncMapping(peraturanId: number) {
    const current = mapping[peraturanId] ?? [];
    const want = Array.from(selected);
    const toAdd = want.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !want.includes(id));
    if (toRemove.length) {
      await supabase
        .from("peraturan_pembinaan")
        .delete()
        .eq("peraturan_id", peraturanId)
        .in("tahap_id", toRemove);
    }
    if (toAdd.length) {
      await supabase
        .from("peraturan_pembinaan")
        .insert(toAdd.map((tahap_id) => ({ peraturan_id: peraturanId, tahap_id })));
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      nama_pelanggaran: form.nama_pelanggaran.trim(),
      kategori: form.kategori.trim() || null,
      bobot_poin: Number(form.bobot_poin) || 0,
    };
    try {
      let peraturanId: number;
      if (editing) {
        const { error } = await supabase.from("peraturan").update(payload).eq("id", editing.id);
        if (error) throw error;
        peraturanId = editing.id;
      } else {
        const { data, error } = await supabase
          .from("peraturan")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        peraturanId = data.id;
      }
      await syncMapping(peraturanId);
      setFormOpen(false);
      load();
    } catch (err: any) {
      setError(err?.message ?? "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("peraturan").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) return setError(error.message);
    setToDelete(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Master Peraturan</h2>
          <p className="text-[var(--text-2)]">
            Kelola daftar pelanggaran, bobot poin, dan pilihan tahap pembinaannya.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Tambah Peraturan
        </button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[var(--border)]">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              className="input pl-9"
              placeholder="Cari pelanggaran atau kategori…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
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
            <BookMarked className="h-6 w-6" />
            <p>Tidak ada data peraturan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Pelanggaran</th>
                  <th>Kategori</th>
                  <th>Bobot Poin</th>
                  <th>Pilihan Pembinaan</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.nama_pelanggaran}</td>
                    <td>
                      <span className="badge bg-slate-100 text-slate-700">
                        {r.kategori ?? "—"}
                      </span>
                    </td>
                    <td className="font-semibold text-rose-600">{r.bobot_poin}</td>
                    <td>
                      <span className="badge bg-indigo-50 text-indigo-700">
                        {(mapping[r.id]?.length ?? 0)} tahap
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-600"
                          onClick={() => setToDelete(r)}
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

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Peraturan" : "Tambah Peraturan"}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nama Pelanggaran</label>
            <input
              className="input"
              value={form.nama_pelanggaran}
              onChange={(e) => setForm({ ...form, nama_pelanggaran: e.target.value })}
              required
              placeholder="cth. Terlambat masuk sekolah"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kategori</label>
              <input
                className="input"
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                placeholder="cth. C. Masuk Sekolah"
              />
            </div>
            <div>
              <label className="label">Bobot Poin</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.bobot_poin}
                onChange={(e) => setForm({ ...form, bobot_poin: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">
              Pilihan Tahap Pembinaan{" "}
              <span className="text-[var(--text-3)] font-normal">({selected.size} dipilih)</span>
            </label>
            <div className="max-h-56 overflow-y-auto border border-[var(--border)] rounded-lg p-2 space-y-1">
              {tahapList.length === 0 ? (
                <p className="text-sm text-[var(--text-3)] p-2">
                  Belum ada master tahap pembinaan.
                </p>
              ) : (
                tahapList.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={selected.has(t.id)}
                      onChange={() => toggleTahap(t.id)}
                    />
                    <span className="text-sm">{t.nama}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Simpan Perubahan" : "Tambah"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Hapus Peraturan" maxWidth="max-w-md">
        <p className="text-[var(--text-2)]">
          Yakin ingin menghapus{" "}
          <strong className="text-[var(--text)]">{toDelete?.nama_pelanggaran}</strong>? Tindakan
          ini tidak dapat dibatalkan.
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
    </div>
  );
}
