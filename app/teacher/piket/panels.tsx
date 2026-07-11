"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Repeat2, Shuffle, UserMinus, X } from "lucide-react";
import {
  generateDailyPiket,
  overrideAssignment,
  toggleCompleted,
  addExclusion,
  removeExclusion,
} from "./actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { SubmitButton, SuccessNote, ErrorNote } from "@/components/ui/feedback";

export interface StudentOption {
  id: string;
  name: string;
}

/* ── Pilih tanggal ─────────────────────────────────────────── */
export function DatePicker({ date }: { date: string }) {
  const router = useRouter();
  return (
    <div>
      <Label htmlFor="piket-date">Tanggal</Label>
      <Input
        id="piket-date"
        type="date"
        defaultValue={date}
        onChange={(e) => {
          if (e.target.value) router.push(`/teacher/piket?date=${e.target.value}`);
        }}
        className="mt-1.5 max-w-48"
      />
    </div>
  );
}

/* ── Generate / regenerate ─────────────────────────────────── */
export function GeneratePanel({
  date,
  hasSchedule,
  defaultSize,
}: {
  date: string;
  hasSchedule: boolean;
  defaultSize: number;
}) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    generateDailyPiket,
    null
  );
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (state) setConfirming(false);
  }, [state]);

  return (
    <div className="space-y-3">
      <form action={action} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="duty_date" value={date} />
        <input
          type="hidden"
          name="confirm_overwrite"
          value={String(hasSchedule && confirming)}
        />
        <div>
          <Label htmlFor="team_size">Jumlah petugas</Label>
          <Input
            id="team_size"
            name="team_size"
            type="number"
            min={1}
            max={20}
            defaultValue={defaultSize}
            className="mt-1.5 w-28"
          />
        </div>

        {!hasSchedule ? (
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Shuffle className="h-4 w-4" aria-hidden />
            )}
            Generate piket
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
              Ya, ganti jadwal tanggal ini
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

/* ── Toggle completed ──────────────────────────────────────── */
export function CompletedToggle({
  assignmentId,
  completed,
}: {
  assignmentId: string;
  completed: boolean;
}) {
  return (
    <form action={toggleCompleted}>
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="completed" value={String(!completed)} />
      <button
        type="submit"
        title={completed ? "Tandai belum selesai" : "Tandai selesai"}
        className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-navy-700 hover:bg-navy-100"
      >
        {completed ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden />
        ) : (
          <Circle className="h-5 w-5 text-navy-300" aria-hidden />
        )}
        {completed ? "Selesai" : "Belum"}
      </button>
    </form>
  );
}

/* ── Manual override ───────────────────────────────────────── */
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
      <Select name="new_student_id" required className="h-9 w-44 text-sm">
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

/* ── Exclusions ────────────────────────────────────────────── */
export function ExclusionPanel({
  date,
  options,
  exclusions,
}: {
  date: string;
  options: StudentOption[];
  exclusions: { id: string; name: string; reason: string | null }[];
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    addExclusion,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-3">
      <form
        ref={formRef}
        action={action}
        className="flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="exclusion_date" value={date} />
        <div>
          <Label htmlFor="excl-student">Siswa</Label>
          <Select id="excl-student" name="student_id" required className="mt-1.5 w-48">
            <option value="">Pilih siswa…</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex-1 basis-48">
          <Label htmlFor="excl-reason">Alasan (opsional)</Label>
          <Input
            id="excl-reason"
            name="reason"
            maxLength={200}
            placeholder="sakit, lomba, dispensasi…"
            className="mt-1.5"
          />
        </div>
        <SubmitButton size="sm" variant="secondary" pendingText="Menyimpan…">
          <UserMinus className="h-4 w-4" aria-hidden />
          Kecualikan
        </SubmitButton>
      </form>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      {exclusions.length > 0 ? (
        <ul className="space-y-1.5">
          {exclusions.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-1.5 text-sm text-navy-800"
            >
              <span className="font-medium">{e.name}</span>
              {e.reason ? (
                <span className="text-navy-500">— {e.reason}</span>
              ) : null}
              <form action={removeExclusion} className="ml-auto">
                <input type="hidden" name="id" value={e.id} />
                <button
                  type="submit"
                  aria-label={`Hapus pengecualian ${e.name}`}
                  className="rounded p-1 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
