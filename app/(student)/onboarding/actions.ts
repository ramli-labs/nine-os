"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import { FUTURE_PLAN_OPTIONS, PROBLEM_RESPONSE_OPTIONS } from "./options";
import type { ActionResult } from "@/lib/types";

const requiredText = (max: number) =>
  z
    .string({ message: "Bagian ini perlu diisi." })
    .trim()
    .min(1, "Bagian ini perlu diisi.")
    .max(max, `Maksimal ${max} karakter.`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .optional()
    .transform((v) => (v ? v : null));

const step1Schema = z.object({
  nickname: requiredText(40),
  three_words: requiredText(120),
  strengths: requiredText(1000),
  growth_area: requiredText(1000),
});

const step2Schema = z.object({
  hope: requiredText(1000),
  concern: requiredText(1000),
});

const step4Schema = z.object({
  support_note: optionalText(2000),
  private_note_to_teacher: optionalText(2000),
});

/**
 * Onboarding 4 langkah — setiap langkah tersimpan sendiri (autosave
 * per step), sehingga siswa bisa berhenti dan melanjutkan kapan pun.
 */
export async function saveKenaliSaya(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const step = Number(formData.get("step"));
  if (![1, 2, 3, 4].includes(step)) {
    return { ok: false, error: "Langkah tidak dikenal. Muat ulang halaman." };
  }

  let payload: Record<string, string | null> = {};

  if (step === 1) {
    const parsed = step1Schema.safeParse({
      nickname: formData.get("nickname"),
      three_words: formData.get("three_words"),
      strengths: formData.get("strengths"),
      growth_area: formData.get("growth_area"),
    });
    if (!parsed.success) return validationError(parsed.error);

    // Nama panggilan tersimpan di profil (dipakai sapaan seluruh app).
    const { error: nickError } = await supabase
      .from("profiles")
      .update({ nickname: parsed.data.nickname })
      .eq("id", user.id);
    if (nickError) return SAVE_FAILED;

    payload = {
      three_words: parsed.data.three_words,
      strengths: parsed.data.strengths,
      growth_area: parsed.data.growth_area,
    };
  }

  if (step === 2) {
    const parsed = step2Schema.safeParse({
      hope: formData.get("hope"),
      concern: formData.get("concern"),
    });
    if (!parsed.success) return validationError(parsed.error);

    const choice = String(formData.get("future_plan_choice") ?? "").trim();
    const other = String(formData.get("future_plan_other") ?? "").trim();
    let future_plan: string | null = null;
    if (choice && (FUTURE_PLAN_OPTIONS as readonly string[]).includes(choice)) {
      future_plan =
        choice === "Lainnya" ? (other ? `Lainnya: ${other.slice(0, 200)}` : null) : choice;
    }

    payload = { ...parsed.data, future_plan };
  }

  if (step === 3) {
    const chosen = formData
      .getAll("problem_response")
      .map(String)
      .filter((v) => (PROBLEM_RESPONSE_OPTIONS as readonly string[]).includes(v));
    const other = String(formData.get("problem_response_other") ?? "").trim();
    const parts = [...chosen];
    if (other) parts.push(`Lainnya: ${other.slice(0, 200)}`);
    payload = { problem_response: parts.length > 0 ? parts.join(", ") : null };
  }

  if (step === 4) {
    const parsed = step4Schema.safeParse({
      support_note: formData.get("support_note") ?? undefined,
      private_note_to_teacher:
        formData.get("private_note_to_teacher") ?? undefined,
    });
    if (!parsed.success) return validationError(parsed.error);
    payload = parsed.data;
  }

  const { error } = await supabase
    .from("student_profiles")
    .upsert({ user_id: user.id, ...payload }, { onConflict: "user_id" });

  if (error) return SAVE_FAILED;

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true };
}
