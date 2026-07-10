"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveKenaliSaya } from "./actions";
import type { ActionResult, StudentProfile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, Textarea, Input, FieldError } from "@/components/ui/field";
import { SubmitButton, ErrorNote } from "@/components/ui/feedback";

type FieldName = keyof Pick<
  StudentProfile,
  | "three_words"
  | "strengths"
  | "growth_area"
  | "hope"
  | "concern"
  | "future_plan"
  | "problem_response"
  | "support_note"
  | "private_note_to_teacher"
>;

interface Question {
  name: FieldName;
  label: string;
  optional?: boolean;
  short?: boolean;
  hint?: string;
}

const steps: { title: string; intro: string; questions: Question[] }[] = [
  {
    title: "Tentang dirimu",
    intro: "Tidak ada jawaban benar atau salah — tulis apa adanya.",
    questions: [
      {
        name: "three_words",
        label: "Tiga kata yang menggambarkan dirimu",
        short: true,
        hint: "Contoh: penasaran, santai, setia kawan",
      },
      { name: "strengths", label: "Hal yang menurutmu menjadi kekuatanmu" },
      { name: "growth_area", label: "Hal yang ingin kamu tingkatkan tahun ini" },
    ],
  },
  {
    title: "Kelas 9 dan sesudahnya",
    intro: "Tahun ini milikmu. Ke mana arahnya?",
    questions: [
      { name: "hope", label: "Apa yang paling kamu harapkan dari kelas 9?" },
      {
        name: "concern",
        label: "Apa yang paling kamu khawatirkan dari kelas 9?",
        optional: true,
      },
      {
        name: "future_plan",
        label: "Setelah SMP, saat ini kamu membayangkan ingin ke mana?",
      },
    ],
  },
  {
    title: "Supaya aku bisa mendampingimu",
    intro:
      "Bagian ini hanya dibaca wali kelas. Yang sensitif boleh dilewati.",
    questions: [
      {
        name: "problem_response",
        label: "Ketika sedang mengalami masalah, kamu biasanya cenderung bagaimana?",
      },
      {
        name: "support_note",
        label: "Apa yang perlu saya ketahui agar bisa mendampingimu lebih baik?",
        optional: true,
      },
      {
        name: "private_note_to_teacher",
        label:
          "Adakah sesuatu yang ingin kamu sampaikan secara pribadi kepada wali kelas?",
        optional: true,
      },
    ],
  },
];

export function KenaliSayaForm({ existing }: { existing: StudentProfile | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveKenaliSaya,
    null
  );

  // Advance after each successful step save.
  useEffect(() => {
    if (state?.ok) {
      if (step < steps.length - 1) {
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setDone(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-6 w-6 text-emerald-700" aria-hidden />
          </div>
          <p className="mt-4 text-lg font-medium text-navy-950">
            Terima kasih sudah bercerita.
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-600">
            Jawabanmu membantu wali kelas mendampingimu dengan lebih baik.
            Kamu bisa memperbaruinya kapan saja dari halaman ini.
          </p>
          <Button className="mt-6" onClick={() => router.push("/dashboard")}>
            Ke Beranda
          </Button>
        </CardContent>
      </Card>
    );
  }

  const current = steps[step];
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-navy-500">
          <span>
            Bagian {step + 1} dari {steps.length}
          </span>
          <span>{current.title}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= step ? "bg-accent-500" : "bg-navy-100"
              )}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-navy-950">
            {current.title}
          </h2>
          <p className="mt-1 mb-5 text-sm text-navy-600">{current.intro}</p>

          <form key={step} action={action} className="space-y-5">
            {current.questions.map((q) => (
              <div key={q.name}>
                <Label htmlFor={q.name} className="leading-relaxed">
                  {q.label}
                  {q.optional ? (
                    <span className="ml-1 font-normal text-navy-400">
                      (opsional)
                    </span>
                  ) : null}
                </Label>
                {q.short ? (
                  <Input
                    id={q.name}
                    name={q.name}
                    maxLength={120}
                    placeholder={q.hint}
                    defaultValue={existing?.[q.name] ?? ""}
                    className="mt-2"
                  />
                ) : (
                  <Textarea
                    id={q.name}
                    name={q.name}
                    rows={3}
                    maxLength={2000}
                    defaultValue={existing?.[q.name] ?? ""}
                    className="mt-2"
                  />
                )}
                <FieldError message={fe?.[q.name]?.[0]} />
              </div>
            ))}

            {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

            <div className="flex items-center justify-between gap-3 pt-1">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Kembali
                </Button>
              ) : (
                <span />
              )}
              <SubmitButton pendingText="Menyimpan…">
                {step === steps.length - 1 ? "Simpan & selesai" : "Simpan & lanjut"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
