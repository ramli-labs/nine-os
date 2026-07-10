"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dices, UserPlus } from "lucide-react";
import { createStudent } from "../actions";
import type { ActionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError, Hint } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

/** Readable password: no ambiguous characters (0/O, 1/l/I). */
function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function NewStudentForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    createStudent,
    null
  );
  const [password, setPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setPassword("");
    }
  }, [state]);

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form ref={formRef} action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Nama lengkap</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            maxLength={100}
            placeholder="Nama sesuai daftar kelas"
            className="mt-1.5"
          />
          <FieldError message={fe?.full_name?.[0]} />
        </div>
        <div>
          <Label htmlFor="nickname">Nama panggilan</Label>
          <Input
            id="nickname"
            name="nickname"
            required
            maxLength={40}
            placeholder="Dipakai untuk sapaan di app"
            className="mt-1.5"
          />
          <FieldError message={fe?.nickname?.[0]} />
        </div>
      </div>

      <div>
        <Label>Jenis kelamin</Label>
        <div className="mt-1.5 flex gap-3">
          {[
            { value: "L", label: "Laki-laki" },
            { value: "P", label: "Perempuan" },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-800 has-[:checked]:border-navy-900 has-[:checked]:bg-navy-900 has-[:checked]:text-cream-50"
            >
              <input
                type="radio"
                name="gender"
                value={value}
                required
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        <FieldError message={fe?.gender?.[0]} />
        <Hint>Dipakai untuk membagi rata kelompok piket.</Hint>
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          required
          autoCapitalize="none"
          spellCheck={false}
          pattern="[a-z0-9][a-z0-9._-]{2,29}"
          placeholder="contoh: arka atau arka.pratama"
          className="mt-1.5"
        />
        <FieldError message={fe?.username?.[0]} />
        <Hint>
          Huruf kecil, angka, titik, strip, garis bawah — 3–30 karakter. Ini
          yang diketik siswa saat masuk.
        </Hint>
      </div>

      <div>
        <Label htmlFor="password">Password awal</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            id="password"
            name="password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setPassword(generatePassword())}
          >
            <Dices className="h-4 w-4" aria-hidden />
            Acak
          </Button>
        </div>
        <FieldError message={fe?.password?.[0]} />
        <Hint>
          Minimal 8 karakter. Catat sebelum menyimpan — setelah ini password
          tidak ditampilkan lagi.
        </Hint>
      </div>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton pendingText="Membuat akun…">
        <UserPlus className="h-4 w-4" aria-hidden />
        Buat akun siswa
      </SubmitButton>
    </form>
  );
}
