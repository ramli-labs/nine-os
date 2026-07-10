"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";
import { identifierToEmail } from "@/lib/constants";
import { roleHome } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

/**
 * Username/email + password login. Student accounts are provisioned by
 * the teacher; public sign-up is disabled in Supabase (see README_SETUP).
 */
export async function signIn(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: identifierToEmail(parsed.data.identifier),
    password: parsed.data.password,
  });

  if (error) {
    if (error.status === 429) {
      return {
        ok: false,
        error: "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.",
      };
    }
    return {
      ok: false,
      error:
        "Username atau password tidak cocok. Lupa password? Minta wali kelas mengatur ulang.",
    };
  }

  // Role comes from the database (RLS-protected) — never from the client.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let destination = "/dashboard";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile) destination = roleHome(profile.role);
  }

  redirect(destination);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
