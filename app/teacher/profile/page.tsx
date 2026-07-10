import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/logout-button";

export const metadata: Metadata = { title: "Profil Wali Kelas" };

export default async function TeacherProfilePage() {
  const profile = await requireTeacher();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
            {profile.full_name || profile.nickname}
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            {profile.email} · <Badge tone="blue">Wali Kelas {profile.class_name}</Badge>
          </p>
        </div>
        <LogoutButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tentang akun ini</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 text-sm leading-relaxed text-navy-700">
          Peran wali kelas diberikan langsung di database oleh pemilik proyek —
          tidak ada jalur dari aplikasi untuk menaikkan peran. Lihat
          README_SETUP.md untuk prosedurnya.
        </CardContent>
      </Card>
    </div>
  );
}
