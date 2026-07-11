"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveKenaliSaya } from "./actions";
import { FUTURE_PLAN_OPTIONS, PROBLEM_RESPONSE_OPTIONS } from "./options";
import type { ActionResult, StudentProfile } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Label,
  Textarea,
  Input,
  Select,
  FieldError,
  Hint,
} from "@/components/ui/field";
import { SubmitButton, ErrorNote } from "@/components/ui/feedback";

const STEP_TITLES = [
  "Tentang Dirimu",
  "Kelas 9",
  "Saat Menghadapi Masalah",
  "Untuk Wali Kelas",
];

function parseFuturePlan(value: string | null): {
  choice: string;
  other: string;
} {
  if (!value) return { choice: "", other: "" };
  if ((FUTURE_PLAN_OPTIONS as readonly string[]).includes(value)) {
    return { choice: value, other: "" };
  }
  if (value.startsWith("Lainnya: ")) {
    return { choice: "Lainnya", other: value.slice("Lainnya: ".length) };
  }
  return { choice: "Lainnya", other: value };
}

function parseProblemResponse(value: string | null): {
  chosen: Set<string>;
  other: string;
} {
  const chosen = new Set<string>();
  let other = "";
  if (value) {
    for (const part of value.split(", ")) {
      if ((PROBLEM_RESPONSE_OPTIONS as readonly string[]).includes(part)) {
        chosen.add(part);
      } else if (part.startsWith("Lainnya: ")) {
        other = part.slice("Lainnya: ".length);
      }
    }
  }
  return { chosen, other };
}

