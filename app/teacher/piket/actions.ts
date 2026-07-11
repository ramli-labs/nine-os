"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { pickDutyTeam, type DutyCandidate } from "@/lib/piket";
import {
  generatePiketSchema,
  overridePiketSchema,
  exclusionSchema,
} from "@/lib/validation";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult, Gender } from "@/lib/types";

function revalidate(date?: string) {
  revalidatePath("/teacher/piket");
  revalidatePath("/piket");
  revalidatePath("/dashboard");
  void date;
}

function previousDay(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/**
 * Generate/regenerate petugas piket untuk satu tanggal.
 * Fairness: beban historis terendah dulu, hindari petugas kemarin,
 * seimbangkan L/P, acak hanya di antara yang setara. Jadwal yang
 * sudah ada TIDAK ditimpa tanpa confirm_overwrite.
 */
export async function generateDailyPiket(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = generatePiketSchema.safeParse({
    duty_date: formData.get("duty_date"),
    team_size: formData.get("team_size"),
    confirm_overwrite: formData.get("confirm_overwrite") ?? "false",
  });
  if (!parsed.success) return validationError(parsed.error);
  const { duty_date, team_size, confirm_overwrite } = parsed.data;

  // 8. Jangan menimpa jadwal yang sudah ada tanpa konfirmasi.
  const { data: existing } = await guard.supabase
    .from("piket_schedules")
    .select("id")
    .eq("duty_date", duty_date)
    .maybeSingle();
  if (existing && !confirm_overwrite) {
    return {
      ok: false,
      error:
        "Jadwal untuk tanggal ini sudah ada. Gunakan “Acak ulang” bila memang ingin menggantinya.",
    };
  }

  // 1. Siswa aktif.
  const { data: students } = await guard.supabase
    .from("profiles")
    .select("id, gender")
    .eq("role", "student")
    .eq("status", "active");
  if (!students || students.length === 0) {
    return { ok: false, error: "Belum ada siswa aktif." };
  }

  // 2. Exclusions pada tanggal tsb.
  const { data: exclusions } = await guard.supabase
    .from("piket_exclusions")
    .select("student_id")
    .eq("exclusion_date", duty_date);
  const excluded = new Set((exclusions ?? []).map((e) => e.student_id));

  // 3. Riwayat beban per siswa (semua tanggal SELAIN tanggal ini).
  const { data: history } = await guard.supabase
    .from("piket_assignments")
    .select("student_id, piket_schedules!inner(duty_date)")
    .neq("piket_schedules.duty_date", duty_date);
  const counts = new Map<string, number>();
  for (const row of history ?? []) {
    counts.set(row.student_id, (counts.get(row.student_id) ?? 0) + 1);
  }

  // 5. Petugas kemarin.
  const { data: yesterday } = await guard.supabase
    .from("piket_assignments")
    .select("student_id, piket_schedules!inner(duty_date)")
    .eq("piket_schedules.duty_date", previousDay(duty_date));
  const servedYesterday = new Set(
    (yesterday ?? []).map((r) => r.student_id)
  );

  const candidates: DutyCandidate[] = students
    .filter((s) => !excluded.has(s.id))
    .map((s) => ({
      id: s.id,
      gender: (s.gender as Gender | null) ?? null,
      historyCount: counts.get(s.id) ?? 0,
      servedYesterday: servedYesterday.has(s.id),
    }));
  if (candidates.length === 0) {
    return {
      ok: false,
      error: "Semua siswa ter-exclude pada tanggal ini — periksa daftar pengecualian.",
    };
  }

  const team = pickDutyTeam(candidates, Math.min(team_size, candidates.length));

  // Ganti jadwal lama (bila ada, dan sudah dikonfirmasi).
  if (existing) {
    const { error: delError } = await guard.supabase
      .from("piket_schedules")
      .delete()
      .eq("id", existing.id);
    if (delError) {
      return { ok: false, error: "Gagal mengganti jadwal lama. Coba lagi." };
    }
  }

  const { data: schedule, error: schedError } = await guard.supabase
    .from("piket_schedules")
    .insert({ duty_date, generated_by: guard.userId })
    .select("id")
    .single();
  if (schedError || !schedule) {
    return { ok: false, error: "Jadwal belum berhasil dibuat. Coba lagi." };
  }

  const { error: assignError } = await guard.supabase
    .from("piket_assignments")
    .insert(team.map((student_id) => ({ schedule_id: schedule.id, student_id })));
  if (assignError) {
    return { ok: false, error: "Petugas belum tersimpan. Acak sekali lagi." };
  }

  await logAudit(guard.supabase, guard.userId,
    existing ? "piket.regenerate" : "piket.generate",
    "piket_schedule", schedule.id,
    { duty_date, team_size: team.length });

  revalidate(duty_date);
  return {
    ok: true,
    message: `Jadwal ${duty_date} dibuat — ${team.length} petugas, mendahulukan yang paling jarang piket.`,
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
