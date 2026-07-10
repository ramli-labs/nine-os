"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dices, KeyRound } from "lucide-react";
import { resetStudentPassword } from "../actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    resetStudentPassword,
    null
  );
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  if (!open) {
    return (
      <div className="space-y-3">
        {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setPassword(generatePassword());
            setOpen(true);
          }}
        >
          <KeyRound className="h-4 w-4" aria-hidden />
          Atur ulang password
        </Button>
      </div>
    );
  }

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <input type="hidden" name="user_id" value={userId} />
      <Label htmlFor="new-password">Password baru</Label>
      <div className="flex gap-2">
        <Input
          id="new-password"
          name="password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setPassword(generatePassword())}
        >
          <Dices className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <FieldError message={fe?.password?.[0]} />
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
      <p className="text-xs text-navy-500">
        Catat dan serahkan kepada siswa — setelah disimpan, password tidak
        ditampilkan lagi.
      </p>
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Menyimpan…">
          Simpan password baru
        </SubmitButton>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Batal
        </Button>
      </div>
    </form>
  );
}
