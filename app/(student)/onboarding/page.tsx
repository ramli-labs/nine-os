import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StudentProfile } from "@/lib/types";
import { KenaliSayaForm } from "./kenali-saya-form";

export const metadata: Metadata = { title: "Kenali Saya" };

export default async function OnboardingPage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("user_id", profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-600">
          Kenali Saya
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">
          Halo, {profile.nickname || profile.full_name}.
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-navy-600">
          Empat langkah singkat supaya wali kelas bisa mendampingimu sebagai{" "}
          <em>kamu</em> — bukan sekadar nama di absensi. Jawabanmu hanya
          dibaca wali kelas, dan setiap langkah tersimpan otomatis.
        </p>
      </div>

      <KenaliSayaForm
        existing={data as StudentProfile | null}
        currentNickname={profile.nickname}
      />
    </div>
  );
}
