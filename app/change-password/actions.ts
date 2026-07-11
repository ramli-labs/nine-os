"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { changePasswordSchema } from "@/lib/validation";
import { roleHome } from "@/lib/auth";
import { validationError } from "@/lib/action-helpers";
import type { ActionResult } from "@/lib/types";

/** Siswa/guru mengganti password sementaranya menjadi milik sendiri. */
export async function changeOwnPassword(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk kembali, ya." };

  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return validationError(parsed.error);

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    if (/different from the old/i.test(error.message)) {
      return {
        ok: false,
        error: "Password baru harus berbeda dari password sementara.",
      };
    }
    return { ok: false, error: "Password belum berhasil diganti. Coba lagi." };
  }

  // Lepaskan flag "wajib ganti" — server-side, setelah sukses.
  const admin = createAdminClient();
  if (admin) {
    await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(profile ? roleHome(profile.role) : "/dashboard");
}
