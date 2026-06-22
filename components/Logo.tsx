"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

/**
 * Logo sekolah. Menampilkan /logo.png bila tersedia di folder public,
 * jika tidak ada (atau gagal dimuat) menampilkan lambang perisai default.
 * Cukup taruh file `public/logo.png` untuk mengganti dengan logo sekolah.
 */
export default function Logo({
  size = 40,
  rounded = "rounded-xl",
  className = "",
}: {
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <div
        className={`grid place-items-center bg-[var(--color-brand)] text-white ${rounded} ${className}`}
        style={{ width: size, height: size }}
      >
        <ShieldCheck style={{ width: size * 0.55, height: size * 0.55 }} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png?v=3"
      alt="Logo Sekolah"
      width={size}
      height={size}
      className={`object-contain ${rounded} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}
