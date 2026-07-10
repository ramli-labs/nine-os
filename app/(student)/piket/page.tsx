import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { WEEKDAY_LABELS } from "@/lib/piket";
import { EmptyState } from "@/components/ui/feedback";
import { PiketGrid, type PiketRow } from "@/components/piket-grid";

export const metadata: Metadata = { title: "Jadwal Piket" };

export default async function StudentPiketPage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("piket_assignments")
    .select("*, profiles(nickname, full_name, gender)")
    .order("weekday", { ascending: true });

  const rows = (data ?? []) as PiketRow[];
  const mine = rows.find((r) => r.student_id === profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Jadwal Piket
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          {mine
            ? `Hari piketmu: ${WEEKDAY_LABELS[mine.weekday]}.`
            : "Kamu belum masuk jadwal — tunggu wali kelas mengacak ulang."}
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Jadwal belum dibuat"
          description="Jadwal piket akan muncul di sini setelah dibuat wali kelas."
        />
      ) : (
        <PiketGrid rows={rows} highlightStudentId={profile.id} />
      )}
    </div>
  );
}
