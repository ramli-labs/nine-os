import type { Metadata } from "next";
import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { displayUsername } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profil" };

export default async function ProfilePage() {
  const profile = await requireStudent();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
            Profilku
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            @{displayUsername(profile.email)} ·{" "}
            <Badge>Kelas {profile.class_name}</Badge>
          </p>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identitas</CardTitle>
        </CardHeader>
        <CardContent className="pt-3">
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Link href="/onboarding" className="block">
        <Card className="transition-shadow hover:shadow-lift">
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <NotebookPen className="h-5 w-5 text-accent-600" aria-hidden />
            <div>
              <p className="text-sm font-medium text-navy-900">
                Jawaban “Kenali Saya”
              </p>
              <p className="text-xs text-navy-500">
                Lihat atau perbarui ceritamu untuk wali kelas.
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
