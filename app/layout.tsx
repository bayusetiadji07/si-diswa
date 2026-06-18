import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Si Diswa — Sistem Disiplin Siswa",
  description: "Aplikasi pencatatan dan monitoring kedisiplinan siswa.",
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
