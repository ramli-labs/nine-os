import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/lib/types";
import { ResourceManager } from "./manager";

export const metadata: Metadata = { title: "Materi" };

export default async function TeacherResourcesPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Materi
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Materi yang dipublikasikan bisa dibaca siswa dan tampil di halaman
          publik.
        </p>
      </div>
      <ResourceManager items={(data ?? []) as Resource[]} />
    </div>
  );
}
