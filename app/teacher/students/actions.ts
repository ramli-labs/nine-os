"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { createAdminClient, ADMIN_UNAVAILABLE } from "@/lib/supabase/admin";
import {
  createStudentSchema,
  resetPasswordSchema,
  setGenderSchema,
} from "@/lib/validation";
import { identifierToEmail } from "@/lib/constants";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

/**
 * Teacher provisions a student account (username + password).
 * Layered protection: teacherGuard (role from DB, server-side) →
 * service-role admin client (server-only module) → auth trigger still
 * forces role='student' on the new profile.
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
    password: formData.get("password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: ADMIN_UNAVAILABLE };

  const email = identifierToEmail(parsed.data.username);
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      nickname: parsed.data.nickname,
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
    return {
      ok: false,
      error: "Akun belum berhasil dibuat. Coba sekali lagi.",
    };
  }

  // Profile row is created by the auth trigger; record the gender
  // (used by the piket generator to balance duty groups).
  if (created?.user) {
    await admin
      .from("profiles")
      .update({ gender: parsed.data.gender })
      .eq("id", created.user.id);
  }

  revalidatePath("/teacher/students");
  return {
    ok: true,
    message: `Akun “${parsed.data.username}” berhasil dibuat. Catat dan serahkan password ini kepada ${parsed.data.nickname} — demi keamanan, password tidak akan ditampilkan lagi.`,
  };
}

/**
 * Teacher permanently deletes a student account. All of the student's
 * data (profile, pulses, requests, goals, time capsule, piket slot)
 * is wiped by ON DELETE CASCADE. Useful for dummy accounts and for
 * resetting the class at the start of a new school year.
 */
export async function deleteStudent(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const id = z.string().uuid().safeParse(formData.get("user_id"));
  if (!id.success) return { ok: false, error: "Akun tidak ditemukan." };

  // Only student accounts can be deleted — never a teacher.
  const { data: target } = await guard.supabase
    .from("profiles")
    .select("role, nickname, full_name")
    .eq("id", id.data)
    .maybeSingle();
  if (!target || target.role !== "student") {
    return { ok: false, error: "Akun ini tidak dapat dihapus dari sini." };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: ADMIN_UNAVAILABLE };

  const { error } = await admin.auth.admin.deleteUser(id.data);
  if (error) {
    return { ok: false, error: "Akun belum berhasil dihapus. Coba lagi." };
  }

  revalidatePath("/teacher/students");
  revalidatePath("/teacher/piket");
  revalidatePath("/teacher");
  redirect("/teacher/students");
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

  revalidatePath(`/teacher/students/${parsed.data.user_id}`);
  revalidatePath("/teacher/piket");
  return { ok: true, message: "Tersimpan." };
}

/** Teacher resets a student's password (no email recovery flow needed). */
export async function resetStudentPassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = resetPasswordSchema.safeParse({
    user_id: formData.get("user_id"),
    password: formData.get("password"),
  });
  if (!parsed.success) return validationError(parsed.error);

  // Only student accounts can be managed from the app — never other
  // teachers (defense-in-depth on top of the role guard).
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

  const { error } = await admin.auth.admin.updateUserById(
    parsed.data.user_id,
    { password: parsed.data.password }
  );

  if (error) {
    return { ok: false, error: "Password belum berhasil diubah. Coba lagi." };
  }

  return {
    ok: true,
    message:
      "Password baru tersimpan. Serahkan kepada siswa — tidak akan ditampilkan lagi.",
  };
}
