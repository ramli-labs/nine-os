"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { resourceSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

const idSchema = z.string().uuid();

function revalidate() {
  revalidatePath("/teacher/resources");
  revalidatePath("/resources");
}

export async function saveResource(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = resourceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    content: formData.get("content") ?? undefined,
    url: formData.get("url") ?? "",
    category: formData.get("category"),
    is_published: formData.get("is_published") ?? "false",
  });
  if (!parsed.success) return validationError(parsed.error);

  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return SAVE_FAILED;

  const { error } = id
    ? await guard.supabase
        .from("resources")
        .update(parsed.data)
        .eq("id", id.data)
    : await guard.supabase
        .from("resources")
        .insert({ ...parsed.data, created_by: guard.userId });

  if (error) return SAVE_FAILED;

  await logAudit(guard.supabase, guard.userId,
    id ? "resource.update" : "resource.create",
    "resource", id ? id.data : null, { title: parsed.data.title });

  revalidate();
  return { ok: true, message: "Materi tersimpan." };
}

export async function deleteResource(formData: FormData): Promise<void> {
  const guard = await teacherGuard();
  if (!guard.ok) return;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  await logAudit(guard.supabase, guard.userId, "resource.delete",
    "resource", id.data);
  await guard.supabase.from("resources").delete().eq("id", id.data);
  revalidate();
}
