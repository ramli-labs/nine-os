"use server";

import { revalidatePath } from "next/cache";
import { teacherGuard } from "@/lib/teacher-guard";
import { requestStatusUpdateSchema } from "@/lib/validation";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

export async function updateRequestStatus(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = requestStatusUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await guard.supabase
    .from("wali_requests")
    .update({
      status: parsed.data.status,
      closed_at: parsed.data.status === "closed" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    return { ok: false, error: "Status belum berhasil diperbarui. Coba lagi." };
  }

  revalidatePath("/teacher/requests");
  revalidatePath(`/teacher/requests/${parsed.data.id}`);
  revalidatePath("/teacher");
  return { ok: true, message: "Status diperbarui." };
}
