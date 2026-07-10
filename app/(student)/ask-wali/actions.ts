"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { waliRequestSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function submitWaliRequest(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const parsed = waliRequestSchema.safeParse({
    category: formData.get("category"),
    urgency: formData.get("urgency"),
    message: formData.get("message"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await supabase.from("wali_requests").insert({
    student_id: user.id,
    ...parsed.data,
    // status is forced to 'submitted' by RLS — no client override possible
  });

  if (error) return SAVE_FAILED;

  revalidatePath("/ask-wali");
  return {
    ok: true,
    message:
      "Pesanmu sudah terkirim ke wali kelas. Kamu bisa memantau statusnya di halaman ini.",
  };
}
