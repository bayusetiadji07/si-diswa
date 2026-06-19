"use client";

import { useEffect, useMemo, useState } from "react";
import { User, Users, BarChart3, Printer, Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtDate, MONTHS_ID } from "@/lib/format";

interface LogRow {
  id: number;
  siswa_id: string | null;
  tanggal: string | null;
  status: "proses" | "selesai";
  catatan: string | null;
  langkah_pembinaan: string | null;
  tahap_ids: number[] | null;
  siswa: { nama: string | null; kelas: string | null; nomor_induk: string | null } | null;
  peraturan: { nama_pelanggaran: string | null; kategori: string | null; bobot_poin: number | null } | null;
}

type Tab = "individu" | "kelas" | "bulanan";

export default function LaporanTabs() {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("individu");
  const [rows, setRows] = useState<LogRow[]>([]);
  const [tahapMap, setTahapMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: tah }] = await Promise.all([
        supabase
          .from("log_pelanggaran")
          .select(
            "id, siswa_id, tanggal, status, catatan, langkah_pembinaan, tahap_ids, siswa:siswa_id(nama, kelas, nomor_induk), peraturan(nama_pelanggaran, kategori, bobot_poin)"
          )
          .order("tanggal", { ascending: false }),
        supabase.from("tahap_pembinaan").select("id, nama"),
      ]);
      setRows((data ?? []) as any);
      const m: Record<number, string> = {};
      (tah ?? []).forEach((t: any) => (m[t.id] = t.nama));
      setTahapMap(m);
      setLoading(false);
    })();
  }, [supabase]);

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "individu", label: "Laporan Individu", icon: User },
    { key: "kelas", label: "Laporan Kelas", icon: Users },
    { key: "bulanan", label: "Statistik Bulanan", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h2 className="text-2xl font-bold">Laporan & Statistik</h2>
        <p className="text-[var(--text-2)]">
          Analisis kedisiplinan siswa per individu, kelas, dan bulan.
        </p>
      </div>

      {/* Tab nav */}
      <div className="no-print flex gap-1 border-b border-[var(--border)]">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                active
                  ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                  : "border-transparent text-[var(--text-2)] hover:text-[var(--text)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-16 grid place-items-center text-[var(--text-3)]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : tab === "individu" ? (
        <IndividuReport rows={rows} tahapMap={tahapMap} />
      ) : tab === "kelas" ? (
        <KelasReport rows={rows} />
      ) : (
        <BulananReport rows={rows} />
      )}
    </div>
  );
}

function PrintButton() {
  return (
    <button className="btn btn-primary no-print" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      Cetak Laporan
    </button>
  );
}

function PrintHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="hidden print:block mb-4 text-center border-b border-slate-300 pb-3">
      <h1 className="text-lg font-bold">SISTEM DISIPLIN SISWA (Si Diswa)</h1>
      <p className="text-sm">{subtitle}</p>
      <p className="text-xs text-slate-500">Dicetak: {fmtDate(new Date().toISOString())}</p>
    </div>
  );
}

