import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Akses dibatasi" };

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <ShieldAlert className="h-10 w-10 text-navy-300" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-navy-950">
        Halaman ini tidak untuk akunmu
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navy-600">
        Area yang kamu tuju membutuhkan peran yang berbeda. Kalau menurutmu ini
        keliru, sampaikan langsung ke wali kelas.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="secondary">Kembali ke ruang kelasku</Button>
      </Link>
    </main>
  );
}
