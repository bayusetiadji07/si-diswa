import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";
import { SEKOLAH } from "@/lib/sekolah";
import CetakButton from "@/components/CetakButton";

export const dynamic = "force-dynamic";

export default async function SuratPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["guru", "bk", "admin"]);
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: log }, { data: tah }, { data: bk }] = await Promise.all([
    supabase
      .from("log_pelanggaran")
      .select(
        "id, tanggal, catatan, langkah_pembinaan, tahap_ids, bukti_url, status, siswa:siswa_id(nama, kelas, nomor_induk), peraturan(nama_pelanggaran, kategori, bobot_poin), guru:guru_id(nama)"
      )
      .eq("id", Number(id))
      .single(),
    supabase.from("tahap_pembinaan").select("id, nama"),
    supabase.from("profil_users").select("nama").eq("role", "bk").limit(1).maybeSingle(),
  ]);

  if (!log) {
    return (
      <div className="card p-10 text-center text-[var(--text-3)]">
        Data pelanggaran tidak ditemukan.
        <div className="mt-4">
          <Link href="/dashboard/pelanggaran" className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
      </div>
    );
  }

  const l = log as any;
  const tahapMap: Record<number, string> = {};
  (tah ?? []).forEach((t: any) => (tahapMap[t.id] = t.nama));
  const tahapNama: string[] = (l.tahap_ids ?? []).map((id: number) => tahapMap[id]).filter(Boolean);
  const namaBK = (bk as any)?.nama ?? "Guru BK";
  const hariIni = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* Toolbar (tidak ikut tercetak) */}
      <div className="no-print flex items-center justify-between">
        <Link href="/dashboard/pelanggaran" className="btn btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <CetakButton />
      </div>

      {/* Surat resmi */}
      <div className="print-area card p-8 max-w-3xl mx-auto bg-white text-[13px] leading-relaxed">
        {/* Kop surat */}
        <div className="flex items-center justify-center gap-4 border-b-2 border-black pb-3 mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logosekolah.png" alt="Logo Sekolah" className="h-16 w-16 object-contain shrink-0" />
          <div className="text-center">
            <p className="font-semibold">{SEKOLAH.pemda}</p>
            <p className="font-semibold">{SEKOLAH.dinas}</p>
            <p className="text-xl font-bold tracking-wide">{SEKOLAH.namaUpper}</p>
            <p className="text-xs">
              {SEKOLAH.alamat} — Telp. {SEKOLAH.telp}
            </p>
          </div>
        </div>

        <div className="text-center mb-5">
          <p className="font-bold underline uppercase">Surat Pembinaan Pelanggaran Tata Tertib</p>
          <p className="text-xs">Nomor: ......./SD/{new Date().getFullYear()}</p>
        </div>

        <p className="mb-3">
          Yang bertanda tangan di bawah ini menerangkan bahwa peserta didik berikut telah
          melakukan pelanggaran tata tertib sekolah:
        </p>

        {/* Identitas siswa */}
        <table className="mb-4">
          <tbody>
            <tr>
              <td className="align-top pr-3 py-0.5 w-40">Nama</td>
              <td className="align-top pr-2">:</td>
              <td className="font-medium">{l.siswa?.nama ?? "—"}</td>
            </tr>
            <tr>
              <td className="align-top pr-3 py-0.5">Kelas</td>
              <td>:</td>
              <td>{l.siswa?.kelas ?? "—"}</td>
            </tr>
            <tr>
              <td className="align-top pr-3 py-0.5">Nomor Induk</td>
              <td>:</td>
              <td>{l.siswa?.nomor_induk ?? "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Rincian pelanggaran */}
        <table className="mb-4">
          <tbody>
            <tr>
              <td className="align-top pr-3 py-0.5 w-40">Jenis Pelanggaran</td>
              <td className="align-top pr-2">:</td>
              <td className="font-medium">{l.peraturan?.nama_pelanggaran ?? "—"}</td>
            </tr>
            <tr>
              <td className="align-top pr-3 py-0.5">Kategori</td>
              <td>:</td>
              <td>{l.peraturan?.kategori ?? "—"}</td>
            </tr>
            <tr>
              <td className="align-top pr-3 py-0.5">Bobot Poin</td>
              <td>:</td>
              <td>{l.peraturan?.bobot_poin ?? 0}</td>
            </tr>
            <tr>
              <td className="align-top pr-3 py-0.5">Waktu Kejadian</td>
              <td>:</td>
              <td>{fmtDateTime(l.tanggal)}</td>
            </tr>
            <tr>
              <td className="align-top pr-3 py-0.5">Kronologi</td>
              <td className="align-top">:</td>
              <td>{l.catatan || "—"}</td>
            </tr>
          </tbody>
        </table>

        {/* Tahap pembinaan */}
        <p className="font-medium mb-1">Tahap pembinaan yang diberikan:</p>
        {tahapNama.length > 0 ? (
          <ol className="list-decimal list-inside mb-3 space-y-0.5">
            {tahapNama.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        ) : (
          <p className="mb-3">—</p>
        )}
        {l.langkah_pembinaan && (
          <p className="mb-3">
            <span className="font-medium">Catatan tambahan: </span>
            {l.langkah_pembinaan}
          </p>
        )}

        {/* Lampiran bukti */}
        {l.bukti_url && (
          <div className="mb-4">
            <p className="font-medium mb-1">Lampiran bukti:</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={l.bukti_url}
              alt="Bukti pelanggaran"
              className="max-h-64 rounded border border-slate-300 object-contain"
            />
          </div>
        )}

        <p className="mb-8">
          Demikian surat pembinaan ini dibuat dengan sebenar-benarnya. Peserta didik dan orang
          tua/wali menyatakan memahami pelanggaran tersebut dan bersedia mengikuti pembinaan
          yang diberikan sekolah.
        </p>

        {/* Tanda tangan */}
        <p className="text-right mb-6">Besuki, {hariIni}</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p>Peserta Didik,</p>
            <div className="h-20" />
            <p className="font-medium underline">{l.siswa?.nama ?? "(.................)"}</p>
          </div>
          <div>
            <p>Orang Tua/Wali,</p>
            <div className="h-20" />
            <p className="font-medium underline">(.............................)</p>
          </div>
          <div>
            <p>Guru BK,</p>
            <div className="h-20" />
            <p className="font-medium underline">{namaBK}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
