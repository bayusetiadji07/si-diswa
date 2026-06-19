"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Search, Users, Loader2, Download, Upload, FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL, type ProfilUser, type Role } from "@/lib/types";
import { buildCSV, downloadCSV, parseCSV } from "@/lib/csv";
import Modal from "@/components/Modal";

const ROLES: Role[] = ["admin", "bk", "guru", "siswa"];
const emptyForm = {
  nama: "",
  email: "",
  password: "",
  role: "siswa" as Role,
  nomor_induk: "",
  kelas: "",
};

export default function PenggunaManager({ currentUserId }: { currentUserId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<ProfilUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProfilUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toDelete, setToDelete] = useState<ProfilUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // import
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profil_users")
      .select("*")
      .order("role")
      .order("nama");
    if (error) setError(error.message);
    setRows((data ?? []) as ProfilUser[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = rows.filter((r) => {
    const mq =
      !q ||
      (r.nama ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (r.nomor_induk ?? "").toLowerCase().includes(q.toLowerCase());
    const mr = roleFilter === "all" || r.role === roleFilter;
    return mq && mr;
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  }
  function openEdit(r: ProfilUser) {
    setEditing(r);
    setForm({
      nama: r.nama ?? "",
      email: r.email ?? "",
      password: "",
      role: r.role,
      nomor_induk: r.nomor_induk ?? "",
      kelas: r.kelas ?? "",
    });
    setError(null);
    setFormOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { error } = await supabase.rpc("sidiswa_update_user", {
          p_id: editing.id,
          p_nama: form.nama.trim(),
          p_role: form.role,
          p_nomor_induk: form.nomor_induk.trim() || null,
          p_kelas: form.kelas.trim() || null,
          p_email: form.email.trim() || null,
          p_password: form.password.trim() || null,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("sidiswa_create_user", {
          p_email: form.email.trim(),
          p_password: form.password.trim(),
          p_nama: form.nama.trim(),
          p_role: form.role,
          p_nomor_induk: form.nomor_induk.trim() || null,
          p_kelas: form.kelas.trim() || null,
        });
        if (error) throw error;
      }
      setFormOpen(false);
      load();
    } catch (err: any) {
      setError(err?.message ?? "Gagal menyimpan pengguna.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.rpc("sidiswa_delete_user", { p_id: toDelete.id });
    setDeleting(false);
    if (error) return setError(error.message);
    setToDelete(null);
    load();
  }

  function exportCSV() {
    const headers = ["nama", "email", "role", "kelas", "nomor_induk"];
    const data = filtered.map((r) => [
      r.nama ?? "",
      r.email ?? "",
      r.role,
      r.kelas ?? "",
      r.nomor_induk ?? "",
    ]);
    downloadCSV(`pengguna-sidiswa-${new Date().toISOString().slice(0, 10)}.csv`, buildCSV(headers, data));
  }

  function downloadTemplate() {
    const headers = ["nama", "email", "role", "kelas", "nomor_induk", "password"];
    const sample = [
      ["Budi Santoso", "budi.santoso@sidiswa.id", "siswa", "7A", "2024010", ""],
      ["Ibu Ani, S.Pd", "ani@sidiswa.id", "guru", "", "GR-010", "RahasiaKuat1"],
    ];
    downloadCSV("format-import-pengguna.csv", buildCSV(headers, sample));
  }

  async function handleImport(file: File) {
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      const rowsPayload = parsed
        .filter((r) => (r.email ?? "").trim() !== "")
        .map((r) => ({
          nama: r.nama ?? "",
          email: r.email ?? "",
          role: (r.role ?? "siswa").toLowerCase(),
          kelas: r.kelas ?? "",
          nomor_induk: r.nomor_induk ?? r.nis ?? "",
          password: r.password ?? "",
        }));
      if (rowsPayload.length === 0) throw new Error("Tidak ada baris valid (kolom email kosong).");
      const { data, error } = await supabase.rpc("sidiswa_import_users", { p_rows: rowsPayload });
      if (error) throw error;
      setImportResult(data as any[]);
      load();
    } catch (err: any) {
      setError(err?.message ?? "Gagal mengimpor.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Pengguna</h2>
          <p className="text-[var(--text-2)]">
            Tambah & atur akun (email, kata sandi, peran) untuk login aplikasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={downloadTemplate}>
            <FileText className="h-4 w-4" />
            Format Import
          </button>
          <button className="btn btn-ghost" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="btn btn-ghost" onClick={() => { setImportResult(null); setImportOpen(true); }}>
            <Upload className="h-4 w-4" />
            Import
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="card">
        <div className="p-4 border-b border-[var(--border)] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              className="input pl-9"
              placeholder="Cari nama, email, atau NIS…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="select max-w-[180px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">Semua Peran</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-16 grid place-items-center text-[var(--text-3)]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-[var(--text-3)] flex flex-col items-center gap-2">
            <Users className="h-6 w-6" />
            <p>Tidak ada pengguna.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Peran</th>
                  <th>Kelas</th>
                  <th>No. Induk</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.nama ?? "—"}</td>
                    <td>{r.email ?? "—"}</td>
                    <td>
                      <span className="badge bg-indigo-50 text-indigo-700">{ROLE_LABEL[r.role]}</span>
                    </td>
                    <td>{r.kelas ?? "—"}</td>
                    <td>{r.nomor_induk ?? "—"}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm text-red-600 disabled:opacity-40"
                          onClick={() => setToDelete(r)}
                          disabled={r.id === currentUserId}
                          title={r.id === currentUserId ? "Tidak bisa menghapus akun sendiri" : "Hapus"}
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

      {/* Add / Edit */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit Pengguna" : "Tambah Pengguna"}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nama Lengkap</label>
            <input
              className="input"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email (untuk login)</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Peran</label>
              <select
                className="select"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Kelas {form.role !== "siswa" && "(opsional)"}</label>
              <input
                className="input"
                value={form.kelas}
                onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                placeholder="cth. 7A"
              />
            </div>
            <div>
              <label className="label">No. Induk / NIS</label>
              <input
                className="input"
                value={form.nomor_induk}
                onChange={(e) => setForm({ ...form, nomor_induk: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">
              Kata Sandi{" "}
              {editing && (
                <span className="text-[var(--text-3)] font-normal">
                  (kosongkan bila tidak diubah)
                </span>
              )}
            </label>
            <input
              type="text"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editing ? "••••••• (biarkan kosong)" : "Kata sandi login"}
              required={!editing}
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

      {/* Delete */}
      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Hapus Pengguna" maxWidth="max-w-md">
        <p className="text-[var(--text-2)]">
          Yakin menghapus akun <strong className="text-[var(--text)]">{toDelete?.nama}</strong> (
          {toDelete?.email})? Akun login dan seluruh datanya akan dihapus permanen.
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

      {/* Import */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Pengguna (CSV)">
        <div className="space-y-4">
          <div className="text-sm text-[var(--text-2)] bg-slate-50 border border-[var(--border)] rounded-lg p-3">
            <p className="font-medium text-[var(--text)]">Format kolom CSV:</p>
            <code className="block mt-1">nama, email, role, kelas, nomor_induk, password</code>
            <ul className="list-disc list-inside mt-2 space-y-0.5">
              <li><strong>role</strong>: siswa / guru / bk / admin</li>
              <li><strong>password</strong> opsional — bila kosong dibuat otomatis</li>
              <li>email yang sudah terdaftar akan dilewati</li>
            </ul>
            <button className="btn btn-ghost btn-sm mt-2" onClick={downloadTemplate}>
              <FileText className="h-4 w-4" />
              Unduh contoh format
            </button>
          </div>

          {!importResult ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImport(f);
                }}
              />
              <button
                className="btn btn-primary w-full"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Mengimpor…" : "Pilih file CSV"}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Hasil impor ({importResult.filter((r) => r.status === "ok").length} berhasil,{" "}
                {importResult.filter((r) => r.status !== "ok").length} gagal). Catat kata sandi di
                bawah ini:
              </p>
              <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-lg">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Kata Sandi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.map((r, i) => (
                      <tr key={i}>
                        <td>{r.email}</td>
                        <td>
                          <span className={`badge ${r.status === "ok" ? "badge-selesai" : "badge-proses"}`}>
                            {r.status === "ok" ? "OK" : "Gagal"}
                          </span>
                        </td>
                        <td>
                          <code>{r.status === "ok" ? r.password : r.pesan}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-ghost w-full" onClick={() => setImportOpen(false)}>
                Tutup
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
