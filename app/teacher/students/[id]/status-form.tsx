"use client";

import { useActionState, useState } from "react";
import { UserX, UserCheck, Loader2 } from "lucide-react";
import { setStudentStatus } from "../actions";
import type { AccountStatus, ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorNote, SuccessNote } from "@/components/ui/feedback";

/** Nonaktifkan/aktifkan akun — jalur pengelolaan utama (bukan hapus). */
export function StatusForm({
  userId,
  current,
}: {
  userId: string;
  current: AccountStatus;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    setStudentStatus,
    null
  );
  const [confirming, setConfirming] = useState(false);
  const deactivating = current === "active";

  return (
    <div className="space-y-3">
      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      {!confirming ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={deactivating ? "text-amber-800" : "text-emerald-800"}
          onClick={() => setConfirming(true)}
        >
          {deactivating ? (
            <UserX className="h-4 w-4" aria-hidden />
          ) : (
            <UserCheck className="h-4 w-4" aria-hidden />
          )}
          {deactivating ? "Nonaktifkan akun" : "Aktifkan kembali"}
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
          <input
            type="hidden"
            name="status"
            value={deactivating ? "inactive" : "active"}
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : deactivating ? (
              <UserX className="h-4 w-4" aria-hidden />
            ) : (
              <UserCheck className="h-4 w-4" aria-hidden />
            )}
            {deactivating
              ? "Ya, nonaktifkan (data tetap tersimpan)"
              : "Ya, aktifkan kembali"}
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
