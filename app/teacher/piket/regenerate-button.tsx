"use client";

import { useActionState, useState } from "react";
import { Shuffle, Loader2 } from "lucide-react";
import { regeneratePiket } from "./actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { SuccessNote, ErrorNote } from "@/components/ui/feedback";

export function RegenerateButton({ hasSchedule }: { hasSchedule: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    regeneratePiket,
    null
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-3">
      <form
        action={(fd) => {
          setConfirming(false);
          action(fd);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        {!hasSchedule || confirming || state?.ok ? (
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Shuffle className="h-4 w-4" aria-hidden />
            )}
            {hasSchedule ? "Ya, acak ulang sekarang" : "Buat jadwal piket"}
          </Button>
        ) : (
          <Button type="button" onClick={() => setConfirming(true)}>
            <Shuffle className="h-4 w-4" aria-hidden />
            Acak ulang jadwal
          </Button>
        )}
        {confirming ? (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirming(false)}
            >
              Batal
            </Button>
            <span className="text-xs text-navy-500">
              Jadwal lama akan diganti seluruhnya.
            </span>
          </>
        ) : null}
      </form>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
    </div>
  );
}
