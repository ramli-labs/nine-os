"use client";

import { Printer } from "lucide-react";

/** Tombol cetak — memicu dialog print browser (bisa "Simpan sebagai PDF"). */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-cream-50 hover:bg-navy-800 print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden />
      Cetak / Simpan PDF
    </button>
  );
}
