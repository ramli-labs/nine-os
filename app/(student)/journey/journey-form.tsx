"use client";

import { useActionState } from "react";
import { GraduationCap, Sprout, Flame } from "lucide-react";
import { saveGoals } from "./actions";
import type { ActionResult, Goals } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Label, Textarea, FieldError } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

const goalFields = [
  {
    name: "academic_goal" as const,
    icon: GraduationCap,
    title: "Akademik",
    prompt: "Satu pencapaian belajar yang ingin kamu raih.",
    placeholder: "Contoh: nilai Matematika stabil di atas 85…",
  },
  {
    name: "character_goal" as const,
    icon: Sprout,
    title: "Karakter",
    prompt: "Satu kebiasaan atau kualitas diri yang ingin kamu tumbuhkan.",
    placeholder: "Contoh: berani mengakui kalau belum paham…",
  },
  {
    name: "courage_goal" as const,
    icon: Flame,
    title: "Keberanian",
    prompt: "Satu hal yang kamu takuti, tetapi ingin kamu coba.",
    placeholder: "Contoh: presentasi di depan kelas tanpa membaca teks…",
  },
];

export function JourneyForm({ existing }: { existing: Goals | null }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveGoals,
    null
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-4">
      {goalFields.map(({ name, icon: Icon, title, prompt, placeholder }) => (
        <Card key={name}>
          <CardContent className="px-5 py-5">
            <div className="flex items-center gap-2.5">
              <Icon className="h-5 w-5 text-accent-600" aria-hidden />
              <p className="font-semibold text-navy-900">{title}</p>
            </div>
            <Label htmlFor={name} className="mt-2 font-normal text-navy-600">
              {prompt}
            </Label>
            <Textarea
              id={name}
              name={name}
              rows={2}
              maxLength={500}
              placeholder={placeholder}
              defaultValue={existing?.[name] ?? ""}
              className="mt-2"
            />
            <FieldError message={fe?.[name]?.[0]} />
          </CardContent>
        </Card>
      ))}

      <input
        type="hidden"
        name="period"
        value={existing?.period ?? "Kelas 9 — 2026/2027"}
      />

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton pendingText="Menyimpan…">Simpan targetku</SubmitButton>
    </form>
  );
}
