import Link from "next/link";
import {
  LogIn, FilePlus2, ClipboardList, BarChart3, ListChecks, ShieldCheck, ArrowRight,
} from "lucide-react";
import Logo from "@/components/Logo";
import DevCredit from "@/components/DevCredit";
import { SEKOLAH } from "@/lib/sekolah";

export const dynamic = "force-dynamic";

const FITUR = [
  {
    icon: FilePlus2,
    judul: "Pencatatan Pelanggaran",
    teks: "Guru & BK mencatat pelanggaran lengkap dengan bukti foto dan tahap pembinaan.",
  },
  {
    icon: ClipboardList,
    judul: "Monitoring Kasus",
    teks: "Pantau seluruh kasus, ubah status pembinaan, dan tindak lanjut secara real-time.",
  },
  {
    icon: ListChecks,
    judul: "Tahap Pembinaan",
    teks: "Setiap pelanggaran punya pilihan tahap pembinaan sesuai tata tertib sekolah.",
  },
  {
    icon: BarChart3,
    judul: "Laporan & Evaluasi",
    teks: "Laporan individu, kelas, dan statistik bulanan rinci sebagai bahan evaluasi.",
  },
];

export default function Beranda() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* Navbar */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size={40} rounded="rounded-lg" />
            <div className="leading-tight min-w-0">
              <p className="font-bold truncate">{SEKOLAH.app}</p>
              <p className="text-xs text-[var(--text-3)] truncate">{SEKOLAH.nama}</p>
            </div>
          </div>
          <Link href="/login" className="btn btn-primary">
            <LogIn className="h-4 w-4" />
            Masuk
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-dark)] bg-[var(--color-brand-light)] px-3 py-1 rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              {SEKOLAH.appLong}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Membangun budaya disiplin yang{" "}
              <span className="text-[var(--color-brand)]">terukur & transparan</span>
            </h1>
            <p className="mt-4 text-[var(--text-2)] text-base sm:text-lg max-w-xl">
              {SEKOLAH.app} adalah sistem pencatatan dan pembinaan kedisiplinan siswa{" "}
              {SEKOLAH.nama}. Catat pelanggaran, pantau poin, dan susun laporan
              pembinaan dalam satu aplikasi.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn btn-primary">
                Masuk ke Aplikasi
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="card p-6 sm:p-8">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                <Logo size={48} rounded="rounded-xl" />
                <div>
                  <p className="font-bold">{SEKOLAH.app}</p>
                  <p className="text-xs text-[var(--text-3)]">{SEKOLAH.nama}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-5">
                {FITUR.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.judul} className="rounded-xl bg-[var(--bg)] p-4">
                      <div className="h-9 w-9 rounded-lg bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] grid place-items-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-tight">{f.judul}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Fitur detail */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-center">Fitur Utama</h2>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FITUR.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.judul} className="card p-5">
                  <div className="h-11 w-11 rounded-xl bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] grid place-items-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-semibold">{f.judul}</p>
                  <p className="mt-1 text-sm text-[var(--text-2)]">{f.teks}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-[var(--text-2)]">
          <p className="font-semibold text-[var(--text)]">{SEKOLAH.namaUpper}</p>
          <p>{SEKOLAH.alamat} · Telp. {SEKOLAH.telp}</p>
          <p className="mt-3 text-xs text-[var(--text-3)]">
            &copy; {SEKOLAH.tahun()} {SEKOLAH.app} — {SEKOLAH.appLong}.
          </p>
          <DevCredit className="mt-1" />
        </div>
      </footer>
    </div>
  );
}
