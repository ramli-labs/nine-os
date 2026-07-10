import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Announcement } from "@/lib/types";
import { AnnouncementManager } from "./manager";

export const metadata: Metadata = { title: "Pengumuman" };

export default async function AnnouncementsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Pengumuman
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Pengumuman terbaru yang dipublikasikan menjadi “Fokus Minggu Ini” di
          beranda siswa.
        </p>
      </div>
      <AnnouncementManager items={(data ?? []) as Announcement[]} />
    </div>
  );
}
