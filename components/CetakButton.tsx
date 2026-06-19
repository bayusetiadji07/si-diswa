"use client";

import { Printer } from "lucide-react";

export default function CetakButton({ label = "Cetak Surat" }: { label?: string }) {
  return (
    <button className="btn btn-primary no-print" onClick={() => window.print()}>
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
