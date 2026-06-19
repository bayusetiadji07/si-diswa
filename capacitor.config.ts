import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "id.sch.smpn3besuki.sidiswa",
  appName: "Si Diswa",
  // Tidak dipakai (aplikasi memuat situs produksi via server.url), tapi wajib ada.
  webDir: "public",
  server: {
    // APK membuka langsung situs produksi.
    url: "https://si-diswa.vercel.app",
    androidScheme: "https",
  },
};

export default config;
