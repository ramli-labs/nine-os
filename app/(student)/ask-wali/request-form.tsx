"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitWaliRequest } from "./actions";
import { CATEGORY_LABELS, URGENCY_LABELS } from "@/lib/labels";
import type { ActionResult } from "@/lib/types";
import {
  Label,
  Select,
  Textarea,
  FieldError,
  Hint,
} from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

export function RequestForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    submitWaliRequest,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Kategori</Label>
          <Select id="category" name="category" className="mt-1.5" required>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <FieldError message={fe?.category?.[0]} />
        </div>
        <div>
          <Label htmlFor="urgency">Seberapa mendesak?</Label>
          <Select id="urgency" name="urgency" className="mt-1.5" required>
            {Object.entries(URGENCY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <FieldError message={fe?.urgency?.[0]} />
        </div>
      </div>

      <div>
        <Label htmlFor="message">Ceritakan di sini</Label>
        <Textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={5}
          maxLength={4000}
          placeholder="Tulis apa adanya — tidak perlu rapi."
          className="mt-1.5"
        />
        <FieldError message={fe?.message?.[0]} />
        <Hint>
          Privasi akan dihargai. Jika ada situasi yang menyangkut keselamatanmu
          atau orang lain, wali kelas mungkin perlu mencari dukungan yang
          tepat.
        </Hint>
      </div>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton pendingText="Mengirim…">Kirim ke wali kelas</SubmitButton>
    </form>
  );
}
