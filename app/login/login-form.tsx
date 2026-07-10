"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "./actions";
import { Input, Label } from "@/components/ui/field";
import { SubmitButton, ErrorNote } from "@/components/ui/feedback";
import type { ActionResult } from "@/lib/types";

export function LoginForm() {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signIn,
    null
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="identifier">Username</Label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="username dari wali kelas"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className="mt-1.5"
        />
      </div>

      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton className="w-full" pendingText="Memeriksa…">
        <LogIn className="h-4 w-4" aria-hidden />
        Masuk
      </SubmitButton>

      <p className="text-center text-xs leading-relaxed text-navy-500">
        Akunmu dibuatkan oleh wali kelas. Lupa password? Sampaikan langsung —
        wali kelas bisa mengatur ulang.
      </p>
    </form>
  );
}
