"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/utils";
import { submitPulse } from "./actions";
import { CATEGORY_LABELS, FEELING_LABELS } from "@/lib/labels";
import type { ActionResult, WeeklyPulse } from "@/lib/types";
import {
  Input,
  Label,
  Select,
  Textarea,
  FieldError,
} from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

function ScaleInput({
  name,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  name: string;
  value: number | null;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={cn(
              "tap-target rounded-xl border text-base font-medium transition-colors",
              value === n
                ? "border-navy-900 bg-navy-900 text-cream-50"
                : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-navy-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}

export function PulseForm({ existing }: { existing: WeeklyPulse | null }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    submitPulse,
    null
  );
  const [energy, setEnergy] = useState<number | null>(
    existing?.energy_level ?? null
  );
  const [pressure, setPressure] = useState<number | null>(
    existing?.pressure_level ?? null
  );
  const [feeling, setFeeling] = useState<string | null>(
    existing?.feeling ?? null
  );
  const [needsHelp, setNeedsHelp] = useState<boolean>(
    existing?.needs_help ?? false
  );

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-6">
      <div>
        <Label>Energi minggu ini</Label>
        <div className="mt-2">
          <ScaleInput
            name="energy_level"
            value={energy}
            onChange={setEnergy}
            lowLabel="Habis banget"
            highLabel="Penuh"
          />
        </div>
        <FieldError message={fe?.energy_level?.[0]} />
      </div>

      <div>
        <Label>Tekanan minggu ini</Label>
        <div className="mt-2">
          <ScaleInput
            name="pressure_level"
            value={pressure}
            onChange={setPressure}
            lowLabel="Santai"
            highLabel="Berat"
          />
        </div>
        <FieldError message={fe?.pressure_level?.[0]} />
      </div>

      <div>
        <Label>Perasaan dominan</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(FEELING_LABELS) as (keyof typeof FEELING_LABELS)[]).map(
            (key) => (
              <button
                key={key}
                type="button"
                aria-pressed={feeling === key}
                onClick={() => setFeeling(key)}
                className={cn(
                  "tap-target rounded-full border px-4 py-2 text-sm transition-colors",
                  feeling === key
                    ? "border-navy-900 bg-navy-900 text-cream-50"
                    : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
                )}
              >
                {FEELING_LABELS[key]}
              </button>
            )
          )}
        </div>
        <input type="hidden" name="feeling" value={feeling ?? ""} />
        <FieldError message={fe?.feeling?.[0]} />
        {feeling === "lainnya" ? (
          <div className="mt-3">
            <Label htmlFor="feeling_detail">Perasaan apa itu?</Label>
            <Input
              id="feeling_detail"
              name="feeling_detail"
              maxLength={100}
              required
              placeholder="Tulis dengan katamu sendiri…"
              defaultValue={existing?.feeling_detail ?? ""}
              className="mt-1.5"
            />
            <FieldError message={fe?.feeling_detail?.[0]} />
          </div>
        ) : null}
      </div>

      <div>
        <Label>Apakah kamu sedang butuh bantuan?</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[
            { v: false, label: "Tidak, aman" },
            { v: true, label: "Ya, sepertinya iya" },
          ].map(({ v, label }) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={needsHelp === v}
              onClick={() => setNeedsHelp(v)}
              className={cn(
                "tap-target rounded-xl border px-4 py-2.5 text-sm transition-colors",
                needsHelp === v
                  ? "border-navy-900 bg-navy-900 text-cream-50"
                  : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <input type="hidden" name="needs_help" value={String(needsHelp)} />
      </div>

      {needsHelp ? (
        <div>
          <Label htmlFor="help_category">Bantuan seputar apa?</Label>
          <Select
            id="help_category"
            name="help_category"
            defaultValue={existing?.help_category ?? "academic"}
            className="mt-1.5"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <div>
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          maxLength={1000}
          placeholder="Ada yang ingin kamu tambahkan?"
          defaultValue={existing?.note ?? ""}
          className="mt-1.5"
        />
        <FieldError message={fe?.note?.[0]} />
      </div>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton className="w-full sm:w-auto" pendingText="Menyimpan…">
        {existing ? "Perbarui denyut minggu ini" : "Kirim denyut minggu ini"}
      </SubmitButton>
    </form>
  );
}
