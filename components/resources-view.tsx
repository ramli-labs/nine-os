import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RESOURCE_CATEGORY_LABELS } from "@/lib/labels";
import type { Resource, ResourceCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

/** Shared content for the resources ("Materi") page, used by both the
 *  public route and the in-app (student) route so the two stay identical. */
export async function ResourcesView() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("is_published", true)
    .order("category", { ascending: true })
    .order("created_at", { ascending: false });

  const resources = (data ?? []) as Resource[];

  const byCategory = new Map<ResourceCategory, Resource[]>();
  for (const r of resources) {
    const list = byCategory.get(r.category) ?? [];
    list.push(r);
    byCategory.set(r.category, list);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-950">
        Materi
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-navy-600">
        Panduan belajar, persiapan SMA, memakai AI dengan jujur, dan menjaga
        keseimbangan diri — dikurasi wali kelas.
      </p>

      {resources.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Belum ada materi dipublikasikan"
            description="Materi akan muncul di sini begitu wali kelas menerbitkannya."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {[...byCategory.entries()].map(([category, items]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
                {RESOURCE_CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-3">
                {items.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-navy-900">{r.title}</p>
                        <Badge>{RESOURCE_CATEGORY_LABELS[r.category]}</Badge>
                      </div>
                      {r.description ? (
                        <p className="mt-1 text-sm text-navy-600">
                          {r.description}
                        </p>
                      ) : null}
                      {r.content ? (
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-700">
                          {r.content}
                        </p>
                      ) : null}
                      {r.url ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy-800 underline-offset-2 hover:underline"
                        >
                          Buka tautan
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
