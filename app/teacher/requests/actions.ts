"use server";

import { revalidatePath } from "next/cache";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { requestStatusUpdateSchema, requestNoteSchema } from "@/lib/validation";
import { fromJakartaInputValue } from "@/lib/date";
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

  await logAudit(guard.supabase, guard.userId, "request.status_change",
    "wali_request", parsed.data.id, { status: parsed.data.status });

  revalidatePath("/teacher/requests");
  revalidatePath(`/teacher/requests/${parsed.data.id}`);
  revalidatePath("/teacher");
  return { ok: true, message: "Status diperbarui." };
}

/**
 * Catatan tindak lanjut wali kelas — disimpan di tabel terpisah
 * (wali_request_notes) yang RLS-nya teacher-only, sehingga siswa
 * tidak mungkin membacanya lewat jalur mana pun.
 */
export async function saveRequestNote(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = requestNoteSchema.safeParse({
    request_id: formData.get("request_id"),
    teacher_note: formData.get("teacher_note") ?? undefined,
    follow_up_at: formData.get("follow_up_at") ?? undefined,
    closed_reason: formData.get("closed_reason") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await guard.supabase.from("wali_request_notes").upsert(
    {
      request_id: parsed.data.request_id,
      teacher_note: parsed.data.teacher_note,
      follow_up_at: parsed.data.follow_up_at
        ? fromJakartaInputValue(parsed.data.follow_up_at)
        : null,
      closed_reason: parsed.data.closed_reason,
      updated_by: guard.userId,
    },
    { onConflict: "request_id" }
  );

  if (error) {
    return { ok: false, error: "Catatan belum tersimpan. Coba lagi." };
  }

  await logAudit(guard.supabase, guard.userId, "request.note_save",
    "wali_request", parsed.data.request_id);

  revalidatePath(`/teacher/requests/${parsed.data.request_id}`);
  return { ok: true, message: "Catatan tindak lanjut tersimpan." };
}
