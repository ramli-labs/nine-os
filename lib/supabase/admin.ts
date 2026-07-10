import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Admin client — SERVICE ROLE. Server-only module: importing it from any
 * client component fails the build (via the `server-only` package), so the
 * key can never leak into the browser bundle.
 *
 * Used EXCLUSIVELY for teacher-initiated account administration
 * (create student accounts, reset passwords). Every caller must first
 * pass `teacherGuard()`. All other data access in the app uses the anon
 * key + RLS.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const ADMIN_UNAVAILABLE =
  "Fitur ini membutuhkan SUPABASE_SERVICE_ROLE_KEY pada environment server. " +
  "Lihat README_SETUP.md bagian “Kelola akun siswa”.";
