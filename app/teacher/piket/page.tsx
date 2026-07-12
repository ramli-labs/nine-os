import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  jakartaDateString,
  weekMondayOf,
  weekdayDates,
  addDaysISO,
  formatPlainDateID,
  formatDateShortID,
} from "@/lib/date";
import type { Gender, PiketAssignment, PiketSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import {
  GenerateWeekPanel,
  CompletedToggle,
  OverrideControl,
  type StudentOption,
} from "./panels";

export const metadata: Metadata = { title: "Piket Mingguan" };

const WEEKDAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

type AssignmentRow = PiketAssignment & {
  profiles: { nickname: string; full_name: string; gender: Gender | null } | null;
};

export default async function TeacherPiketPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireTeacher();
  const supabase = await createClient();

  const { date: rawDate } = await searchParams;
  const ref =
    rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : jakartaDateString();
  const monday = weekMondayOf(ref);
  const dates = weekdayDates(monday); // [Senin … Jumat]

  const prevWeek = addDaysISO(monday, -7);
  const nextWeek = addDaysISO(monday, 7);
  const thisWeek = jakartaDateString();
  const today = jakartaDateString();

  const [schedulesRes, studentsRes] = await Promise.all([
    supabase
      .from("piket_schedules")
      .select("*")
      .in("duty_date", dates)
      .order("duty_date"),
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
  const scheduleByDate = new Map(schedules.map((s) => [s.duty_date, s]));

  const nameOf = (s: { nickname: string; full_name: string }) =>
    s.nickname || s.full_name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Piket Mingguan
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Seluruh kelas dibagi rata ke Senin–Jumat — setiap siswa piket sekali
          seminggu, laki-laki dan perempuan seimbang tiap hari.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/teacher/piket?date=${prevWeek}`}
                aria-label="Minggu sebelumnya"
                className="tap-target rounded-lg border border-navy-200 p-2 text-navy-700 hover:bg-navy-100"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={`/teacher/piket?date=${nextWeek}`}
                aria-label="Minggu berikutnya"
                className="tap-target rounded-lg border border-navy-200 p-2 text-navy-700 hover:bg-navy-100"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <span className="ml-2 text-sm font-medium text-navy-900">
                {formatDateShortID(dates[0])} – {formatDateShortID(dates[4])}
              </span>
              {monday !== weekMondayOf(thisWeek) ? (
                <Link
                  href="/teacher/piket"
                  className="ml-2 text-xs text-navy-500 underline-offset-2 hover:underline"
                >
                  ke minggu ini
                </Link>
              ) : null}
            </div>
            <GenerateWeekPanel weekRef={monday} hasSchedule={hasSchedule} />
          </div>
          <p className="text-xs text-navy-400">
            {students.length} siswa aktif
            {hasSchedule ? " · jadwal minggu ini sudah dibuat" : " · belum ada jadwal minggu ini"}
          </p>
        </CardContent>
      </Card>

      {!hasSchedule ? (
        <EmptyState
          title="Belum ada jadwal untuk minggu ini"
          description="Klik “Generate 1 minggu (Senin–Jumat)” di atas — sistem membagi seluruh kelas ke lima hari secara adil."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {dates.map((date, i) => {
            const schedule = scheduleByDate.get(date);
            const members = schedule
              ? assignments.filter((a) => a.schedule_id === schedule.id)
              : [];
            const assignedIds = new Set(members.map((m) => m.student_id));
            const substituteOptions: StudentOption[] = students
              .filter((s) => !assignedIds.has(s.id))
              .map((s) => ({ id: s.id, name: nameOf(s) }));
            const done = members.filter((m) => m.completed).length;

            return (
              <Card
                key={date}
                className={date === today ? "border-accent-500/60" : undefined}
              >
                <CardHeader>
                  <div className="flex items-baseline justify-between gap-2">
                    <CardTitle className="text-base">
                      {WEEKDAY_LABELS[i]}
                      {date === today ? (
                        <Badge tone="amber" className="ml-2">
                          hari ini
                        </Badge>
                      ) : null}
                    </CardTitle>
                    <span className="text-xs text-navy-400">
                      {done}/{members.length}
                    </span>
                  </div>
                  <p className="text-xs text-navy-500">{formatPlainDateID(date)}</p>
                </CardHeader>
                <CardContent className="pt-2">
                  {members.length === 0 ? (
                    <p className="text-sm text-navy-400">Tidak ada petugas.</p>
                  ) : (
                    <ul className="divide-y divide-navy-100">
                      {members.map((a) => (
                        <li key={a.id} className="space-y-1.5 py-2">
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-900">
                              {a.profiles?.nickname ||
                                a.profiles?.full_name ||
                                "Siswa"}
                            </span>
                            {a.profiles?.gender ? (
                              <Badge>{a.profiles.gender}</Badge>
                            ) : null}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <CompletedToggle
                              assignmentId={a.id}
                              completed={a.completed}
                            />
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
      )}
    </div>
  );
}
