"use client";

import { useActionState, useEffect, useState } from "react";
import { Lock, PenLine } from "lucide-react";
import { saveTimeCapsule } from "./actions";
import type { ActionResult, TimeCapsule } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea, FieldError } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

const questions = [
  {
    name: "current_feeling" as const,
    label: "Apa yang sedang kamu rasakan sekarang?",
    required: false,
  },
  {
    name: "desired_change" as const,
    label: "Apa yang ingin kamu ubah tahun ini?",
    required: false,
  },
  {
    name: "self_proof" as const,
    label: "Apa yang ingin kamu buktikan kepada dirimu sendiri?",
    required: false,
  },
  {
    name: "future_message" as const,
    label: "Tulis pesan untuk dirimu menjelang lulus.",
    required: true,
  },
];

export function CapsuleForm({ existing }: { existing: TimeCapsule | null }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveTimeCapsule,
    null
  );
  const [editing, setEditing] = useState(!existing);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  // Seal the card only after a confirmed successful save.
  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing && (existing || state?.ok)) {
    return (
      <Card className="border-navy-800 bg-navy-900 text-cream-50">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <Lock className="h-8 w-8 text-accent-400" aria-hidden />
          <p className="mt-4 text-lg font-medium">Suratmu tersimpan.</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-200">
            Disimpan hingga Juni 2027 dan dibuka kembali menjelang kelulusan.
            Tidak ada yang membacanya — termasuk wali kelas.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-6 border-navy-600 bg-transparent text-cream-50 hover:bg-navy-800"
            onClick={() => setEditing(true)}
          >
            <PenLine className="h-4 w-4" aria-hidden />
            Buka & tulis ulang
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {questions.map(({ name, label, required }) => (
        <div key={name}>
          <Label htmlFor={name} className="leading-relaxed">
            {label}
            {!required ? (
              <span className="ml-1 font-normal text-navy-400">(opsional)</span>
            ) : null}
          </Label>
          <Textarea
            id={name}
            name={name}
            rows={name === "future_message" ? 5 : 3}
            required={required}
            maxLength={name === "future_message" ? 5000 : 2000}
            defaultValue={existing?.[name] ?? ""}
            placeholder="Tulis dengan tenang — ini hanya untukmu."
            className="mt-2"
          />
          <FieldError message={fe?.[name]?.[0]} />
        </div>
      ))}

      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton pendingText="Menyegel surat…">
        <Lock className="h-4 w-4" aria-hidden />
        Segel hingga Juni 2027
      </SubmitButton>
    </form>
  );
}
