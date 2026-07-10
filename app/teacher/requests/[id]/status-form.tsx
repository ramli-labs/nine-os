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
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={requestId} />
      <p className="text-sm font-medium text-navy-800">Perbarui status</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {flow.map((s) => (
          <button
            key={s}
            type="submit"
            name="status"
            value={s}
            disabled={pending || s === current}
            className={cn(
              "tap-target rounded-xl border px-3 py-2.5 text-sm transition-colors disabled:cursor-default",
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
        ))}
      </div>
      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
    </form>
  );
}
