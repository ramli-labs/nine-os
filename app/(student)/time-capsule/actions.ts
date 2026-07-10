"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { timeCapsuleSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function saveTimeCapsule(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const parsed = timeCapsuleSchema.safeParse({
    current_feeling: formData.get("current_feeling") ?? undefined,
    desired_change: formData.get("desired_change") ?? undefined,
    self_proof: formData.get("self_proof") ?? undefined,
    future_message: formData.get("future_message"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await supabase.from("time_capsules").upsert(
    {
      student_id: user.id,
      unlock_date: "2027-06-01",
      ...parsed.data,
    },
    { onConflict: "student_id" }
  );

  if (error) return SAVE_FAILED;

  revalidatePath("/time-capsule");
  return {
    ok: true,
    message: "Suratmu tersimpan rapat hingga Juni 2027.",
  };
}
