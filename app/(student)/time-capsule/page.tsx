import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TimeCapsule } from "@/lib/types";
import { CapsuleForm } from "./capsule-form";

export const metadata: Metadata = { title: "Kapsul Waktu" };

export default async function TimeCapsulePage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("time_capsules")
    .select("*")
    .eq("student_id", profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-600">
          Kapsul Waktu
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">
          Surat untuk Diri di Masa Depan
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-navy-600">
          Tahun ini akan berlalu lebih cepat dari yang kamu kira. Tinggalkan
          sesuatu untuk dirimu yang akan berdiri di hari kelulusan.
        </p>
      </div>

      <CapsuleForm existing={data as TimeCapsule | null} />

      <p className="text-xs leading-relaxed text-navy-500">
        Kapsul waktu bersifat sangat pribadi. Isinya tidak tampil di dashboard
        siapa pun dan tidak dibaca wali kelas.
      </p>
    </div>
  );
}
