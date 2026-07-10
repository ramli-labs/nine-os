import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo className="mb-8" />
      <Compass className="h-10 w-10 text-navy-300" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-navy-950">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-sm text-sm text-navy-600">
        Tautan yang kamu tuju tidak ada atau sudah dipindahkan.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="secondary">Kembali ke beranda</Button>
      </Link>
    </main>
  );
}
