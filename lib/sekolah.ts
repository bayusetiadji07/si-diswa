/** Identitas sekolah & aplikasi — dipakai di login, sidebar, landing, dan kop surat. */
export const SEKOLAH = {
  app: "Si Diswa",
  appLong: "Sistem Disiplin Siswa",
  nama: "SMP Negeri 3 Besuki",
  namaUpper: "SMP NEGERI 3 BESUKI",
  pemda: "PEMERINTAH KABUPATEN SITUBONDO",
  dinas: "DINAS PENDIDIKAN DAN KEBUDAYAAN",
  alamat: "Jalan Gunung Ringgit No. 10, Besuki 68356",
  telp: "082233055896",
  tahun: () => new Date().getFullYear(),
} as const;
