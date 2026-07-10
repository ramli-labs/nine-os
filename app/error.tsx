"use client";

import { RefreshCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="h-10 w-10 text-amber-500" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-navy-950">
        Ada yang tidak beres
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navy-600">
        Halaman ini gagal dimuat. Coba muat ulang — biasanya cukup.
      </p>
      <Button className="mt-6" onClick={() => reset()}>
        <RefreshCcw className="h-4 w-4" aria-hidden />
        Coba lagi
      </Button>
    </main>
  );
}
