export type Role = "siswa" | "guru" | "bk" | "admin";

export interface ProfilUser {
  id: string;
  nama: string | null;
  nomor_induk: string | null;
  role: Role;
  kelas: string | null;
  email: string | null;
}

export interface Peraturan {
  id: number;
  nama_pelanggaran: string;
  kategori: string | null;
  bobot_poin: number;
}

/** A single coaching/discipline step. */
export interface TahapPembinaan {
  id: number;
  nama: string;
  deskripsi: string | null;
  urutan: number;
}

export type StatusPelanggaran = "proses" | "selesai";

export interface LogPelanggaran {
  id: number;
  siswa_id: string | null;
  peraturan_id: number | null;
  guru_id: string | null;
  catatan: string | null;
  bukti_url: string | null;
  langkah_pembinaan: string | null;
  tahap_ids: number[];
  tanggal: string | null;
  status: StatusPelanggaran;
}

/** Log row joined with related names for display tables. */
export interface LogPelanggaranView extends LogPelanggaran {
  siswa: Pick<ProfilUser, "nama" | "kelas" | "nomor_induk"> | null;
  peraturan: Pick<Peraturan, "nama_pelanggaran" | "kategori" | "bobot_poin"> | null;
  guru: Pick<ProfilUser, "nama"> | null;
}

/** Routes each role is allowed to reach (prefix match). */
export const ROLE_ROUTES: Record<Role, string[]> = {
  siswa: ["/dashboard", "/dashboard/saya"],
  guru: ["/dashboard", "/dashboard/catat", "/dashboard/laporan"],
  bk: [
    "/dashboard",
    "/dashboard/peraturan",
    "/dashboard/pembinaan",
    "/dashboard/catat",
    "/dashboard/pelanggaran",
    "/dashboard/laporan",
  ],
  admin: [
    "/dashboard",
    "/dashboard/peraturan",
    "/dashboard/pembinaan",
    "/dashboard/catat",
    "/dashboard/pelanggaran",
    "/dashboard/laporan",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  siswa: "Siswa",
  guru: "Guru",
  bk: "Guru BK",
  admin: "Administrator",
};

/** Is `role` allowed to access `pathname`? */
export function canAccess(role: Role, pathname: string): boolean {
  const allowed = ROLE_ROUTES[role] ?? [];
  // Most specific match wins; siswa must not reach staff-only sub-routes.
  if (pathname === "/dashboard") return true;
  return allowed.some((r) => r !== "/dashboard" && pathname.startsWith(r));
}
