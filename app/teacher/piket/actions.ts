"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { distributeWeekWithCoordinators, type WeekStudent } from "@/lib/piket";
import {
  generateRotaSchema,
  overridePiketSchema,
  exclusionSchema,
} from "@/lib/validation";
import { weekMondayOf, weekdayDates, jakartaDateString } from "@/lib/date";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult, Gender } from "@/lib/types";

function revalidate() {
  revalidatePath("/teacher/piket");
  revalidatePath("/piket");
  revalidatePath("/piket-cetak");
  revalidatePath("/dashboard");
}

/**
 * Buat / acak ulang ROTA PIKET TETAP (Senin–Jumat).
 * Hanya ada SATU rota yang berlaku untuk setiap minggu. Seluruh siswa
 * aktif dibagi rata ke 5 hari (L/P seimbang), satu koordinator per hari.
 * Generate/acak ulang mengganti seluruh rota lama.
 */
export async function generateRota(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = generateRotaSchema.safeParse({
    confirm_overwrite: formData.get("confirm_overwrite") ?? "false",
  });
  if (!parsed.success) return validationError(parsed.error);

  // Rota bersifat tunggal: kalau sudah ada, minta konfirmasi sebelum ganti.
  const { data: existing } = await guard.supabase
    .from("piket_schedules")
    .select("id")
    .limit(1);
  if (existing && existing.length > 0 && !parsed.data.confirm_overwrite) {
    return {
      ok: false,
      error:
        "Jadwal piket sudah ada. Gunakan “Acak ulang” bila memang ingin menggantinya.",
    };
  }

  // Siswa aktif.
  const { data: students } = await guard.supabase
    .from("profiles")
    .select("id, gender, is_coordinator")
    .eq("role", "student")
    .eq("status", "active");
  if (!students || students.length === 0) {
    return { ok: false, error: "Belum ada siswa aktif." };
  }

  const coordinatorIds = students
    .filter((s) => s.is_coordinator)
    .map((s) => s.id);
  const others: WeekStudent[] = students
    .filter((s) => !s.is_coordinator)
    .map((s) => ({ id: s.id, gender: (s.gender as Gender | null) ?? null }));
  const plan = distributeWeekWithCoordinators(coordinatorIds, others);

  // Hapus seluruh rota lama (cascade menghapus assignment).
  if (existing && existing.length > 0) {
    const { error: delError } = await guard.supabase
      .from("piket_schedules")
      .delete()
      .gte("duty_date", "0001-01-01");
    if (delError) {
      return { ok: false, error: "Gagal mengganti jadwal lama. Coba lagi." };
    }
  }

  // Simpan sebagai 5 hari (Senin–Jumat) memakai tanggal minggu berjalan.
  // Tampilan memakai NAMA HARI, jadi rota berlaku untuk semua minggu.
  const monday = weekMondayOf(jakartaDateString());
  const dates = weekdayDates(monday);

  const { data: schedules, error: schedError } = await guard.supabase
    .from("piket_schedules")
    .insert(dates.map((duty_date) => ({ duty_date, generated_by: guard.userId })))
    .select("id, duty_date");
  if (schedError || !schedules || schedules.length !== dates.length) {
    return { ok: false, error: "Jadwal belum berhasil dibuat. Coba lagi." };
  }

  const scheduleByDate = new Map<string, string>(
    schedules.map((s) => [s.duty_date as string, s.id as string])
  );
  const rows = plan
    .map((p) => {
      const scheduleId = scheduleByDate.get(dates[p.day]);
      if (!scheduleId) return null;
      return {
        schedule_id: scheduleId,
        student_id: p.studentId,
        role: p.coordinator ? "koordinator" : null,
      };
    })
    .filter(
      (r): r is { schedule_id: string; student_id: string; role: string | null } =>
        r !== null
    );

  if (rows.length > 0) {
    const { error: assignError } = await guard.supabase
      .from("piket_assignments")
      .insert(rows);
    if (assignError) {
      return { ok: false, error: "Petugas belum tersimpan. Acak sekali lagi." };
    }
  }

  await logAudit(
    guard.supabase,
    guard.userId,
    existing && existing.length > 0 ? "piket.regenerate_rota" : "piket.generate_rota",
    "piket_schedule",
    schedules[0]?.id,
    { students: rows.length }
  );

  revalidate();
  const coordCount = Math.min(coordinatorIds.length, dates.length);
  return {
    ok: true,
    message: `Jadwal piket dibuat — ${students.length} siswa dibagi ke Senin–Jumat${
      coordCount ? `, ${coordCount} koordinator` : ""
    }. Berlaku setiap minggu.`,
  };
}

/** Manual override: ganti satu petugas dengan siswa lain. */
export async function overrideAssignment(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = overridePiketSchema.safeParse({
    assignment_id: formData.get("assignment_id"),
    new_student_id: formData.get("new_student_id"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await guard.supabase
    .from("piket_assignments")
    .update({ student_id: parsed.data.new_student_id, completed: false })
    .eq("id", parsed.data.assignment_id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Siswa itu sudah ada di jadwal hari ini." };
    }
    return { ok: false, error: "Penggantian belum tersimpan. Coba lagi." };
  }

  await logAudit(guard.supabase, guard.userId, "piket.override",
    "piket_assignment", parsed.data.assignment_id,
    { new_student_id: parsed.data.new_student_id });

  revalidate();
  return { ok: true, message: "Petugas diganti." };
}

/** Tandai selesai / belum. */
export async function toggleCompleted(formData: FormData): Promise<void> {
  const guard = await teacherGuard();
  if (!guard.ok) return;

  const id = z.string().uuid().safeParse(formData.get("assignment_id"));
  const completed = formData.get("completed") === "true";
  if (!id.success) return;

  await guard.supabase
    .from("piket_assignments")
    .update({ completed })
    .eq("id", id.data);

  revalidate();
}

/** Kecualikan siswa dari piket pada tanggal tertentu (sakit, lomba, dst). */
export async function addExclusion(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = exclusionSchema.safeParse({
    student_id: formData.get("student_id"),
    exclusion_date: formData.get("exclusion_date"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await guard.supabase.from("piket_exclusions").upsert(
    { ...parsed.data, created_by: guard.userId },
    { onConflict: "student_id,exclusion_date" }
  );

  if (error) return { ok: false, error: "Belum tersimpan. Coba lagi." };

  revalidate();
  return {
    ok: true,
    message: "Dikecualikan. Berlaku saat jadwal tanggal itu di-generate/diacak ulang.",
  };
}

export async function removeExclusion(formData: FormData): Promise<void> {
  const guard = await teacherGuard();
  if (!guard.ok) return;

  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  await guard.supabase.from("piket_exclusions").delete().eq("id", id.data);
  revalidate();
}
