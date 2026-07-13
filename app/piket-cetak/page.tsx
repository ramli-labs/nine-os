import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Gender, PiketAssignment, PiketSchedule } from "@/lib/types";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Cetak Jadwal Piket" };

const WEEKDAY_LABELS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

type AssignmentRow = PiketAssignment & {
  profiles: { nickname: string; full_name: string; gender: Gender | null } | null;
};

export default async function PiketPrintPage() {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const { data: schedulesData } = await supabase
    .from("piket_schedules")
    .select("*")
    .order("duty_date");
  const schedules = (schedulesData ?? []) as PiketSchedule[];
  const ids = schedules.map((s) => s.id);

  let assignments: AssignmentRow[] = [];
  if (ids.length) {
    const { data } = await supabase
      .from("piket_assignments")
      .select("*, profiles(nickname, full_name, gender)")
      .in("schedule_id", ids)
      .order("created_at");
    assignments = (data ?? []) as AssignmentRow[];
  }

  return (
    <div className="mx-auto max-w-3xl bg-white px-6 py-8 text-navy-950">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Jadwal Piket Kelas {teacher.class_name}
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            Wali Kelas: {teacher.full_name || teacher.nickname} · berlaku setiap
            minggu
          </p>
        </div>
        <PrintButton />
      </div>

      {schedules.length === 0 ? (
        <p className="text-sm text-navy-500">Belum ada jadwal piket.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {schedules.map((s, i) => {
            const members = assignments
              .filter((a) => a.schedule_id === s.id)
              .slice()
              .sort(
                (a, b) =>
                  (b.role === "koordinator" ? 1 : 0) -
                  (a.role === "koordinator" ? 1 : 0)
              );
            return (
              <section
                key={s.id}
                className="break-inside-avoid rounded-lg border border-navy-300"
              >
                <h2 className="border-b border-navy-300 bg-navy-50 px-4 py-2 text-sm font-semibold">
                  {WEEKDAY_LABELS[i] ?? "Hari"}{" "}
                  <span className="font-normal text-navy-500">
                    · {members.length} petugas
                  </span>
                </h2>
                <ol className="divide-y divide-navy-100">
                  {members.map((a, idx) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 px-4 py-1.5 text-sm"
                    >
                      <span className="w-5 shrink-0 text-navy-400">
                        {idx + 1}.
                      </span>
                      <span className="flex-1">
                        {a.profiles?.full_name ||
                          a.profiles?.nickname ||
                          "Siswa"}
                      </span>
                      {a.profiles?.gender ? (
                        <span className="text-xs text-navy-500">
                          ({a.profiles.gender})
                        </span>
                      ) : null}
                      {a.role === "koordinator" ? (
                        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Koordinator
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-navy-400">
        Koordinator memimpin dan mengoordinasi piket pada harinya. Jadwal ini
        berlaku untuk setiap minggu sampai diperbarui wali kelas.
      </p>
    </div>
  );
}
