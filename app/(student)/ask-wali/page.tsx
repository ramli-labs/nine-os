import type { Metadata } from "next";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeID } from "@/lib/date";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { WaliRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, UrgencyBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Tanya Wali" };

export default async function AskWaliPage() {
  const profile = await requireStudent();
  const supabase = await createClient();

  const { data } = await supabase
    .from("wali_requests")
    .select("*")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  const requests = (data ?? []) as WaliRequest[];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Tanya Wali
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-navy-600">
          Kamu tidak harus menunggu sampai semuanya terasa terlalu berat. Ini
          ruang pribadi untuk bertanya, meminta bantuan, atau mengajak bicara.
        </p>
      </div>

      <Card>
        <CardContent>
          <RequestForm />
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
          Pesanmu sebelumnya
        </h2>
        {requests.length === 0 ? (
          <EmptyState
            title="Belum ada pesan"
            description="Pesan yang kamu kirim ke wali kelas akan tercatat di sini beserta statusnya."
          />
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id}>
                <Card>
                  <CardContent className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{CATEGORY_LABELS[r.category]}</Badge>
                      <UrgencyBadge urgency={r.urgency} />
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-800">
                      {r.message}
                    </p>
                    <p className="mt-2 text-xs text-navy-500">
                      Dikirim {formatDateTimeID(r.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
