import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateShortID } from "@/lib/date";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/labels";
import type { RequestStatus, WaliRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Tanya Wali" };

type RequestWithStudent = WaliRequest & {
  profiles: { nickname: string; full_name: string } | null;
};

const filters: { key: string; label: string }[] = [
  { key: "open", label: "Terbuka" },
  { key: "submitted", label: STATUS_LABELS.submitted },
  { key: "seen", label: STATUS_LABELS.seen },
  { key: "follow_up", label: STATUS_LABELS.follow_up },
  { key: "closed", label: STATUS_LABELS.closed },
  { key: "all", label: "Semua" },
];

export default async function TeacherRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireTeacher();
  const { filter = "open" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("wali_requests")
    .select("*, profiles(nickname, full_name)")
    .order("created_at", { ascending: false });

  if (filter === "open") {
    query = query.neq("status", "closed");
  } else if (filter !== "all") {
    query = query.eq("status", filter as RequestStatus);
  }

  const { data } = await query;
  const requests = (data ?? []) as RequestWithStudent[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Tanya Wali
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Pesan pribadi dari siswa — tandai statusnya agar tidak ada yang
          terlewat.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={`/teacher/requests?filter=${key}`}
            className={cn(
              "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm",
              filter === key
                ? "border-navy-900 bg-navy-900 text-cream-50"
                : "border-navy-200 bg-white/60 text-navy-700 hover:border-navy-400"
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="Tidak ada pesan pada filter ini"
          description="Pesan baru dari siswa akan muncul di sini."
        />
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs uppercase tracking-wide text-navy-400">
                  <th className="px-5 py-3 font-medium">Siswa</th>
                  <th className="px-3 py-3 font-medium">Kategori</th>
                  <th className="px-3 py-3 font-medium">Urgensi</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Dikirim</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-50">
                    <td className="px-5 py-3.5 font-medium text-navy-900">
                      {r.profiles?.nickname || r.profiles?.full_name || "Siswa"}
                    </td>
                    <td className="px-3 py-3.5 text-navy-700">
                      {CATEGORY_LABELS[r.category]}
                    </td>
                    <td className="px-3 py-3.5">
                      <UrgencyBadge urgency={r.urgency} />
                    </td>
                    <td className="px-3 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3.5 text-navy-500">
                      {formatDateShortID(r.created_at)}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/teacher/requests/${r.id}`}
                        className="inline-flex items-center gap-1 font-medium text-navy-800 underline-offset-2 hover:underline"
                      >
                        Buka <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/teacher/requests/${r.id}`}>
                  <Card className="px-4 py-4 transition-shadow hover:shadow-lift">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-navy-900">
                        {r.profiles?.nickname || r.profiles?.full_name || "Siswa"}
                      </p>
                      <span className="ml-auto text-xs text-navy-400">
                        {formatDateShortID(r.created_at)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge>{CATEGORY_LABELS[r.category]}</Badge>
                      <UrgencyBadge urgency={r.urgency} />
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-navy-600">
                      {r.message}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
