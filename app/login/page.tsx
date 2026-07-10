import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-cream-100 to-navy-100/40 px-4 py-10">
      <Logo className="mb-6" />
      <Card className="w-full max-w-md">
        <CardContent>
          <h1 className="text-xl font-semibold text-navy-950">
            Masuk ke NINE.OS
          </h1>
          <p className="mt-1 mb-6 text-sm text-navy-600">
            Ruang digital kelas 9 — masuk dengan username dari wali kelas.
          </p>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-center text-xs text-navy-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          ← Kembali ke beranda
        </Link>
      </p>
    </main>
  );
}
