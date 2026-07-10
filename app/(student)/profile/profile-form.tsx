"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import type { ActionResult, Profile } from "@/lib/types";
import { Input, Label, FieldError } from "@/components/ui/field";
import {
  SubmitButton,
  SuccessNote,
  ErrorNote,
} from "@/components/ui/feedback";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateProfile,
    null
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-5">
      <div>
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          required
          maxLength={100}
          className="mt-1.5"
        />
        <FieldError message={fe?.full_name?.[0]} />
      </div>
      <div>
        <Label htmlFor="nickname">Nama panggilan</Label>
        <Input
          id="nickname"
          name="nickname"
          defaultValue={profile.nickname}
          required
          maxLength={40}
          className="mt-1.5"
        />
        <FieldError message={fe?.nickname?.[0]} />
      </div>

      {state?.ok ? <SuccessNote>{state.message}</SuccessNote> : null}
      {state && !state.ok ? <ErrorNote>{state.error}</ErrorNote> : null}

      <SubmitButton pendingText="Menyimpan…">Simpan profil</SubmitButton>
    </form>
  );
}
