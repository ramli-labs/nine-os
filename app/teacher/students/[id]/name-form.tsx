"use client";

import { useActionState, useState } from "react";
import { PenLine, X } from "lucide-react";
import { updateStudentName } from "../actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

/** Inline editor for a student's full name & nickname. */
export function NameForm({
  userId,
  fullName,
  nickname,
}: {
  userId: string;
  fullName: string;
  nickname: string;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateStudentName,
    null
  );
  const [open, setOpen] = useState(false);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  if (!open) {
    return (
      <div className="space-y-2">
        {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2"
          onClick={() => setOpen(true)}
        >
          <PenLine className="h-3.5 w-3.5" aria-hidden />
          Ubah nama / panggilan
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="max-w-md space-y-3 rounded-xl border border-navy-200 bg-white/70 p-4">
      <input type="hidden" name="user_id" value={userId} />
      <div>
        <Label htmlFor="edit-full-name">Nama lengkap</Label>
        <Input
          id="edit-full-name"
          name="full_name"
          defaultValue={fullName}
          required
          maxLength={100}
          className="mt-1.5"
        />
        <FieldError message={fe?.full_name?.[0]} />
      </div>
      <div>
        <Label htmlFor="edit-nickname">Nama panggilan</Label>
        <Input
          id="edit-nickname"
          name="nickname"
          defaultValue={nickname}
          required
          maxLength={40}
          className="mt-1.5"
        />
        <FieldError message={fe?.nickname?.[0]} />
      </div>
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Menyimpan…">
          Simpan
        </SubmitButton>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Tutup
        </Button>
      </div>
    </form>
  );
}
