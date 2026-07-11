"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { createAdminClient, ADMIN_UNAVAILABLE } from "@/lib/supabase/admin";
import { generateTempPassword } from "@/lib/passwords";
import { logAudit } from "@/lib/audit";
import {
  createStudentSchema,
  profileUpdateSchema,
  resetPasswordSchema,
  setGenderSchema,
  setStatusSchema,
} from "@/lib/validation";
import { identifierToEmail } from "@/lib/constants";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

function revalidateStudents(id?: string) {
  revalidatePath("/teacher/students");
  if (id) revalidatePath(`/teacher/students/${id}`);
  revalidatePath("/teacher");
  revalidatePath("/teacher/piket");
}

/**
 * Teacher provisions a student account. The system generates a
 * temporary password (CSPRNG, server-side) which is returned ONCE
 * and never stored; the student must change it on first login.
 */
export async function createStudent(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = createStudentSchema.safeParse({
    full_name: formData.get("full_name"),
    nickname: formData.get("nickname"),
    username: formData.get("username"),
    gender: formData.get("gender"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: ADMIN_UNAVAILABLE };

  const email = identifierToEmail(parsed.data.username);
  const tempPassword = generateTempPassword();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      nickname: parsed.data.nickname,
      gender: parsed.data.gender,
      must_change_password: true,
    },
  });

  if (error) {
    if (
      error.code === "email_exists" ||
      /already.*(registered|exists)/i.test(error.message)
    ) {
      return {
        ok: false,
        error: `Username “${parsed.data.username}” sudah dipakai. Pilih yang lain.`,
        fieldErrors: { username: ["Username sudah dipakai."] },
      };
    }
    return { ok: false, error: "Akun belum berhasil dibuat. Coba sekali lagi." };
  }

  await logAudit(guard.supabase, guard.userId, "student.create", "profile",
    created?.user?.id, { username: parsed.data.username });

  revalidateStudents();
  return {
    ok: true,
    message: `Akun “${parsed.data.username}” berhasil dibuat. Serahkan password sementara ini kepada ${parsed.data.nickname} — hanya tampil sekali, dan siswa akan diminta menggantinya saat masuk pertama.`,
    secret: tempPassword,
  };
}

/**
 * Reset: generates a NEW temporary password (shown once) and flags
 * the account so the student must set their own on next login.
 * The old password is never known to anyone — only its hash existed.
 */
export async function resetStudentPassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = resetPasswordSchema.safeParse({
    user_id: formData.get("user_id"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { data: target } = await guard.supabase
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.user_id)
    .maybeSingle();
  if (!target || target.role !== "student") {
    return { ok: false, error: "Akun ini tidak dapat dikelola dari sini." };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: ADMIN_UNAVAILABLE };

  const tempPassword = generateTempPassword();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.user_id, {
    password: tempPassword,
  });
  if (error) {
    return { ok: false, error: "Password belum berhasil di-reset. Coba lagi." };
  }

  await admin
    .from("profiles")
    .update({ must_change_password: true })
    .eq("id", parsed.data.user_id);

  await logAudit(guard.supabase, guard.userId, "student.reset_password",
    "profile", parsed.data.user_id);

  revalidateStudents(parsed.data.user_id);
  return {
    ok: true,
    message:
      "Password sementara baru dibuat — hanya tampil sekali. Siswa akan diminta menggantinya saat masuk.",
    secret: tempPassword,
  };
}

/**
 * Nonaktifkan / aktifkan kembali akun — jalur utama pengelolaan
 * (bukan hapus). Nonaktif = diblokir login (ban di Supabase Auth)
 * + ditandai di profil; datanya tetap utuh.
 */
export async function setStudentStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = setStatusSchema.safeParse({
    user_id: formData.get("user_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { data: target } = await guard.supabase
    .from("profiles")
    .select("role")
    .eq("id", parsed.data.user_id)
    .maybeSingle();
  if (!target || target.role !== "student") {
    return { ok: false, error: "Akun ini tidak dapat dikelola dari sini." };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: ADMIN_UNAVAILABLE };

  const inactive = parsed.data.status === "inactive";
  const { error: banError } = await admin.auth.admin.updateUserById(
    parsed.data.user_id,
    { ban_duration: inactive ? "876000h" : "none" } // ±100 tahun / lepas
  );
  if (banError) {
    return { ok: false, error: "Status belum berhasil diubah. Coba lagi." };
  }

  const { error } = await admin
    .from("profiles")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.user_id);
  if (error) {
    return { ok: false, error: "Status belum berhasil diubah. Coba lagi." };
  }

  await logAudit(guard.supabase, guard.userId,
    inactive ? "student.deactivate" : "student.reactivate",
    "profile", parsed.data.user_id);

  revalidateStudents(parsed.data.user_id);
  return {
    ok: true,
    message: inactive
      ? "Akun dinonaktifkan. Siswa tidak bisa masuk, datanya tetap tersimpan."
      : "Akun diaktifkan kembali.",
  };
}

/**
 * Hapus permanen — BUKAN jalur default (gunakan nonaktifkan).
 * Tersisa untuk akun dummy/uji coba dan bersih-bersih antar tahun.
 */
export async function deleteStudent(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const id = z.string().uuid().safeParse(formData.get("user_id"));
  if (!id.success) return { ok: false, error: "Akun tidak ditemukan." };

  const { data: target } = await guard.supabase
    .from("profiles")
    .select("role, email")
    .eq("id", id.data)
    .maybeSingle();
  if (!target || target.role !== "student") {
    return { ok: false, error: "Akun ini tidak dapat dihapus dari sini." };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: ADMIN_UNAVAILABLE };

  // Log first — after deletion the FK target is gone.
  await logAudit(guard.supabase, guard.userId, "student.delete", "profile",
    id.data, { email: target.email });

  const { error } = await admin.auth.admin.deleteUser(id.data);
  if (error) {
    return { ok: false, error: "Akun belum berhasil dihapus. Coba lagi." };
  }

  revalidateStudents();
  redirect("/teacher/students");
}

/** Teacher edits a student's name & nickname (typos, formal records). */
export async function updateStudentName(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const id = z.string().uuid().safeParse(formData.get("user_id"));
  if (!id.success) return { ok: false, error: "Akun tidak ditemukan." };

  const parsed = profileUpdateSchema.safeParse({
    full_name: formData.get("full_name"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await guard.supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("role", "student");

  if (error) return { ok: false, error: "Belum tersimpan. Coba lagi." };

  revalidateStudents(id.data);
  return { ok: true, message: "Nama tersimpan." };
}

/** Teacher sets/corrects a student's gender (for piket balancing). */
export async function setStudentGender(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = setGenderSchema.safeParse({
    user_id: formData.get("user_id"),
    gender: formData.get("gender"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await guard.supabase
    .from("profiles")
    .update({ gender: parsed.data.gender })
    .eq("id", parsed.data.user_id)
    .eq("role", "student");

  if (error) return { ok: false, error: "Belum tersimpan. Coba lagi." };

  revalidateStudents(parsed.data.user_id);
  return { ok: true, message: "Tersimpan." };
}
