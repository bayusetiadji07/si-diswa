"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Upload, X, CheckCircle2, Loader2, FilePlus2, ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import type { Peraturan, ProfilUser, TahapPembinaan } from "@/lib/types";

export default function CatatForm({
  guruId,
  guruNama,
}: {
  guruId: string;
  guruNama: string;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [students, setStudents] = useState<ProfilUser[]>([]);
  const [peraturan, setPeraturan] = useState<Peraturan[]>([]);
  const [tahapList, setTahapList] = useState<TahapPembinaan[]>([]);
  // peraturan_id -> tahap_id[]
  const [mapping, setMapping] = useState<Record<number, number[]>>({});

  // form fields
  const [siswa, setSiswa] = useState<ProfilUser | null>(null);
  const [siswaQuery, setSiswaQuery] = useState("");
  const [showList, setShowList] = useState(false);
  const [peraturanId, setPeraturanId] = useState<number | "">("");
  const [tahapDipilih, setTahapDipilih] = useState<Set<number>>(new Set());
  const [catatan, setCatatan] = useState("");
  const [pembinaan, setPembinaan] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: p }, { data: tah }, { data: map }] = await Promise.all([
        supabase
          .from("profil_users")
          .select("id, nama, nomor_induk, role, kelas, email")
          .eq("role", "siswa")
          .order("nama"),
        supabase.from("peraturan").select("*").order("kategori").order("nama_pelanggaran"),
        supabase.from("tahap_pembinaan").select("*").order("urutan"),
        supabase.from("peraturan_pembinaan").select("peraturan_id, tahap_id"),
      ]);
      setStudents((s ?? []) as ProfilUser[]);
      setPeraturan((p ?? []) as Peraturan[]);
      setTahapList((tah ?? []) as TahapPembinaan[]);
      const m: Record<number, number[]> = {};
      (map ?? []).forEach((r: any) => {
        (m[r.peraturan_id] ??= []).push(r.tahap_id);
      });
      setMapping(m);
    })();
  }, [supabase]);

  // Tahap pembinaan options for the currently selected violation.
  const tahapOptions: TahapPembinaan[] =
    peraturanId === "" ? [] : tahapList.filter((t) => (mapping[peraturanId] ?? []).includes(t.id));

  function toggleTahap(id: number) {
    setTahapDipilih((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const matches = siswaQuery
    ? students.filter(
        (s) =>
          (s.nama ?? "").toLowerCase().includes(siswaQuery.toLowerCase()) ||
          (s.nomor_induk ?? "").toLowerCase().includes(siswaQuery.toLowerCase()) ||
          (s.kelas ?? "").toLowerCase().includes(siswaQuery.toLowerCase())
      )
    : students;

  const selectedPeraturan = peraturan.find((p) => p.id === peraturanId);

  function pickFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function reset() {
    setSiswa(null);
    setSiswaQuery("");
    setPeraturanId("");
    setTahapDipilih(new Set());
    setCatatan("");
    setPembinaan("");
    pickFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!siswa) return setError("Pilih siswa terlebih dahulu.");
    if (!peraturanId) return setError("Pilih jenis pelanggaran.");

    setSubmitting(true);
    try {
      let buktiUrl: string | null = null;

      if (file) {
        const compressed = await compressImage(file);
        const ext = compressed.name.split(".").pop() ?? "webp";
        const path = `${siswa.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("bukti-pelanggaran")
          .upload(path, compressed, {
            upsert: false,
            contentType: compressed.type,
            cacheControl: "31536000", // 1 tahun (nama file unik) → caching agresif
          });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("bukti-pelanggaran").getPublicUrl(path);
        buktiUrl = data.publicUrl;
      }

      const { error: insErr } = await supabase.from("log_pelanggaran").insert({
        siswa_id: siswa.id,
        peraturan_id: peraturanId,
        guru_id: guruId,
        catatan: catatan.trim() || null,
        langkah_pembinaan: pembinaan.trim() || null,
        tahap_ids: Array.from(tahapDipilih),
        bukti_url: buktiUrl,
        status: "proses",
      });
      if (insErr) throw insErr;

      setDone(true);
      reset();
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan saat menyimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Catat Pelanggaran</h2>
        <p className="text-[var(--text-2)]">
          Pelapor: <strong>{guruNama}</strong>. Lengkapi data kejadian di bawah ini.
        </p>
      </div>

      {done && (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-5 w-5" />
          Pelanggaran berhasil dicatat.
        </div>
      )}

      <form onSubmit={submit} className="card p-5 sm:p-6 space-y-5">
        {/* Student combobox */}
        <div className="relative">
          <label className="label">Nama Siswa</label>
          {siswa ? (
            <div className="flex items-center justify-between gap-2 input">
              <span>
                <strong>{siswa.nama}</strong>
                <span className="text-[var(--text-3)]">
                  {" "}
                  · {siswa.kelas ?? "-"} · {siswa.nomor_induk ?? "-"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSiswa(null);
                  setSiswaQuery("");
                }}
                className="text-[var(--text-3)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                <input
                  className="input pl-9"
                  placeholder="Ketik nama, NIS, atau kelas…"
                  value={siswaQuery}
                  onChange={(e) => {
                    setSiswaQuery(e.target.value);
                    setShowList(true);
                  }}
                  onFocus={() => setShowList(true)}
                  onBlur={() => setTimeout(() => setShowList(false), 150)}
                />
              </div>
              {showList && matches.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto card p-1 shadow-lg">
                  {matches.slice(0, 30).map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSiswa(s);
                          setShowList(false);
                        }}
                      >
                        <span className="font-medium">{s.nama}</span>{" "}
                        <span className="text-xs text-[var(--text-3)]">
                          {s.kelas ?? "-"} · {s.nomor_induk ?? "-"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Violation dropdown */}
        <div>
          <label className="label">Jenis Pelanggaran</label>
          <select
            className="select"
            value={peraturanId}
            onChange={(e) => {
              setPeraturanId(e.target.value ? Number(e.target.value) : "");
              setTahapDipilih(new Set());
            }}
            required
          >
            <option value="">— Pilih pelanggaran —</option>
            {peraturan.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kategori ? `[${p.kategori}] ` : ""}
                {p.nama_pelanggaran} ({p.bobot_poin} poin)
              </option>
            ))}
          </select>
          {selectedPeraturan && (
            <p className="mt-1 text-xs text-[var(--text-3)]">
              Kategori: {selectedPeraturan.kategori ?? "—"} · Bobot:{" "}
              <span className="font-semibold text-rose-600">
                {selectedPeraturan.bobot_poin} poin
              </span>
            </p>
          )}
        </div>

        {/* Coaching step picker (depends on chosen violation) */}
        {peraturanId !== "" && (
          <div>
            <label className="label">
              Tahap Pembinaan{" "}
              <span className="text-[var(--text-3)] font-normal">
                (pilih satu atau beberapa — {tahapDipilih.size} dipilih)
              </span>
            </label>
            {tahapOptions.length === 0 ? (
              <p className="text-sm text-[var(--text-3)] border border-dashed border-[var(--border)] rounded-lg p-3">
                Belum ada pilihan tahap pembinaan untuk pelanggaran ini. Atur di menu
                Master Peraturan.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-1 border border-[var(--border)] rounded-lg p-2">
                {tahapOptions.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={tahapDipilih.has(t.id)}
                      onChange={() => toggleTahap(t.id)}
                    />
                    <span className="text-sm">{t.nama}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evidence upload */}
        <div>
          <label className="label">Bukti (Foto)</label>
          {preview ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Pratinjau" className="h-40 rounded-lg border border-[var(--border)] object-cover" />
              <button
                type="button"
                onClick={() => {
                  pickFile(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-white border border-[var(--border)] rounded-full p-1 shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-[var(--border)] rounded-xl py-8 flex flex-col items-center gap-2 text-[var(--text-3)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm">Klik untuk mengunggah gambar bukti</span>
              <span className="text-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> JPG / PNG, opsional
              </span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Chronology */}
        <div>
          <label className="label">Kronologi Kejadian (Catatan)</label>
          <textarea
            className="textarea"
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Deskripsikan kronologi kejadian…"
          />
        </div>

        {/* Counseling */}
        <div>
          <label className="label">Catatan Pembinaan Tambahan (opsional)</label>
          <textarea
            className="textarea"
            rows={3}
            value={pembinaan}
            onChange={(e) => setPembinaan(e.target.value)}
            placeholder="Catatan tambahan di luar tahap pembinaan terpilih…"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={reset} disabled={submitting}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
            {submitting ? "Menyimpan…" : "Simpan Pelanggaran"}
          </button>
        </div>
      </form>
    </div>
  );
}
