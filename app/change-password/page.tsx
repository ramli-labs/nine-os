import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Ganti Password" };

export default async function ChangePasswordPage() {
  // Tidak memakai requireAuth (yang mengarahkan KE sini) — cukup cek sesi.
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status === "inactive") redirect("/auth/signout?reason=inactive");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-cream-100 to-navy-100/40 px-4 py-10">
      <Logo className="mb-6" />
      <Card className="w-full max-w-md">
        <CardContent>
          <h1 className="text-xl font-semibold text-navy-950">
            Buat password milikmu
          </h1>
          <p className="mt-1 mb-6 text-sm leading-relaxed text-navy-600">
            Halo, {profile.nickname || profile.full_name}. Password yang kamu
            pakai tadi hanya sementara — buat password milikmu sendiri untuk
            melanjutkan.
          </p>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
