import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { roleHome } from "@/lib/auth";

/** Handles magic-link clicks from the login email. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const redirectTo = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));

  if (!token_hash || !type) {
    return redirectTo("/login?error=link");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return redirectTo("/login?error=expired");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirectTo("/login?error=session");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return redirectTo(profile ? roleHome(profile.role) : "/dashboard");
}
