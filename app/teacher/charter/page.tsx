import type { Metadata } from "next";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { CharterItem } from "@/lib/types";
import { CharterManager } from "./manager";

export const metadata: Metadata = { title: "Kesepakatan Kelas" };

export default async function CharterAdminPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("class_charter_items")
    .select("*")
    .order("display_order", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Kesepakatan Kelas
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Butir yang aktif tampil untuk seluruh kelas — juga di halaman publik.
        </p>
      </div>
      <CharterManager items={(data ?? []) as CharterItem[]} />
    </div>
  );
}
