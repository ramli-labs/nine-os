"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { changeOwnPassword } from "./actions";
import type { ActionResult } from "@/lib/types";
import { Input, Label, FieldError, Hint } from "@/components/ui/field";
import { SubmitButton, ErrorNote } from "@/components/ui/feedback";

export function ChangePasswordForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    changeOwnPassword,
    null
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="password">Password baru</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className="mt-1.5"
        />
        <FieldError message={fe?.password?.[0]} />
        <Hint>Minimal 8 karakter. Pilih yang mudah kamu ingat, sulit ditebak teman.</Hint>
      </div>
      <div>
        <Label htmlFor="confirm">Ulangi password baru</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          className="mt-1.5"
        />
        <FieldError message={fe?.confirm?.[0]} />
      </div>

      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton className="w-full" pendingText="Menyimpan…">
        <KeyRound className="h-4 w-4" aria-hidden />
        Simpan password baru
      </SubmitButton>
    </form>
  );
}
