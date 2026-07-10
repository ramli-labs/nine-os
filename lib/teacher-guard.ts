import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type GuardResult =
  | { ok: true; supabase: SupabaseClient; userId: string }
  | { ok: false; error: string };

/**
 * Server-action guard: verifies the caller is an authenticated teacher
 * by reading the role from the database. RLS is the real enforcement —
 * this gives clean errors instead of silent failures.
 */
export async function teacherGuard(): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") {
    return { ok: false, error: "Aksi ini hanya untuk wali kelas." };
  }

  return { ok: true, supabase, userId: user.id };
}
