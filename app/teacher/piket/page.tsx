import type { Metadata } from "next";
import Link from "next/link";
import { Printer, Star } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Gender, PiketAssignment, PiketSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import {
  GenerateRotaPanel,
  OverrideControl,
  type StudentOption,
} from "./panels";

export const metadata: Metadata = { title: "Piket" };

const WEEKDAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

type AssignmentRow = PiketAssignment & {
  profiles: { nickname: string; full_name: string; gender: Gender | null } | null;
};

export default async function TeacherPiketPage() {
  await requireTeacher();
  const supabase = await createClient();

  const [schedulesRes, studentsRes] = await Promise.all([
    supabase.from("piket_schedules").select("*").order("duty_date"),
    supabase
      .from("profiles")
      .select("id, nickname, full_name, gender")
      .eq("role", "student")
      .eq("status", "active")
      .order("full_name"),
  ]);

  const schedules = (schedulesRes.data ?? []) as PiketSchedule[];
  const students = studentsRes.data ?? [];
  const scheduleIds = schedules.map((s) => s.id);

  let assignments: AssignmentRow[] = [];
  if (scheduleIds.length) {
    const { data } = await supabase
      .from("piket_assignments")
      .select("*, profiles(nickname, full_name, gender)")
      .in("schedule_id", scheduleIds)
      .order("created_at");
    assignments = (data ?? []) as AssignmentRow[];
  }

  const hasSchedule = schedules.length > 0;
  const nameOf = (s: { nickname: string; full_name: string }) =>
    s.nickname || s.full_name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Piket
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Satu jadwal tetap yang berlaku setiap minggu — seluruh kelas dibagi
          rata ke Senin–Jumat, L/P seimbang, satu koordinator (★) tiap hari.
          Acak ulang hanya bila ingin mengganti.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <GenerateRotaPanel hasSchedule={hasSchedule} />
          </div>
          {hasSchedule ? (
            <Link href="/piket-cetak" target="_blank">
              <Button type="button" variant="outline" size="sm">
                <Printer className="h-4 w-4" aria-hidden />
                Cetak / Unduh PDF
              </Button>
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {!hasSchedule ? (
        <EmptyState
          title="Belum ada jadwal piket"
          description="Klik “Buat jadwal piket” — sistem membagi seluruh kelas ke Senin–Jumat secara adil, dan jadwal itu berlaku setiap minggu."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {schedules.map((schedule, i) => {
              const members = assignments
                .filter((a) => a.schedule_id === schedule.id)
                .slice()
                .sort(
                  (a, b) =>
                    (b.role === "koordinator" ? 1 : 0) -
                    (a.role === "koordinator" ? 1 : 0)
                );
              const assignedIds = new Set(members.map((m) => m.student_id));
              const substituteOptions: StudentOption[] = students
                .filter((s) => !assignedIds.has(s.id))
                .map((s) => ({ id: s.id, name: nameOf(s) }));

              return (
                <Card key={schedule.id}>
                  <CardHeader>
                    <div className="flex items-baseline justify-between gap-2">
                      <CardTitle className="text-base">
                        {WEEKDAY_LABELS[i] ?? "Hari"}
                      </CardTitle>
                      <span className="text-xs text-navy-400">
                        {members.length} petugas
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-navy-400">Tidak ada petugas.</p>
                    ) : (
                      <ul className="divide-y divide-navy-100">
                        {members.map((a) => (
                          <li key={a.id} className="space-y-1.5 py-2">
                            <div className="flex items-center gap-1.5">
                              {a.role === "koordinator" ? (
                                <Star
                                  className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                                  fill="currentColor"
                                  aria-label="Koordinator"
                                />
                              ) : null}
                              <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-900">
                                {a.profiles?.nickname ||
                                  a.profiles?.full_name ||
                                  "Siswa"}
                              </span>
                              {a.profiles?.gender ? (
                                <Badge>{a.profiles.gender}</Badge>
                              ) : null}
                            </div>
                            <div className="flex items-center justify-end">
                              <OverrideControl
                                assignmentId={a.id}
                                options={substituteOptions}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-navy-400">
            <span className="text-emerald-600" aria-hidden>
              ★
            </span>{" "}
            = koordinator piket hari itu · jadwal ini berlaku untuk setiap minggu
          </p>
        </>
      )}
    </div>
  );
}
