import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side sign-out endpoint. Used when a lingering session must be
 * terminated from a Server Component (e.g. account deactivated
 * mid-session) — RSCs cannot mutate cookies, route handlers can.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const reason = new URL(request.url).searchParams.get("reason");
  const target = reason ? `/login?error=${reason}` : "/login";
  return NextResponse.redirect(new URL(target, request.url));
}
