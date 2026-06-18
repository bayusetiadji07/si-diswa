# Si Diswa — Sistem Disiplin Siswa

Aplikasi web pencatatan & monitoring kedisiplinan siswa. Dibangun dengan
**Next.js (App Router)**, **Supabase** (Auth, Database, Storage), dan **Tailwind CSS**.

## Fitur

- 🔐 **RBAC via Middleware** — peran `siswa`, `guru`, `bk`, `admin` dengan akses berbeda.
- 👨‍🎓 **Dashboard Siswa** — total poin, tren akumulasi, riwayat pelanggaran pribadi.
- 📚 **Master Peraturan** (BK/Admin) — CRUD daftar pelanggaran + bobot poin.
- 📝 **Catat Pelanggaran** (Guru/BK) — autocomplete siswa, dropdown pelanggaran, unggah bukti.
- 🗂️ **Monitoring** (BK) — tabel kasus, lightbox bukti, toggle status, filter & pencarian.
- 📊 **Laporan** — 3 tab (Individu, Kelas, Bulanan) + cetak/PDF via `@media print`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build produksi
```

Pastikan `.env.local` berisi `NEXT_PUBLIC_SUPABASE_URL` dan
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Lihat [SUPABASE_STORAGE_GUIDE.md](./SUPABASE_STORAGE_GUIDE.md)
untuk konfigurasi database & storage.

## Akun Demo

| Peran | Email | Sandi |
|-------|-------|-------|
| Admin | `admin@sidiswa.id` | `sidiswa123` |
| Guru BK | `bk@sidiswa.id` | `sidiswa123` |
| Guru | `guru@sidiswa.id` | `sidiswa123` |
| Siswa | `ahmad@sidiswa.id` | `sidiswa123` |

## Struktur

```
app/
  login/                 Halaman masuk
  dashboard/
    page.tsx             Dashboard (role-aware)
    saya/                Pelanggaran siswa (siswa)
    peraturan/           Master data (bk/admin)
    catat/               Form pencatatan (guru/bk)
    pelanggaran/         Monitoring (bk/admin)
    laporan/             Laporan 3 tab + cetak
  auth/signout/          Route handler logout
components/              Shell, Modal, Lightbox, manager & form clients
lib/
  supabase/              client / server / middleware
  auth.ts                getProfile / requireRole
  types.ts               tipe & aturan akses peran
  format.ts              util tanggal
middleware.ts            RBAC + refresh sesi
```
