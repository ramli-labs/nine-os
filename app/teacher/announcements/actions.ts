"use server";

import { revalidatePath } from "next/cache";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { announcementSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";
import { z } from "zod";

const idSchema = z.string().uuid();

function revalidate() {
  revalidatePath("/teacher/announcements");
  revalidatePath("/teacher");
  revalidatePath("/dashboard");
}

export async function saveAnnouncement(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    is_published: formData.get("is_published") ?? "false",
  });
  if (!parsed.success) return validationError(parsed.error);

  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return SAVE_FAILED;

  const payload = {
    ...parsed.data,
    published_at: parsed.data.is_published ? new Date().toISOString() : null,
  };

  const { error } = id
    ? await guard.supabase
        .from("announcements")
        .update(payload)
        .eq("id", id.data)
    : await guard.supabase
        .from("announcements")
        .insert({ ...payload, created_by: guard.userId });

  if (error) return SAVE_FAILED;

  await logAudit(guard.supabase, guard.userId,
    id ? "announcement.update" : "announcement.create",
    "announcement", id ? id.data : null, { title: parsed.data.title });

  revalidate();
  return { ok: true, message: "Pengumuman tersimpan." };
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const guard = await teacherGuard();
  if (!guard.ok) return;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  await logAudit(guard.supabase, guard.userId, "announcement.delete",
    "announcement", id.data);
  await guard.supabase.from("announcements").delete().eq("id", id.data);
  revalidate();
}
