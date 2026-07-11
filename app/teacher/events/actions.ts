"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { teacherGuard } from "@/lib/teacher-guard";
import { logAudit } from "@/lib/audit";
import { eventSchema } from "@/lib/validation";
import { fromJakartaInputValue } from "@/lib/date";
import { validationError, SAVE_FAILED } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

const idSchema = z.string().uuid();

function revalidate() {
  revalidatePath("/teacher/events");
  revalidatePath("/teacher");
  revalidatePath("/dashboard");
}

export async function saveEvent(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const guard = await teacherGuard();
  if (!guard.ok) return { ok: false, error: guard.error };

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    start_at: formData.get("start_at"),
    end_at: formData.get("end_at") ?? undefined,
    location: formData.get("location") ?? undefined,
  });
  if (!parsed.success) return validationError(parsed.error);

  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return SAVE_FAILED;

  const payload = {
    title: parsed.data.title,
    description: parsed.data.description,
    location: parsed.data.location,
    // Inputs are Jakarta wall time → store as UTC
    start_at: fromJakartaInputValue(parsed.data.start_at),
    end_at: parsed.data.end_at ? fromJakartaInputValue(parsed.data.end_at) : null,
  };

  const { error } = id
    ? await guard.supabase.from("events").update(payload).eq("id", id.data)
    : await guard.supabase
        .from("events")
        .insert({ ...payload, created_by: guard.userId });

  if (error) return SAVE_FAILED;

  await logAudit(guard.supabase, guard.userId,
    id ? "event.update" : "event.create",
    "event", id ? id.data : null, { title: parsed.data.title });

  revalidate();
  return { ok: true, message: "Agenda tersimpan." };
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const guard = await teacherGuard();
  if (!guard.ok) return;

  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return;

  await logAudit(guard.supabase, guard.userId, "event.delete", "event", id.data);
  await guard.supabase.from("events").delete().eq("id", id.data);
  revalidate();
}
