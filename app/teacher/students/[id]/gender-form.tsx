"use client";

import { useActionState } from "react";
import { setStudentGender } from "../actions";
import type { ActionResult, Gender } from "@/lib/types";
import { GENDER_LABELS } from "@/lib/piket";
import { cn } from "@/lib/utils";
import { ErrorNote } from "@/components/ui/feedback";
import { Loader2 } from "lucide-react";

/** Inline L/P setter — needed by the piket generator. */
export function GenderForm({
  userId,
  current,
}: {
  userId: string;
  current: Gender | null;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    setStudentGender,
    null
  );

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="user_id" value={userId} />
      <div className="flex items-center gap-2">
        <span className="text-sm text-navy-600">Jenis kelamin:</span>
        {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
          <button
            key={g}
            type="submit"
            name="gender"
            value={g}
            disabled={pending || current === g}
            title={GENDER_LABELS[g]}
            className={cn(
              "tap-target rounded-full border px-3.5 py-1 text-sm transition-colors disabled:cursor-default",
              current === g
                ? "border-navy-900 bg-navy-900 font-medium text-cream-50"
                : "border-navy-200 bg-white text-navy-700 hover:border-navy-400 disabled:opacity-60"
            )}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              g
            )}
          </button>
        ))}
        {!current ? (
          <span className="text-xs text-amber-700">
            belum diisi — perlu untuk piket
          </span>
        ) : null}
      </div>
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
    </form>
  );
}
