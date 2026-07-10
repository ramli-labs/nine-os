import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ClassEvent } from "@/lib/types";
import { EventManager } from "./manager";

export const metadata: Metadata = { title: "Agenda Kelas" };

export default async function EventsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Agenda Kelas
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Ujian, kegiatan, dan tenggat penting — tampil di beranda siswa.
        </p>
      </div>
      <EventManager items={(data ?? []) as ClassEvent[]} />
    </div>
  );
}
