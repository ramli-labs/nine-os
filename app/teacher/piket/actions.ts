"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { distributeAcrossWeek, type WeekStudent } from "@/lib/piket";
import {
  generateWeekSchema,
  overridePiketSchema,
  exclusionSchema,
} from "@/lib/validation";
import { weekMondayOf, weekdayDates } from "@/lib/date";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult, Gender } from "@/lib/types";

function revalidate() {
  revalidatePath("/teacher/piket");
  revalidatePath("/piket");
  revalidatePath("/dashboard");
}

/**
 * Generate/regenerate jadwal piket SATU MINGGU (Senin–Jumat) sekaligus.
 * Seluruh siswa aktif dibagi rata ke 5 hari — tiap siswa piket sekali
 * seminggu — dengan L/P disebar merata antar hari. Jadwal minggu yang
 * sudah ada TIDAK ditimpa tanpa confirm_overwrite.
 */
export async function generateWeekPiket(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = generateWeekSchema.safeParse({
    week_ref: formData.get("week_ref"),
    confirm_overwrite: formData.get("confirm_overwrite") ?? "false",
  });
  if (!parsed.success) return validationError(parsed.error);

  const monday = weekMondayOf(parsed.data.week_ref);
  const dates = weekdayDates(monday); // [Senin … Jumat]

  // Jangan menimpa jadwal minggu ini tanpa konfirmasi.
  const { data: existing } = await guard.supabase
    .from("piket_schedules")
    .select("id")
    .in("duty_date", dates);
  if (existing && existing.length > 0 && !parsed.data.confirm_overwrite) {
    return {
      ok: false,
      error:
        "Jadwal untuk minggu ini sudah ada. Gunakan “Acak ulang minggu” bila memang ingin menggantinya.",
    };
  }

  // Siswa aktif.
  const { data: students } = await guard.supabase
    .from("profiles")
    .select("id, gender")
    .eq("role", "student")
    .eq("status", "active");
  if (!students || students.length === 0) {
    return { ok: false, error: "Belum ada siswa aktif." };
  }

  const roster: WeekStudent[] = students.map((s) => ({
    id: s.id,
    gender: (s.gender as Gender | null) ?? null,
  }));
  const perDay = distributeAcrossWeek(roster); // 5 kelompok id

  // Ganti jadwal minggu lama bila ada (cascade menghapus assignment).
  if (existing && existing.length > 0) {
    const { error: delError } = await guard.supabase
      .from("piket_schedules")
      .delete()
      .in("duty_date", dates);
    if (delError) {
      return { ok: false, error: "Gagal mengganti jadwal lama. Coba lagi." };
    }
  }

  // Buat 5 jadwal harian.
  const { data: schedules, error: schedError } = await guard.supabase
    .from("piket_schedules")
    .insert(dates.map((duty_date) => ({ duty_date, generated_by: guard.userId })))
    .select("id, duty_date");
  if (schedError || !schedules || schedules.length !== dates.length) {
    return { ok: false, error: "Jadwal belum berhasil dibuat. Coba lagi." };
  }

  // Susun assignment: cocokkan tiap hari ke jadwal-nya.
  const scheduleByDate = new Map<string, string>(
    schedules.map((s) => [s.duty_date as string, s.id as string])
  );
  const rows: { schedule_id: string; student_id: string }[] = [];
  dates.forEach((date, i) => {
    const scheduleId = scheduleByDate.get(date);
    if (!scheduleId) return;
    for (const student_id of perDay[i]) {
      rows.push({ schedule_id: scheduleId, student_id });
    }
  });

  if (rows.length > 0) {
    const { error: assignError } = await guard.supabase
      .from("piket_assignments")
      .insert(rows);
    if (assignError) {
      return { ok: false, error: "Petugas belum tersimpan. Acak sekali lagi." };
    }
  }

  await logAudit(guard.supabase, guard.userId,
    existing && existing.length > 0 ? "piket.regenerate_week" : "piket.generate_week",
    "piket_schedule", schedules[0]?.id,
    { week_start: monday, students: rows.length });

  revalidate();
  return {
    ok: true,
    message: `Jadwal minggu ${monday} dibuat — ${students.length} siswa dibagi rata ke Senin–Jumat.`,
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
