"use client";

import { useActionState, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { resetStudentPassword } from "../actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorNote, OneTimeSecret, SuccessNote } from "@/components/ui/feedback";

/**
 * Reset menghasilkan password sementara BARU dari sistem — password
 * lama tidak pernah diketahui siapa pun (hanya hash yang tersimpan).
 */
export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    resetStudentPassword,
    null
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-3">
      {state?.ok ? (
        <>
          <SuccessNote>{state.message}</SuccessNote>
          {state.secret ? <OneTimeSecret secret={state.secret} /> : null}
        </>
      ) : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      {!confirming ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirming(true)}
        >
          <KeyRound className="h-4 w-4" aria-hidden />
          Atur ulang password
        </Button>
      ) : (
        <form
          action={(fd) => {
            setConfirming(false);
            action(fd);
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="user_id" value={userId} />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <KeyRound className="h-4 w-4" aria-hidden />
            )}
            Ya, buatkan password sementara baru
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
          >
            Batal
          </Button>
        </form>
      )}
    </div>
  );
}
