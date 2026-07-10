import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTimeID } from "@/lib/date";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { WaliRequest } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/badge";
import { StatusForm } from "./status-form";

export const metadata: Metadata = { title: "Detail Pesan" };

type RequestWithStudent = WaliRequest & {
  profiles: { id: string; nickname: string; full_name: string } | null;
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("wali_requests")
    .select("*, profiles(id, nickname, full_name)")
    .eq("id", id)
    .maybeSingle();

  const request = data as RequestWithStudent | null;
  if (!request) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/teacher/requests"
        className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Semua pesan
      </Link>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{CATEGORY_LABELS[request.category]}</Badge>
            <UrgencyBadge urgency={request.urgency} />
            <StatusBadge status={request.status} />
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-navy-600">
            <UserRound className="h-4 w-4" aria-hidden />
            {request.profiles ? (
              <Link
                href={`/teacher/students/${request.profiles.id}`}
                className="font-medium text-navy-900 underline-offset-2 hover:underline"
              >
                {request.profiles.full_name || request.profiles.nickname}
              </Link>
            ) : (
              "Siswa"
            )}
            <span className="text-navy-400">
              · {formatDateTimeID(request.created_at)}
            </span>
          </div>

          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-navy-900">
            {request.message}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <StatusForm requestId={request.id} current={request.status} />
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-navy-400">
        Status membantu pencatatan — percakapan sesungguhnya tetap terjadi di
        luar layar.
      </p>
    </div>
  );
}
