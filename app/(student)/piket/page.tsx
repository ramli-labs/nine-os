import type { Metadata } from "next";
import { Sparkles, Star } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Gender, PiketAssignment, PiketSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Piket" };

const WEEKDAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

type AssignmentRow = PiketAssignment & {
  profiles: { nickname: string; full_name: string; gender: Gender | null } | null;
};

export default async function StudentPiketPage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data: schedulesData } = await supabase
    .from("piket_schedules")
    .select("*")
    .order("duty_date", { ascending: true });
  const schedules = (schedulesData ?? []) as PiketSchedule[];
  const ids = schedules.map((s) => s.id);

  const { data: assignmentData } = ids.length
    ? await supabase
        .from("piket_assignments")
        .select("*, profiles(nickname, full_name, gender)")
        .in("schedule_id", ids)
    : { data: [] as AssignmentRow[] };
  const assignments = (assignmentData ?? []) as AssignmentRow[];

  // Hari giliranku (indeks 0=Senin … 4=Jumat) + apakah aku koordinator.
  let myDay = -1;
  let iAmCoordinator = false;
  schedules.forEach((s, i) => {
    const mine = assignments.find(
      (a) => a.schedule_id === s.id && a.student_id === profile.id
    );
    if (mine) {
      myDay = i;
      iAmCoordinator = mine.role === "koordinator";
    }
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Piket
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          {myDay >= 0
            ? iAmCoordinator
              ? `Giliranmu piket setiap hari ${WEEKDAY_LABELS[myDay]} — kamu koordinatornya. Terima kasih sudah memimpin.`
              : `Giliranmu piket setiap hari ${WEEKDAY_LABELS[myDay]}.`
            : "Belum ada giliranmu di jadwal saat ini."}
        </p>
      </div>

      {myDay >= 0 ? (
        <Card className="border-accent-500/50 bg-gradient-to-r from-accent-400/15 to-transparent">
          <CardContent className="flex items-center gap-3 px-5 py-4">
            <Sparkles className="h-5 w-5 shrink-0 text-accent-600" aria-hidden />
            <p className="text-sm font-medium text-navy-900">
              Kamu bertugas piket setiap hari {WEEKDAY_LABELS[myDay]}
              {iAmCoordinator ? " sebagai koordinator" : ""}.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {schedules.length === 0 ? (
        <EmptyState
          title="Jadwal belum dibuat"
          description="Jadwal piket akan muncul di sini setelah dibuat wali kelas."
        />
      ) : (
        schedules.map((s, i) => {
          const members = assignments
            .filter((a) => a.schedule_id === s.id)
            .slice()
            .sort(
              (a, b) =>
                (b.role === "koordinator" ? 1 : 0) -
                (a.role === "koordinator" ? 1 : 0)
            );
          return (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{WEEKDAY_LABELS[i] ?? "Hari"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <ul className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const isMe = m.student_id === profile.id;
                    return (
                      <li
                        key={m.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm",
                          isMe
                            ? "border-navy-900 bg-navy-900 font-medium text-cream-50"
                            : "border-navy-200 bg-white text-navy-800"
                        )}
                      >
                        {m.role === "koordinator" ? (
                          <Star
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isMe ? "text-amber-300" : "text-emerald-600"
                            )}
                            fill="currentColor"
                            aria-label="Koordinator"
                          />
                        ) : null}
                        {m.profiles?.nickname || m.profiles?.full_name || "Siswa"}
                        {isMe ? (
                          <Badge tone="amber" className="ml-1">
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

      <p className="text-xs text-navy-400">
        <span className="text-emerald-600" aria-hidden>
          ★
        </span>{" "}
        = koordinator piket hari itu
      </p>
    </div>
  );
}