// ----------------- Tab 1: Individu -----------------
function IndividuReport({
  rows,
  tahapMap,
}: {
  rows: LogRow[];
  tahapMap: Record<number, string>;
}) {
  const students = useMemo(() => {
    const map = new Map<string, { nama: string; kelas: string; nis: string }>();
    rows.forEach((r) => {
      if (r.siswa_id && r.siswa)
        map.set(r.siswa_id, {
          nama: r.siswa.nama ?? "—",
          kelas: r.siswa.kelas ?? "—",
          nis: r.siswa.nomor_induk ?? "—",
        });
    });
    return Array.from(map.entries());
  }, [rows]);

  const [q, setQ] = useState("");
  const [selId, setSelId] = useState<string | null>(null);

  const candidates = q
    ? students.filter(([, s]) => s.nama.toLowerCase().includes(q.toLowerCase()))
    : students;

  const selected = selId ? students.find(([id]) => id === selId) : null;
  const studentRows = selId ? rows.filter((r) => r.siswa_id === selId) : [];
  const total = studentRows.reduce((s, r) => s + (r.peraturan?.bobot_poin ?? 0), 0);
  const selesai = studentRows.filter((r) => r.status === "selesai").length;

  return (
    <div className="space-y-4">
      <div className="no-print card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="label">Cari & Pilih Siswa</label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              className="input pl-9"
              placeholder="Ketik nama siswa…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {q && (
            <ul className="mt-1 max-h-44 overflow-y-auto card p-1">
              {candidates.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--text-3)]">Tidak ditemukan</li>
              ) : (
                candidates.slice(0, 20).map(([id, s]) => (
                  <li key={id}>
                    <button
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm"
                      onClick={() => {
                        setSelId(id);
                        setQ("");
                      }}
                    >
                      {s.nama}{" "}
                      <span className="text-xs text-[var(--text-3)]">· {s.kelas}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {selected && <PrintButton />}
      </div>

      {!selected ? (
        <div className="card p-12 text-center text-[var(--text-3)] no-print">
          Pilih siswa untuk menampilkan laporan individu.
        </div>
      ) : (
        <div className="print-area space-y-4">
          <PrintHeader subtitle="Laporan Kedisiplinan Individu" />
          <div className="card p-5">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-lg font-bold">{selected[1].nama}</p>
                <p className="text-sm text-[var(--text-2)]">
                  Kelas {selected[1].kelas} · NIS {selected[1].nis}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-rose-600">{total}</p>
                  <p className="text-xs text-[var(--text-2)]">Total Poin</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{studentRows.length}</p>
                  <p className="text-xs text-[var(--text-2)]">Total Kasus</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{selesai}</p>
                  <p className="text-xs text-[var(--text-2)]">Selesai Dibina</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pelanggaran</th>
                  <th>Kategori</th>
                  <th>Poin</th>
                  <th>Pembinaan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.tanggal)}</td>
                    <td>{r.peraturan?.nama_pelanggaran ?? "—"}</td>
                    <td>{r.peraturan?.kategori ?? "—"}</td>
                    <td className="font-semibold text-rose-600">{r.peraturan?.bobot_poin ?? 0}</td>
                    <td>
                      {r.tahap_ids && r.tahap_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.tahap_ids.map((id) => (
                            <span key={id} className="badge bg-indigo-50 text-indigo-700">
                              {tahapMap[id] ?? `#${id}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                      {r.langkah_pembinaan && (
                        <p className="text-xs text-[var(--text-2)] mt-1">{r.langkah_pembinaan}</p>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${r.status === "selesai" ? "badge-selesai" : "badge-proses"}`}>
                        {r.status === "selesai" ? "Selesai" : "Proses"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------- Tab 2: Kelas -----------------
function KelasReport({ rows }: { rows: LogRow[] }) {
  const classes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.siswa?.kelas && set.add(r.siswa.kelas));
    return Array.from(set).sort();
  }, [rows]);

  const [kelas, setKelas] = useState<string>("");

  useEffect(() => {
    if (!kelas && classes.length) setKelas(classes[0]);
  }, [classes, kelas]);

  const leaderboard = useMemo(() => {
    const map = new Map<string, { nama: string; nis: string; poin: number; kasus: number }>();
    rows
      .filter((r) => r.siswa?.kelas === kelas)
      .forEach((r) => {
        const key = r.siswa_id ?? "x";
        const cur = map.get(key) ?? {
          nama: r.siswa?.nama ?? "—",
          nis: r.siswa?.nomor_induk ?? "—",
          poin: 0,
          kasus: 0,
        };
        cur.poin += r.peraturan?.bobot_poin ?? 0;
        cur.kasus += 1;
        map.set(key, cur);
      });
    return Array.from(map.values()).sort((a, b) => b.poin - a.poin);
  }, [rows, kelas]);

  return (
    <div className="space-y-4">
      <div className="no-print card p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[200px]">
          <label className="label">Pilih Kelas</label>
          <select className="select" value={kelas} onChange={(e) => setKelas(e.target.value)}>
            {classes.length === 0 && <option value="">Tidak ada data</option>}
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {leaderboard.length > 0 && <PrintButton />}
      </div>

      <div className="print-area space-y-4">
        <PrintHeader subtitle={`Peringkat Poin Pelanggaran — Kelas ${kelas || "-"}`} />
        <div className="card overflow-x-auto">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-[var(--text-3)]">
              Belum ada pelanggaran untuk kelas ini.
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Peringkat</th>
                  <th>Nama Siswa</th>
                  <th>NIS</th>
                  <th>Jumlah Kasus</th>
                  <th>Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((s, i) => (
                  <tr key={s.nis + i}>
                    <td>
                      <span
                        className={`inline-grid place-items-center h-7 w-7 rounded-full font-bold text-xs ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                            ? "bg-slate-200 text-slate-700"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="font-medium">{s.nama}</td>
                    <td>{s.nis}</td>
                    <td>{s.kasus}</td>
                    <td className="font-bold text-rose-600">{s.poin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------- Tab 3: Bulanan -----------------
function BulananReport({ rows }: { rows: LogRow[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const years = useMemo(() => {
    const set = new Set<number>();
    rows.forEach((r) => r.tanggal && set.add(new Date(r.tanggal).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [rows, now]);

  const monthly = useMemo(() => {
    const counts = new Array(12).fill(0);
    rows.forEach((r) => {
      if (!r.tanggal) return;
      const d = new Date(r.tanggal);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    });
    return counts;
  }, [rows, year]);
  const maxMonth = Math.max(1, ...monthly);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    rows
      .filter((r) => r.tanggal && new Date(r.tanggal).getFullYear() === year)
      .forEach((r) => {
        const k = r.peraturan?.kategori ?? "Lainnya";
        map.set(k, (map.get(k) ?? 0) + 1);
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows, year]);
  const totalYear = monthly.reduce((a, b) => a + b, 0);

  // Rincian per jenis pelanggaran (bahan evaluasi sekolah)
  const perJenis = useMemo(() => {
    const map = new Map<string, { kategori: string; kasus: number; poin: number }>();
    rows
      .filter((r) => r.tanggal && new Date(r.tanggal).getFullYear() === year)
      .forEach((r) => {
        const nama = r.peraturan?.nama_pelanggaran ?? "Lainnya";
        const cur = map.get(nama) ?? {
          kategori: r.peraturan?.kategori ?? "—",
          kasus: 0,
          poin: 0,
        };
        cur.kasus += 1;
        cur.poin += r.peraturan?.bobot_poin ?? 0;
        map.set(nama, cur);
      });
    return Array.from(map.entries())
      .map(([nama, v]) => ({ nama, ...v }))
      .sort((a, b) => b.kasus - a.kasus || b.poin - a.poin);
  }, [rows, year]);
  const totalPoinYear = perJenis.reduce((s, r) => s + r.poin, 0);

  return (
    <div className="space-y-4">
      <div className="no-print card p-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[140px]">
          <label className="label">Tahun</label>
          <select className="select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <PrintButton />
      </div>

      <div className="print-area space-y-4">
        <PrintHeader subtitle={`Statistik Pelanggaran Tahun ${year}`} />

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-2xl font-bold">{totalYear}</p>
            <p className="text-xs text-[var(--text-2)]">Total Kasus {year}</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-bold">{categories[0]?.[0] ?? "—"}</p>
            <p className="text-xs text-[var(--text-2)]">Kategori Terbanyak</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-bold">
              {MONTHS_ID[monthly.indexOf(Math.max(...monthly))] ?? "—"}
            </p>
            <p className="text-xs text-[var(--text-2)]">Bulan Tertinggi</p>
          </div>
        </div>

        {/* Monthly bar chart */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Jumlah Kasus per Bulan</h3>
          <div className="flex items-end gap-2 h-48">
            {monthly.map((c, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-[var(--text-3)]">{c || ""}</span>
                <div
                  className="w-full bg-[var(--color-brand)] rounded-t-md transition-all"
                  style={{ height: `${(c / maxMonth) * 100}%`, minHeight: c ? "6px" : "2px" }}
                />
                <span className="text-[10px] text-[var(--text-2)]">{MONTHS_ID[i].slice(0, 3)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Kategori Pelanggaran Terbanyak</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-[var(--text-3)]">Tidak ada data untuk tahun ini.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat}</span>
                    <span className="font-semibold">{count} kasus</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-brand)] rounded-full"
                      style={{ width: `${(count / (categories[0]?.[1] || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rincian per jenis pelanggaran — bahan evaluasi */}
        <div className="card">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="font-semibold">Rincian per Jenis Pelanggaran ({year})</h3>
            <p className="text-xs text-[var(--text-2)]">
              Untuk bahan evaluasi sekolah — diurutkan dari kasus terbanyak.
            </p>
          </div>
          {perJenis.length === 0 ? (
            <p className="text-sm text-[var(--text-3)] p-6 text-center">
              Tidak ada data untuk tahun ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th className="w-10">No</th>
                    <th>Jenis Pelanggaran</th>
                    <th>Kategori</th>
                    <th>Jumlah Kasus</th>
                    <th>Total Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {perJenis.map((r, i) => (
                    <tr key={r.nama}>
                      <td className="text-[var(--text-3)]">{i + 1}</td>
                      <td className="font-medium">{r.nama}</td>
                      <td>{r.kategori}</td>
                      <td>{r.kasus}</td>
                      <td className="font-semibold text-rose-600">{r.poin}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold bg-slate-50">
                    <td colSpan={3} className="text-right">
                      Total
                    </td>
                    <td>{totalYear}</td>
                    <td className="text-rose-600">{totalPoinYear}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
