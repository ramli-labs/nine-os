import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { CharterItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Kesepakatan Kelas" };

export default async function ClassCharterPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("class_charter_items")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  const items = (data ?? []) as CharterItem[];

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-950">
        Kesepakatan Kelas
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">
        Bukan aturan yang dijatuhkan dari atas — ini kesepakatan yang kita
        rumuskan dan jaga bersama.
      </p>

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Kesepakatan sedang dirumuskan"
            description="Butir-butir kesepakatan akan tampil di sini setelah kelas menyepakatinya."
          />
        </div>
      ) : (
        <ol className="mt-8 space-y-3">
          {items.map((item, i) => (
            <li key={item.id}>
              <Card>
                <CardContent className="flex items-start gap-4 px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-cream-50">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-navy-950">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 text-sm leading-relaxed text-navy-600">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
