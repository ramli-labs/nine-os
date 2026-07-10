import type { ZodError } from "zod";
import type { ActionResult } from "@/lib/types";

export function validationError(error: ZodError): ActionResult {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return {
    ok: false,
    error: "Ada isian yang belum tepat. Periksa kembali, ya.",
    fieldErrors,
  };
}

export const SAVE_FAILED: ActionResult = {
  ok: false,
  error: "Jawabanmu belum berhasil disimpan. Coba sekali lagi.",
};
