import type { Metadata } from "next";
import Link from "next/link";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeID } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PiketGrid, type PiketRow } from "@/components/piket-grid";
import { RegenerateButton } from "./regenerate-button";

export const metadata: Metadata = { title: "Jadwal Piket" };

export default async function TeacherPiketPage() {
  await requireTeacher();
  const supabase = await createClient();

  const [assignmentsRes, studentsRes, missingGenderRes] = await Promise.all([
    supabase
      .from("piket_assignments")
      .select("*, profiles(nickname, full_name, gender)")
      .order("weekday", { ascending: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .is("gender", null),
  ]);

  const rows = (assignmentsRes.data ?? []) as PiketRow[];
  const totalStudents = studentsRes.count ?? 0;
  const missingGender = missingGenderRes.count ?? 0;
  const unscheduled = totalStudents - rows.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Jadwal Piket
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          {totalStudents} siswa terdaftar → dibagi rata Senin–Jumat dengan
          komposisi L/P seimbang. Acak ulang kapan saja — misalnya setelah
          semua akun siswa dibuat.
        </p>
      </div>

      {missingGender > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="px-5 py-4 text-sm text-amber-900">
            {missingGender} siswa belum diisi jenis kelaminnya — keseimbangan
            L/P belum optimal. Lengkapi lewat{" "}
            <Link
              href="/teacher/students"
              className="font-medium underline underline-offset-2"
            >
              profil masing-masing siswa
            </Link>
            , lalu acak ulang.
          </CardContent>
        </Card>
      ) : null}

      {unscheduled > 0 && rows.length > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="px-5 py-4 text-sm text-amber-900">
            Ada {unscheduled} siswa baru yang belum masuk jadwal. Acak ulang
            untuk menyertakan mereka.
          </CardContent>
        </Card>
      ) : null}

      <RegenerateButton hasSchedule={rows.length > 0} />

      {rows.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal piket"
          description="Klik “Buat jadwal piket” — seluruh siswa terdaftar akan dibagi acak ke Senin–Jumat."
        />
      ) : (
        <>
          <PiketGrid rows={rows} showGender />
          <p className="text-xs text-navy-400">
            Dibuat {formatDateTimeID(rows[0].created_at)} · siswa melihat
            jadwal ini di menu Piket dan hari piketnya di beranda.
          </p>
        </>
      )}
    </div>
  );
}
