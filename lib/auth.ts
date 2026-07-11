import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/** Where each role lands after login. */
export function roleHome(role: UserRole): string {
  return role === "teacher" ? "/teacher" : "/dashboard";
}

/**
 * Reads the authenticated user's profile from the database.
 * Role ALWAYS comes from the profiles table (server-side, RLS-guarded)
 * — never from client input, localStorage, or query params.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

/** Any authenticated user; redirects to /login otherwise. */
export async function requireAuth(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  // Sesi lama milik akun yang dinonaktifkan → putuskan sekarang.
  if (profile.status === "inactive") redirect("/auth/signout?reason=inactive");
  // Masih memakai password sementara → wajib ganti dulu.
  if (profile.must_change_password) redirect("/change-password");
  return profile;
}

/** Student-only areas. Teachers are sent to their own home. */
export async function requireStudent(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== "student") redirect("/teacher");
  return profile;
}

/** Teacher-only areas. Non-teachers see the unauthorized page. */
export async function requireTeacher(): Promise<Profile> {
  const profile = await requireAuth();
  if (profile.role !== "teacher") redirect("/unauthorized");
  return profile;
}
