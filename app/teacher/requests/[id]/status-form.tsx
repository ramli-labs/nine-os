"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { updateRequestStatus } from "../actions";
import { STATUS_LABELS } from "@/lib/labels";
import type { ActionResult, RequestStatus } from "@/lib/types";
import { ErrorNote, SuccessNote } from "@/components/ui/feedback";
import { Loader2 } from "lucide-react";

const flow: RequestStatus[] = ["submitted", "seen", "follow_up", "closed"];

export function StatusForm({
  requestId,
  current,
}: {
  requestId: string;
  current: RequestStatus;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateRequestStatus,
    null
  );

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-navy-800">Perbarui status</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {flow.map((s) => (
          // Satu form per tombol dengan status sebagai input tersembunyi —
          // menjamin nilainya selalu terkirim ke server action.
          <form key={s} action={action} className="contents">
            <input type="hidden" name="id" value={requestId} />
            <input type="hidden" name="status" value={s} />
            <button
              type="submit"
              disabled={pending || s === current}
              className={cn(
                "tap-target w-full rounded-xl border px-3 py-2.5 text-sm transition-colors disabled:cursor-default",
                s === current
                  ? "border-navy-900 bg-navy-900 font-medium text-cream-50"
                  : "border-navy-200 bg-white text-navy-700 hover:border-navy-400 disabled:opacity-60"
              )}
            >
              {pending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden />
              ) : (
                STATUS_LABELS[s]
              )}
            </button>
          </form>
        ))}
      </div>
      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
    </div>
  );
}
