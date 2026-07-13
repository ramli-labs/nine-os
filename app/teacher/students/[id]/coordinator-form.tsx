"use client";

import { useActionState } from "react";
import { Loader2, Star } from "lucide-react";
import { setStudentCoordinator } from "../actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorNote } from "@/components/ui/feedback";

/** Tandai / lepas siswa sebagai koordinator piket (bisa diubah tiap semester). */
export function CoordinatorForm({
  userId,
  isCoordinator,
}: {
  userId: string;
  isCoordinator: boolean;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    setStudentCoordinator,
    null
  );

  return (
    <div className="space-y-2">
      {/* status koordinator dikirim lewat input tersembunyi (nilai baru) */}
      <form action={action}>
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="is_coordinator" value={String(!isCoordinator)} />
        <Button
          type="submit"
          variant={isCoordinator ? "outline" : "secondary"}
          size="sm"
          disabled={pending}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Star className="h-4 w-4" aria-hidden />
          )}
          {isCoordinator
            ? "Koordinator piket ✓ — klik untuk lepas"
            : "Jadikan koordinator piket"}
        </Button>
      </form>
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}
    </div>
  );
}
