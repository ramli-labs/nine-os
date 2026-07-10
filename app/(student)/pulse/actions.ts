"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pulseSchema } from "@/lib/validation";
import { currentWeekStart } from "@/lib/date";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function submitPulse(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const parsed = pulseSchema.safeParse({
    energy_level: formData.get("energy_level"),
    pressure_level: formData.get("pressure_level"),
    feeling: formData.get("feeling"),
    needs_help: formData.get("needs_help") ?? "false",
    help_category: formData.get("help_category") || null,
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await supabase.from("weekly_pulses").upsert(
    {
      student_id: user.id,
      week_start: currentWeekStart(),
      ...parsed.data,
    },
    { onConflict: "student_id,week_start" }
  );

  if (error) return SAVE_FAILED;

  revalidatePath("/pulse");
  revalidatePath("/dashboard");
  return { ok: true, message: "Denyut minggu ini tersimpan. Terima kasih!" };
}
