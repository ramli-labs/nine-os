"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { charterItemSchema } from "@/lib/validation";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

const idSchema = z.string().uuid();

function revalidate() {
  revalidatePath("/teacher/charter");
  revalidatePath("/class-charter");
  revalidatePath("/kesepakatan");
}

export async function saveCharterItem(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = charterItemSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    display_order: formData.get("display_order") ?? 0,
    is_active: formData.get("is_active") ?? "false",
  });
  if (!parsed.success) return validationError(parsed.error);

  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return SAVE_FAILED;

  const { error } = id
    ? await guard.supabase
        .from("class_charter_items")
        .update(parsed.data)
        .eq("id", id.data)
    : await guard.supabase
        .from("class_charter_items")
        .insert({ ...parsed.data, created_by: guard.userId });

  if (error) return SAVE_FAILED;

  await logAudit(guard.supabase, guard.userId,
    id ? "charter.update" : "charter.create",
    "charter_item", id ? id.data : null, { title: parsed.data.title });

  revalidate();
  return { ok: true, message: "Kesepakatan tersimpan." };
}

export async function deleteCharterItem(formData: FormData): Promise<void> {
  const guard = await teacherGuard();
  if (!guard.ok) return;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  await logAudit(guard.supabase, guard.userId, "charter.delete",
    "charter_item", id.data);
  await guard.supabase.from("class_charter_items").delete().eq("id", id.data);
  revalidate();
}
