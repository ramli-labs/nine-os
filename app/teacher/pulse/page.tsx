import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentWeekStart, formatPlainDateID } from "@/lib/date";
import { CATEGORY_LABELS, FEELING_LABELS, feelingDisplay } from "@/lib/labels";
import type { Feeling, WeeklyPulse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Denyut Kelas" };

type PulseWithStudent = WeeklyPulse & {
  profiles: { nickname: string; full_name: string } | null;
};

function avg(nums: number[]): string {
  if (nums.length === 0) return "–";
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

export default async function TeacherPulsePage() {
  await requireTeacher();
  const supabase = await createClient();
  const weekStart = currentWeekStart();

  const [pulsesRes, studentsRes] = await Promise.all([
    supabase
      .from("weekly_pulses")
      .select("*, profiles(nickname, full_name)")
      .eq("week_start", weekStart)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
  ]);

  const pulses = (pulsesRes.data ?? []) as PulseWithStudent[];
  const totalStudents = studentsRes.count ?? 0;
  const completion =
    totalStudents > 0 ? Math.round((pulses.length / totalStudents) * 100) : 0;
  const helpCount = pulses.filter((p) => p.needs_help).length;

  const feelingCounts = new Map<Feeling, number>();
  for (const p of pulses) {
    feelingCounts.set(p.feeling, (feelingCounts.get(p.feeling) ?? 0) + 1);
  }
  const maxFeeling = Math.max(1, ...feelingCounts.values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Denyut Kelas
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Minggu mulai {formatPlainDateID(weekStart)} · gambaran, bukan
          penilaian.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Rata-rata energi", value: avg(pulses.map((p) => p.energy_level)) },
          { label: "Rata-rata tekanan", value: avg(pulses.map((p) => p.pressure_level)) },
          { label: "Meminta bantuan", value: helpCount },
          {
            label: "Partisipasi",
            value: `${completion}%`,
            sub: `${pulses.length} dari ${totalStudents} siswa`,
          },
        ].map(({ label, value, sub }) => (
          <Card key={label}>
            <CardContent className="px-4 py-4">
              <p className="text-2xl font-semibold text-navy-950">{value}</p>
              <p className="text-xs text-navy-500">{label}</p>
              {sub ? <p className="text-xs text-navy-400">{sub}</p> : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sebaran perasaan</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {pulses.length === 0 ? (
              <p className="text-sm text-navy-500">Belum ada data minggu ini.</p>
            ) : (
              <ul className="space-y-2.5">
                {(
                  Object.keys(FEELING_LABELS) as (keyof typeof FEELING_LABELS)[]
                ).map((f) => {
                  const count = feelingCounts.get(f) ?? 0;
                  if (count === 0) return null;
                  return (
                    <li key={f} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-navy-700">
                        {FEELING_LABELS[f]}
                      </span>
                      <div className="h-2.5 flex-1 rounded-full bg-navy-100">
                        <div
                          className="h-2.5 rounded-full bg-navy-600"
                          style={{ width: `${(count / maxFeeling) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-sm text-navy-600">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Respons individual</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {pulses.length === 0 ? (
              <EmptyState
                title="Belum ada denyut minggu ini"
                description="Respons siswa akan muncul di sini begitu mereka mengisi."
              />
            ) : (
              <ul className="divide-y divide-navy-100">
                {pulses.map((p) => (
                  <li key={p.id} className="py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-navy-900">
                        {p.profiles?.nickname || p.profiles?.full_name || "Siswa"}
                      </p>
                      <Badge>{feelingDisplay(p.feeling, p.feeling_detail)}</Badge>
                      {p.needs_help ? (
                        <Badge tone="amber">
                          Bantuan:{" "}
                          {p.help_category
                            ? CATEGORY_LABELS[p.help_category]
                            : "Umum"}
                        </Badge>
                      ) : null}
                      <span className="ml-auto text-xs text-navy-500">
                        E {p.energy_level}/5 · T {p.pressure_level}/5
                      </span>
                    </div>
                    {p.note ? (
                      <p className="mt-1.5 text-sm text-navy-600">“{p.note}”</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
