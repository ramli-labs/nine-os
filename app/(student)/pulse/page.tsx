import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentWeekStart, formatPlainDateID } from "@/lib/date";
import type { WeeklyPulse } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { PulseForm } from "./pulse-form";

export const metadata: Metadata = { title: "Denyut Mingguan" };

export default async function PulsePage() {
  const profile = await requireStudent();
  const supabase = await createClient();
  const weekStart = currentWeekStart();

  const { data } = await supabase
    .from("weekly_pulses")
    .select("*")
    .eq("student_id", profile.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  const existing = data as WeeklyPulse | null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Denyut Mingguan
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Minggu mulai {formatPlainDateID(weekStart)} · Cukup satu menit.
          Jawabanmu hanya dibaca oleh wali kelas.
        </p>
      </div>

      <Card>
        <CardContent>
          <PulseForm existing={existing} />
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-navy-500">
        Denyut Mingguan bukan penilaian dan bukan diagnosis — hanya cara
        sederhana supaya wali kelas tahu kabar kelas dari minggu ke minggu.
      </p>
    </div>
  );
}
