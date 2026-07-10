"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { studentProfileSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

const ALLOWED_KEYS = [
  "three_words",
  "strengths",
  "growth_area",
  "hope",
  "concern",
  "future_plan",
  "problem_response",
  "support_note",
  "private_note_to_teacher",
] as const;

/**
 * Saves whichever "Kenali Saya" fields are present in the submission —
 * lets each wizard step persist independently without erasing the rest.
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

  const presentKeys = ALLOWED_KEYS.filter((k) => formData.has(k));
  if (presentKeys.length === 0) {
    return { ok: false, error: "Tidak ada jawaban untuk disimpan." };
  }

  const raw: Record<string, FormDataEntryValue | undefined> = {};
  for (const key of presentKeys) raw[key] = formData.get(key) ?? undefined;

  const parsed = studentProfileSchema.safeParse(raw);
  if (!parsed.success) return validationError(parsed.error);

  // Only persist the fields that were actually submitted in this step.
  const payload: Record<string, string | null> = {};
  for (const key of presentKeys) payload[key] = parsed.data[key];

  const { error } = await supabase
    .from("student_profiles")
    .upsert({ user_id: user.id, ...payload }, { onConflict: "user_id" });

  if (error) return SAVE_FAILED;

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true };
}
