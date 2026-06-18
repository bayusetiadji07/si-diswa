"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TahapPembinaan } from "@/lib/types";
import Modal from "@/components/Modal";

const empty = { nama: "", deskripsi: "", urutan: 100 };

export default function PembinaanManager() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<TahapPembinaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TahapPembinaan | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<TahapPembinaan | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tahap_pembinaan")
      .select("*")
      .order("urutan", { ascending: true });
    if (error) setError(error.message);
    setRows((data ?? []) as TahapPembinaan[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAdd() {
    setEditing(null);
    setForm({ ...empty, urutan: (rows.at(-1)?.urutan ?? 0) + 10 });
    setError(null);
    setFormOpen(true);
  }
  function openEdit(r: TahapPembinaan) {
    setEditing(r);
    setForm({ nama: r.nama, deskripsi: r.deskripsi ?? "", urutan: r.urutan });
    setError(null);
    setFormOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      nama: form.nama.trim(),
      deskripsi: form.deskripsi.trim() || null,
      urutan: Number(form.urutan) || 0,
    };
    const { error } = editing
      ? await supabase.from("tahap_pembinaan").update(payload).eq("id", editing.id)
      : await supabase.from("tahap_pembinaan").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    setFormOpen(false);
    load();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("tahap_pembinaan").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) return setError(error.message);
    setToDelete(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Tahap Pembinaan</h2>
          <p className="text-[var(--text-2)]">
            Daftar master tahapan/sanksi pembinaan. Setiap peraturan dapat memilih
            beberapa tahap ini di menu Master Peraturan.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Tambah Tahap
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="card">
        {loading ? (
          <div className="py-16 grid place-items-center text-[var(--text-3)]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-3)] flex flex-col items-center gap-2">
            <ListChecks className="h-6 w-6" />
            <p>Belum ada tahap pembinaan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-16">Urutan</th>
                  <th>Nama Tahap</th>
                  <th>Deskripsi</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-[var(--text-3)]">{r.urutan}</td>
                    <td className="font-medium">{r.nama}</td>
                    <td className="text-[var(--text-2)] max-w-md">{r.deskripsi ?? "—"}</td>
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Tahap Pembinaan" : "Tambah Tahap Pembinaan"}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nama Tahap</label>
            <input
              className="input"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
              placeholder="cth. Pemanggilan orang tua/wali 1x"
            />
          </div>
          <div>
            <label className="label">Deskripsi</label>
            <textarea
              className="textarea"
              rows={2}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              placeholder="Penjelasan singkat tahap pembinaan…"
            />
          </div>
          <div className="max-w-[140px]">
            <label className="label">Urutan</label>
            <input
              type="number"
              className="input"
              value={form.urutan}
              onChange={(e) => setForm({ ...form, urutan: Number(e.target.value) })}
            />
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

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Hapus Tahap" maxWidth="max-w-md">
        <p className="text-[var(--text-2)]">
          Yakin menghapus <strong className="text-[var(--text)]">{toDelete?.nama}</strong>?
          Tahap ini juga akan dilepas dari semua peraturan yang memakainya.
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
