"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { goalsSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function saveGoals(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const parsed = goalsSchema.safeParse({
    academic_goal: formData.get("academic_goal") ?? undefined,
    character_goal: formData.get("character_goal") ?? undefined,
    courage_goal: formData.get("courage_goal") ?? undefined,
    period: formData.get("period") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await supabase
    .from("goals")
    .upsert({ student_id: user.id, ...parsed.data }, { onConflict: "student_id" });

  if (error) return SAVE_FAILED;

  revalidatePath("/journey");
  return { ok: true, message: "Targetmu tersimpan." };
}
