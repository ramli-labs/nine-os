import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Goals } from "@/lib/types";
import { JourneyForm } from "./journey-form";

export const metadata: Metadata = { title: "Perjalananku" };

export default async function JourneyPage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("goals")
    .select("*")
    .eq("student_id", profile.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-accent-600">
          Perjalananku
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">
          Diriku pada Juni 2027
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Tiga target sederhana untuk tahun terakhirmu di SMP. Boleh diubah
          kapan saja — target itu hidup, bukan pajangan.
        </p>
      </div>

      <JourneyForm existing={data as Goals | null} />
    </div>
  );
}
