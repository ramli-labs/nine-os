import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { jakartaDateString, formatPlainDateID } from "@/lib/date";
import type { Gender, PiketAssignment, PiketSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Piket" };

type AssignmentRow = PiketAssignment & {
  profiles: { nickname: string; full_name: string; gender: Gender | null } | null;
};

export default async function StudentPiketPage() {
  const profile = await requireStudent();
  const supabase = await createClient();
  const today = jakartaDateString();

  // Hari ini + sisa jadwal minggu ini ke depan (yang aktif).
  const { data: schedules } = await supabase
    .from("piket_schedules")
    .select("*")
    .gte("duty_date", today)
    .order("duty_date", { ascending: true })
    .limit(5);

  const upcoming = (schedules ?? []) as PiketSchedule[];
  const ids = upcoming.map((s) => s.id);

  const { data: assignmentData } = ids.length
    ? await supabase
        .from("piket_assignments")
        .select("*, profiles(nickname, full_name, gender)")
        .in("schedule_id", ids)
    : { data: [] as AssignmentRow[] };

  const assignments = (assignmentData ?? []) as AssignmentRow[];
  const todaySchedule = upcoming.find((s) => s.duty_date === today) ?? null;
  const onDutyToday =
    todaySchedule &&
    assignments.some(
      (a) => a.schedule_id === todaySchedule.id && a.student_id === profile.id
    );
  const myNext = upcoming.find((s) =>
    assignments.some(
      (a) => a.schedule_id === s.id && a.student_id === profile.id
    )
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Piket
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          {onDutyToday
            ? "Hari ini giliranmu — terima kasih sudah menjaga kelas kita."
            : myNext
              ? `Giliranmu berikutnya: ${formatPlainDateID(myNext.duty_date)}.`
              : "Belum ada giliranmu di jadwal terdekat."}
        </p>
      </div>

      {onDutyToday ? (
        <Card className="border-accent-500/50 bg-gradient-to-r from-accent-400/15 to-transparent">
          <CardContent className="flex items-center gap-3 px-5 py-4">
            <Sparkles className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
            <p className="text-sm font-medium text-navy-900">
              Kamu bertugas piket hari ini.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {upcoming.length === 0 ? (
        <EmptyState
          title="Jadwal belum dibuat"
          description="Jadwal piket akan muncul di sini setelah dibuat wali kelas."
        />
      ) : (
        upcoming.map((s) => {
          const members = assignments.filter((a) => a.schedule_id === s.id);
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>
                  {s.duty_date === today
                    ? `Hari ini — ${formatPlainDateID(s.duty_date)}`
                    : formatPlainDateID(s.duty_date)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <ul className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isMe = m.student_id === profile.id;
                    return (
                      <li
                        key={m.id}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm",
                          isMe
                            ? "border-navy-900 bg-navy-900 font-medium text-cream-50"
                            : "border-navy-200 bg-white text-navy-800"
                        )}
                      >
                        {m.profiles?.nickname || m.profiles?.full_name || "Siswa"}
                        {m.role === "koordinator" ? (
                          <Badge tone="green" className="ml-2">
                            Koordinator
                          </Badge>
                        ) : null}
                        {isMe ? (
                          <Badge tone="amber" className="ml-2">
                            kamu
                          </Badge>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
