# Panduan Konfigurasi Supabase — Si Diswa

Dokumen ini menjelaskan konfigurasi Supabase (Database, Auth, Storage) untuk
aplikasi **Si Diswa (Sistem Disiplin Siswa)**.

> **Status:** Skema database, data contoh, akun demo, bucket `bukti-pelanggaran`,
> dan seluruh RLS Policy **sudah dibuat otomatis** pada project Supabase
> `wddfpmsurcftapbczise`. Dokumen ini adalah referensi/replikasi bila Anda ingin
> menerapkannya ke project lain.

---

## 1. Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://wddfpmsurcftapbczise.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key Anda>
```

Ambil dari **Supabase Dashboard → Project Settings → API**.

---

## 2. Skema Tabel

| Tabel | Keterangan |
|-------|------------|
| `profil_users` | Profil + peran (`siswa`/`guru`/`bk`/`admin`), terhubung ke `auth.users(id)` |
| `peraturan` | Master daftar pelanggaran + bobot poin |
| `log_pelanggaran` | Catatan pelanggaran (bukti, pembinaan, status) |

Fungsi bantu `public.sidiswa_my_role()` (SECURITY DEFINER) mengembalikan peran
user yang sedang login tanpa memicu rekursi RLS.

---

## 3. Storage Bucket `bukti-pelanggaran`

### Membuat bucket (Dashboard → Storage → New bucket)
- **Name:** `bukti-pelanggaran`
- **Public bucket:** ✅ **ON** (agar URL publik bisa ditampilkan sebagai thumbnail)

### RLS Policies pada `storage.objects`

**a. Public Read** — siapa pun boleh membaca file di bucket ini:
```sql
create policy "bukti public read" on storage.objects
  for select using (bucket_id = 'bukti-pelanggaran');
```

**b. Authenticated Write (Guru/BK/Admin)** — hanya staf yang boleh mengunggah:
```sql
create policy "bukti staff insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bukti-pelanggaran'
    and public.sidiswa_my_role() in ('guru','bk','admin')
  );
```

**c. Update (Guru/BK/Admin):**
```sql
create policy "bukti staff update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'bukti-pelanggaran'
    and public.sidiswa_my_role() in ('guru','bk','admin')
  );
```

**d. Delete (BK/Admin saja):**
```sql
create policy "bukti staff delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bukti-pelanggaran'
    and public.sidiswa_my_role() in ('bk','admin')
  );
```

---

## 4. Cara kerja upload di aplikasi

Pada form **Catat Pelanggaran** (`components/CatatForm.tsx`):
1. File diunggah ke `bukti-pelanggaran/<siswa_id>/<timestamp>.<ext>`.
2. `getPublicUrl()` mengambil URL publik.
3. URL disimpan ke kolom `log_pelanggaran.bukti_url`.

---

## 5. Akun Demo

| Peran | Email | Kata Sandi |
|-------|-------|-----------|
| Admin | `admin@sidiswa.id` | `sidiswa123` |
| Guru BK | `bk@sidiswa.id` | `sidiswa123` |
| Guru | `guru@sidiswa.id` | `sidiswa123` |
| Siswa | `ahmad@sidiswa.id` | `sidiswa123` |
| Siswa | `siti@sidiswa.id` | `sidiswa123` |
| Siswa | `budi@sidiswa.id` | `sidiswa123` |
