"use client";

import { useActionState } from "react";
import { saveRequestNote } from "../actions";
import type { ActionResult, RequestStatus, WaliRequestNote } from "@/lib/types";
import { toJakartaInputValue } from "@/lib/date";
import { Input, Label, Textarea, FieldError, Hint } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

/** Catatan tindak lanjut — hanya terlihat oleh wali kelas. */
export function NoteForm({
  requestId,
  status,
  existing,
}: {
  requestId: string;
  status: RequestStatus;
  existing: WaliRequestNote | null;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveRequestNote,
    null
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="request_id" value={requestId} />

      <div>
        <p className="text-sm font-medium text-navy-800">
          Catatan tindak lanjut
        </p>
        <Hint>Hanya kamu yang bisa membaca bagian ini — tidak tampil untuk siswa.</Hint>
      </div>

      <div>
        <Label htmlFor="teacher_note">Catatan</Label>
        <Textarea
          id="teacher_note"
          name="teacher_note"
          rows={4}
          maxLength={4000}
          placeholder="Apa yang sudah/akan kamu lakukan, konteks penting, dsb."
          defaultValue={existing?.teacher_note ?? ""}
          className="mt-1.5"
        />
        <FieldError message={fe?.teacher_note?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="follow_up_at">Rencana tindak lanjut (opsional)</Label>
          <Input
            id="follow_up_at"
            name="follow_up_at"
            type="datetime-local"
            defaultValue={
              existing?.follow_up_at
                ? toJakartaInputValue(existing.follow_up_at)
                : ""
            }
            className="mt-1.5"
          />
          <FieldError message={fe?.follow_up_at?.[0]} />
        </div>
        {status === "closed" ? (
          <div>
            <Label htmlFor="closed_reason">Alasan penutupan</Label>
            <Input
              id="closed_reason"
              name="closed_reason"
              maxLength={500}
              placeholder="Contoh: sudah dibicarakan langsung"
              defaultValue={existing?.closed_reason ?? ""}
              className="mt-1.5"
            />
            <FieldError message={fe?.closed_reason?.[0]} />
          </div>
        ) : null}
      </div>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton size="sm" pendingText="Menyimpan…">
        Simpan catatan
      </SubmitButton>
    </form>
  );
}
