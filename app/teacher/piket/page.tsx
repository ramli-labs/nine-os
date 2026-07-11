import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { jakartaDateString, formatPlainDateID } from "@/lib/date";
import { defaultTeamSize } from "@/lib/piket";
import type { Gender, PiketAssignment, PiketSchedule } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import {
  DatePicker,
  GeneratePanel,
  CompletedToggle,
  OverrideControl,
  ExclusionPanel,
  type StudentOption,
} from "./panels";

export const metadata: Metadata = { title: "Piket Harian" };

type AssignmentRow = PiketAssignment & {
  profiles: { nickname: string; full_name: string; gender: Gender | null } | null;
};

type HistoryAssignment = {
  schedule_id: string;
  completed: boolean;
  profiles: { nickname: string } | null;
};

export default async function TeacherPiketPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireTeacher();
  const supabase = await createClient();

  const { date: rawDate } = await searchParams;
  const date =
    rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : jakartaDateString();

  const [scheduleRes, studentsRes, exclusionsRes, historyRes] =
    await Promise.all([
      supabase
        .from("piket_schedules")
        .select("*")
        .eq("duty_date", date)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, nickname, full_name, gender")
        .eq("role", "student")
        .eq("status", "active")
        .order("full_name"),
      supabase
        .from("piket_exclusions")
        .select("*, profiles!piket_exclusions_student_id_fkey(nickname, full_name)")
        .eq("exclusion_date", date),
      supabase
        .from("piket_schedules")
        .select("*")
        .order("duty_date", { ascending: false })
        .limit(8),
    ]);

  const schedule = scheduleRes.data as PiketSchedule | null;
  const students = studentsRes.data ?? [];
  const history = (historyRes.data ?? []) as PiketSchedule[];

  let assignments: AssignmentRow[] = [];
  if (schedule) {
    const { data } = await supabase
      .from("piket_assignments")
      .select("*, profiles(nickname, full_name, gender)")
      .eq("schedule_id", schedule.id)
      .order("created_at");
    assignments = (data ?? []) as AssignmentRow[];
  }

  // Riwayat singkat: jumlah petugas per jadwal.
  const historyIds = history.map((h) => h.id);
  const historyAssignmentsRes = historyIds.length
    ? await supabase
        .from("piket_assignments")
        .select("schedule_id, completed, profiles(nickname)")
        .in("schedule_id", historyIds)
    : { data: [] };
  const historyAssignments = (historyAssignmentsRes.data ??
    []) as unknown as HistoryAssignment[];

  const assignedIds = new Set(assignments.map((a) => a.student_id));
  const substituteOptions: StudentOption[] = students
    .filter((s) => !assignedIds.has(s.id))
    .map((s) => ({ id: s.id, name: s.nickname || s.full_name }));
  const allOptions: StudentOption[] = students.map((s) => ({
    id: s.id,
    name: s.nickname || s.full_name,
  }));

  const exclusions = (exclusionsRes.data ?? []).map((e) => ({
    id: e.id as string,
    name:
      (e.profiles?.nickname as string) ||
      (e.profiles?.full_name as string) ||
      "Siswa",
    reason: (e.reason as string | null) ?? null,
  }));

  const doneCount = assignments.filter((a) => a.completed).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Piket Harian
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Petugas dipilih adil: yang paling jarang piket didahulukan, petugas
          kemarin dihindari, L/P seimbang. Acak hanya di antara yang setara.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <DatePicker date={date} />
            <GeneratePanel
              date={date}
              hasSchedule={Boolean(schedule)}
              defaultSize={defaultTeamSize(students.length)}
            />
          </div>
          <p className="text-xs text-navy-400">
            {formatPlainDateID(date)} · {students.length} siswa aktif
            {exclusions.length > 0
              ? ` · ${exclusions.length} dikecualikan tanggal ini`
              : ""}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Petugas tanggal terpilih */}
        <Card>
          <CardHeader>
            <div className="flex items-baseline justify-between gap-2">
              <CardTitle>Petugas {formatPlainDateID(date)}</CardTitle>
              {schedule ? (
                <span className="text-xs text-navy-400">
                  {doneCount}/{assignments.length} selesai
                </span>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {!schedule ? (
              <EmptyState
                title="Belum ada jadwal untuk tanggal ini"
                description="Klik “Generate piket” di atas — sistem memilih petugas dengan beban paling ringan."
              />
            ) : (
              <ul className="divide-y divide-navy-100">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center gap-2 py-2.5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy-900">
                      {a.profiles?.nickname || a.profiles?.full_name || "Siswa"}
                    </span>
                    {a.profiles?.gender ? (
                      <Badge>{a.profiles.gender}</Badge>
                    ) : null}
                    <CompletedToggle
                      assignmentId={a.id}
                      completed={a.completed}
                    />
                    <OverrideControl
                      assignmentId={a.id}
                      options={substituteOptions}
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Exclusions */}
          <Card>
            <CardHeader>
              <CardTitle>Pengecualian tanggal ini</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ExclusionPanel
                date={date}
                options={allOptions}
                exclusions={exclusions}
              />
            </CardContent>
          </Card>

          {/* Riwayat */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat terakhir</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {history.length === 0 ? (
                <p className="text-sm text-navy-500">Belum ada riwayat.</p>
              ) : (
                <ul className="space-y-2">
                  {history.map((h) => {
                    const rows = historyAssignments.filter(
                      (x) => x.schedule_id === h.id
                    );
                    const names = rows
                      .map((x) => x.profiles?.nickname)
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <li key={h.id} className="text-sm">
                        <Link
                          href={`/teacher/piket?date=${h.duty_date}`}
                          className="font-medium text-navy-900 underline-offset-2 hover:underline"
                        >
                          {formatPlainDateID(h.duty_date)}
                        </Link>{" "}
                        <span className="text-navy-500">
                          · {rows.length} petugas
                          {names ? ` — ${names}` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
