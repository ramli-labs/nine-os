"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const parsed = profileUpdateSchema.safeParse({
    full_name: formData.get("full_name"),
    nickname: formData.get("nickname"),
  });
  if (!parsed.success) return validationError(parsed.error);

  // Only safe fields — role/email/class cannot be changed from the app
  // (enforced by column-level grants + RLS, not just this code).
  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return SAVE_FAILED;

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil tersimpan." };
}
