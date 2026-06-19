# Panduan Aplikasi Siswa (APK) + Notifikasi Pelanggaran

Dokumen ini menjelaskan rencana dan langkah membangun **aplikasi Android (APK)**
untuk siswa/orang tua: melihat status pelanggaran pribadi, daftar peraturan, dan
menerima **notifikasi di HP** saat anaknya tercatat melakukan pelanggaran.

## Arsitektur

```
APK (Capacitor WebView)  ──buka──>  https://si-diswa.vercel.app  (web app yang sudah ada)
        │
        │ daftar token FCM (setelah login)
        ▼
Supabase: tabel device_tokens (user_id ↔ token HP)

Guru/BK mencatat pelanggaran (INSERT log_pelanggaran)
        │  (Database Webhook / trigger)
        ▼
Supabase Edge Function "kirim-notifikasi"
        │  cari token milik siswa ybs → kirim via Firebase Cloud Messaging (FCM)
        ▼
Notifikasi muncul di HP siswa/ortu: "Ananda <Nama> tercatat: <Pelanggaran>"
```

## Status saat ini (sudah selesai)
- ✅ Halaman **Pelanggaran Saya** (status individu) — sudah ada.
- ✅ Halaman **Daftar Peraturan** untuk siswa — selesai.
- ✅ Tabel **`device_tokens`** + RLS (tiap pengguna kelola tokennya sendiri).

## Yang PERLU Anda lakukan (Firebase — gratis)

Notifikasi & APK **tidak bisa berjalan tanpa Firebase**. Langkah:

1. Buka <https://console.firebase.google.com> → **Add project** (mis. nama "Si Diswa").
2. Di project itu → **Add app** → pilih **Android**:
   - **Android package name**: `id.sch.smpn3besuki.sidiswa`
   - Daftarkan, lalu **unduh `google-services.json`**.
3. **Project Settings → Cloud Messaging**: pastikan **Firebase Cloud Messaging API (V1)** aktif.
4. **Project Settings → Service accounts → Generate new private key** → unduh file
   JSON (ini untuk server pengirim notifikasi).

### Kirimkan ke saya / siapkan:
- **`google-services.json`** — untuk build APK (akan disimpan sebagai GitHub Secret).
- **Service account JSON** — akan dipasang sebagai **Secret Edge Function** Supabase
  (nama: `FCM_SERVICE_ACCOUNT`). Bisa Anda set sendiri di Supabase Dashboard →
  Edge Functions → Secrets, atau kirim ke saya.

## Yang akan SAYA kerjakan setelah Firebase siap
1. **Edge Function `kirim-notifikasi`** (FCM HTTP v1) + **Database Webhook** pada
   INSERT `log_pelanggaran` → kirim notifikasi ke perangkat siswa terkait.
2. **Pendaftaran token** di web app (saat dijalankan di dalam APK): minta izin
   notifikasi → ambil token FCM → simpan ke `device_tokens`.
3. **Proyek Capacitor Android** (`android/`) + **GitHub Actions** untuk build APK
   otomatis di cloud (seperti e-asesmen), `server.url` = situs produksi.
4. APK hasil build tersedia di **GitHub Releases** untuk dibagikan ke wali murid.

## Catatan
- Pengujian notifikasi butuh **perangkat Android nyata** (emulator terbatas untuk FCM).
- iPhone tidak tercakup jalur ini (perlu APNs/iOS terpisah — bisa dibahas nanti).
- Orang tua cukup memakai **akun siswa** untuk login (tidak perlu akun terpisah).
