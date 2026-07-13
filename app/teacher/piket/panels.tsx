"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Repeat2, Shuffle, X } from "lucide-react";
import { generateRota, overrideAssignment } from "./actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { SuccessNote, ErrorNote } from "@/components/ui/feedback";

export interface StudentOption {
  id: string;
  name: string;
}

/* ── Buat / acak ulang rota tetap ──────────────────────────── */
export function GenerateRotaPanel({ hasSchedule }: { hasSchedule: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    generateRota,
    null
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state) setConfirming(false);
  }, [state]);

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input
          type="hidden"
          name="confirm_overwrite"
          value={String(hasSchedule && confirming)}
        />

        {!hasSchedule ? (
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Shuffle className="h-4 w-4" aria-hidden />
            )}
            Buat jadwal piket
          </Button>
        ) : !confirming ? (
          <Button type="button" variant="outline" onClick={() => setConfirming(true)}>
            <Repeat2 className="h-4 w-4" aria-hidden />
            Acak ulang…
          </Button>
        ) : (
          <>
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Repeat2 className="h-4 w-4" aria-hidden />
              )}
              Ya, ganti jadwal
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </>
        )}
      </form>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
    </div>
  );
}

/* ── Ganti petugas (manual override) ───────────────────────── */
export function OverrideControl({
  assignmentId,
  options,
}: {
  assignmentId: string;
  options: StudentOption[];
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    overrideAssignment,
    null
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        {state && !state.ok ? (
          <span className="text-xs text-red-700">{state.error}</span>
        ) : null}
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Ganti
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <Select name="new_student_id" required className="h-9 w-40 text-sm">
        <option value="">Pilih pengganti…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "OK"}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}
