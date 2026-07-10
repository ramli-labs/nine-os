"use server";

import { revalidatePath } from "next/cache";
import { teacherGuard } from "@/lib/teacher-guard";
import { generatePiket } from "@/lib/piket";
import type { ActionResult } from "@/lib/types";

/**
 * (Re)generates the piket schedule from ALL registered students:
 * shuffled fairly, Mon–Fri sizes differ by ≤1, gender per day as
 * balanced as possible. Replaces the previous schedule atomically
 * enough for MVP (delete → insert).
 */
export async function regeneratePiket(
  _prev: ActionResult | null,
  _formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const { data: students, error: fetchError } = await guard.supabase
    .from("profiles")
    .select("id, gender")
    .eq("role", "student");

  if (fetchError) {
    return { ok: false, error: "Gagal membaca daftar siswa. Coba lagi." };
  }
  if (!students || students.length === 0) {
    return {
      ok: false,
      error: "Belum ada siswa terdaftar. Tambahkan akun siswa dulu.",
    };
  }

  const slots = generatePiket(students);

  const { error: deleteError } = await guard.supabase
    .from("piket_assignments")
    .delete()
    .gte("weekday", 1);
  if (deleteError) {
    return { ok: false, error: "Gagal menghapus jadwal lama. Coba lagi." };
  }

  const { error: insertError } = await guard.supabase
    .from("piket_assignments")
    .insert(slots);
  if (insertError) {
    return {
      ok: false,
      error:
        "Jadwal baru gagal disimpan. Muat ulang halaman lalu acak sekali lagi.",
    };
  }

  revalidatePath("/teacher/piket");
  revalidatePath("/piket");
  revalidatePath("/dashboard");

  const missingGender = students.filter((s) => !s.gender).length;
  return {
    ok: true,
    message:
      `Jadwal piket baru dibuat untuk ${students.length} siswa.` +
      (missingGender > 0
        ? ` Catatan: ${missingGender} siswa belum diisi jenis kelaminnya, jadi keseimbangan L/P belum optimal.`
        : ""),
  };
}
