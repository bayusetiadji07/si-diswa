import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SEKOLAH } from "@/lib/sekolah";

export const metadata: Metadata = {
  title: `${SEKOLAH.app} — ${SEKOLAH.nama}`,
  description: `${SEKOLAH.appLong} ${SEKOLAH.nama}. Pencatatan, pembinaan, dan laporan kedisiplinan siswa.`,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4338ca",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