export function KenaliSayaForm({
  existing,
  currentNickname,
}: {
  existing: StudentProfile | null;
  currentNickname: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    saveKenaliSaya,
    null
  );

  const futurePlan = parseFuturePlan(existing?.future_plan ?? null);
  const problem = parseProblemResponse(existing?.problem_response ?? null);
  const [planChoice, setPlanChoice] = useState(futurePlan.choice);

  useEffect(() => {
    if (state?.ok) {
      if (step < 4) {
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
            Terima kasih. Jawabanmu sudah tersimpan.
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-navy-600">
            Ini bukan penilaian — ini cara wali kelas mengenalmu lebih baik.
          </p>
          <Button className="mt-6" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div>
        <div className="flex items-center justify-between text-xs text-navy-500">
          <span>
            Langkah {step} dari 4
          </span>
          <span>{STEP_TITLES[step - 1]}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i < step ? "bg-accent-500" : "bg-navy-100"
              )}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-navy-950">
            {STEP_TITLES[step - 1]}
          </h2>
          <p className="mt-1 mb-5 text-sm text-navy-600">
            {step === 1 && "Tidak ada jawaban benar atau salah — tulis apa adanya."}
            {step === 2 && "Tahun ini milikmu. Ke mana arahnya?"}
            {step === 3 && "Boleh pilih lebih dari satu — atau lewati dulu."}
            {step === 4 && "Bagian terakhir. Yang sensitif boleh dilewati."}
          </p>

          <form key={step} action={action} className="space-y-5">
            <input type="hidden" name="step" value={step} />

            {step === 1 ? (
              <>
                <div>
                  <Label htmlFor="nickname">Nama panggilan yang kamu sukai</Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    required
                    maxLength={40}
                    defaultValue={currentNickname}
                    className="mt-2"
                  />
                  <FieldError message={fe?.nickname?.[0]} />
                </div>
                <div>
                  <Label htmlFor="three_words">
                    Tiga kata yang menggambarkan dirimu
                  </Label>
                  <Input
                    id="three_words"
                    name="three_words"
                    required
                    maxLength={120}
                    placeholder="tenang, penasaran, mudah gugup"
                    defaultValue={existing?.three_words ?? ""}
                    className="mt-2"
                  />
                  <FieldError message={fe?.three_words?.[0]} />
                </div>
                <div>
                  <Label htmlFor="strengths">
                    Hal yang menurutmu menjadi kekuatanmu
                  </Label>
                  <Textarea
                    id="strengths"
                    name="strengths"
                    rows={3}
                    required
                    maxLength={1000}
                    defaultValue={existing?.strengths ?? ""}
                    className="mt-2"
                  />
                  <FieldError message={fe?.strengths?.[0]} />
                </div>
                <div>
                  <Label htmlFor="growth_area">
                    Hal yang ingin kamu tingkatkan tahun ini
                  </Label>
                  <Textarea
                    id="growth_area"
                    name="growth_area"
                    rows={3}
                    required
                    maxLength={1000}
                    defaultValue={existing?.growth_area ?? ""}
                    className="mt-2"
                  />
                  <FieldError message={fe?.growth_area?.[0]} />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div>
                  <Label htmlFor="hope">
                    Apa yang paling kamu harapkan dari kelas 9?
                  </Label>
                  <Textarea
                    id="hope"
                    name="hope"
                    rows={3}
                    required
                    maxLength={1000}
                    defaultValue={existing?.hope ?? ""}
                    className="mt-2"
                  />
                  <FieldError message={fe?.hope?.[0]} />
                </div>
                <div>
                  <Label htmlFor="concern">
                    Apa yang paling kamu khawatirkan dari kelas 9?
                  </Label>
                  <Textarea
                    id="concern"
                    name="concern"
                    rows={3}
                    required
                    maxLength={1000}
                    defaultValue={existing?.concern ?? ""}
                    className="mt-2"
                  />
                  <FieldError message={fe?.concern?.[0]} />
                </div>
                <div>
                  <Label htmlFor="future_plan_choice">
                    Setelah SMP, saat ini kamu membayangkan ingin ke mana?{" "}
                    <span className="font-normal text-navy-400">(opsional)</span>
                  </Label>
                  <Select
                    id="future_plan_choice"
                    name="future_plan_choice"
                    value={planChoice}
                    onChange={(e) => setPlanChoice(e.target.value)}
                    className="mt-2"
                  >
                    <option value="">Pilih salah satu…</option>
                    {FUTURE_PLAN_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                  {planChoice === "Lainnya" ? (
                    <Input
                      name="future_plan_other"
                      maxLength={200}
                      placeholder="Tulis rencanamu…"
                      defaultValue={futurePlan.other}
                      className="mt-2"
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <div>
                <Label className="leading-relaxed">
                  Kalau sedang punya masalah, kamu biasanya cenderung…{" "}
                  <span className="font-normal text-navy-400">(opsional)</span>
                </Label>
                <div className="mt-3 space-y-2">
                  {PROBLEM_RESPONSE_OPTIONS.map((o) => (
                    <label
                      key={o}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-800 has-[:checked]:border-navy-900 has-[:checked]:bg-navy-50"
                    >
                      <input
                        type="checkbox"
                        name="problem_response"
                        value={o}
                        defaultChecked={problem.chosen.has(o)}
                        className="h-4 w-4 rounded border-navy-300 accent-[#16263c]"
                      />
                      {o}
                    </label>
                  ))}
                  <div className="rounded-xl border border-navy-200 bg-white px-4 py-2.5">
                    <span className="text-sm text-navy-800">Lainnya:</span>
                    <Input
                      name="problem_response_other"
                      maxLength={200}
                      placeholder="Tulis sendiri…"
                      defaultValue={problem.other}
                      className="mt-1.5 h-9"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <>
                <div>
                  <Label htmlFor="support_note" className="leading-relaxed">
                    Apa yang perlu saya ketahui agar bisa mendampingimu lebih
                    baik?{" "}
                    <span className="font-normal text-navy-400">(opsional)</span>
                  </Label>
                  <Textarea
                    id="support_note"
                    name="support_note"
                    rows={3}
                    maxLength={2000}
                    defaultValue={existing?.support_note ?? ""}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="private_note_to_teacher"
                    className="leading-relaxed"
                  >
                    Apakah ada sesuatu yang ingin kamu sampaikan secara pribadi
                    kepada wali kelas?{" "}
                    <span className="font-normal text-navy-400">(opsional)</span>
                  </Label>
                  <Textarea
                    id="private_note_to_teacher"
                    name="private_note_to_teacher"
                    rows={3}
                    maxLength={2000}
                    defaultValue={existing?.private_note_to_teacher ?? ""}
                    className="mt-2"
                  />
                </div>
                <Hint>
                  <Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                  Jawaban ini dibaca oleh wali kelas. Privasimu akan dihargai.
                  Jika ada hal yang menyangkut keselamatanmu atau orang lain,
                  wali kelas mungkin perlu mencari dukungan yang tepat.
                </Hint>
              </>
            ) : null}

            {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

            <div className="flex items-center justify-between gap-3 pt-1">
              {step > 1 ? (
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
                {step === 4 ? "Simpan & selesai" : "Simpan & lanjut"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
