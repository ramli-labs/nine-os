import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateShortID, formatDateTimeID, formatPlainDateID } from "@/lib/date";
import { CATEGORY_LABELS, FEELING_LABELS } from "@/lib/labels";
import type {
  Goals,
  Profile,
  StudentProfile,
  WaliRequest,
  WeeklyPulse,
} from "@/lib/types";
import { displayUsername } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge, UrgencyBadge } from "@/components/ui/badge";
import { ResetPasswordForm } from "./reset-password-form";
import { GenderForm } from "./gender-form";
import { DeleteStudentForm } from "./delete-student-form";
import { NameForm } from "./name-form";

export const metadata: Metadata = { title: "Profil Siswa" };

const kenaliSayaFields: { key: keyof StudentProfile; label: string }[] = [
  { key: "three_words", label: "Tiga kata tentang dirinya" },
  { key: "strengths", label: "Kekuatan" },
  { key: "growth_area", label: "Ingin ditingkatkan" },
  { key: "hope", label: "Harapan di kelas 9" },
  { key: "concern", label: "Kekhawatiran" },
  { key: "future_plan", label: "Rencana setelah SMP" },
  { key: "problem_response", label: "Saat menghadapi masalah" },
  { key: "support_note", label: "Cara mendampingi terbaik" },
  { key: "private_note_to_teacher", label: "Pesan pribadi untuk wali kelas" },
];

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireTeacher();
  const { id } = await params;
  const supabase = await createClient();

  const [profileRes, spRes, pulsesRes, goalsRes, requestsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", id)
        .maybeSingle(),
      supabase
        .from("weekly_pulses")
        .select("*")
        .eq("student_id", id)
        .order("week_start", { ascending: false })
        .limit(6),
      supabase.from("goals").select("*").eq("student_id", id).maybeSingle(),
      supabase
        .from("wali_requests")
        .select("*")
        .eq("student_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const student = profileRes.data as Profile | null;
  if (!student || student.role !== "student") notFound();

  const sp = spRes.data as StudentProfile | null;
  const pulses = (pulsesRes.data ?? []) as WeeklyPulse[];
  const goals = goalsRes.data as Goals | null;
  const requests = (requestsRes.data ?? []) as WaliRequest[];

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Semua siswa
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
            {student.full_name || student.nickname}
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            {student.nickname ? `“${student.nickname}” · ` : ""}
            username <span className="font-medium">@{displayUsername(student.email)}</span>{" "}
            · Kelas {student.class_name}
          </p>
          <div className="mt-2">
            <GenderForm userId={student.id} current={student.gender} />
          </div>
          <div className="mt-2">
            <NameForm
              userId={student.id}
              fullName={student.full_name}
              nickname={student.nickname}
            />
          </div>
        </div>
        <ResetPasswordForm userId={student.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kenali Saya */}
        <Card>
          <CardHeader>
            <CardTitle>Kenali Saya</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {!sp ? (
              <p className="text-sm text-navy-500">
                Belum mengisi form Kenali Saya.
              </p>
            ) : (
              <dl className="space-y-4">
                {kenaliSayaFields.map(({ key, label }) => {
                  const value = sp[key];
                  if (!value || typeof value !== "string") return null;
                  return (
                    <div key={key}>
                      <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">
                        {label}
                      </dt>
                      <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-navy-800">
                        {value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Target — Diriku pada Juni 2027</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {!goals ? (
                <p className="text-sm text-navy-500">Belum menetapkan target.</p>
              ) : (
                <dl className="space-y-3 text-sm">
                  {[
                    ["Akademik", goals.academic_goal],
                    ["Karakter", goals.character_goal],
                    ["Keberanian", goals.courage_goal],
                  ].map(([label, value]) =>
                    value ? (
                      <div key={label}>
                        <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">
                          {label}
                        </dt>
                        <dd className="mt-0.5 text-navy-800">{value}</dd>
                      </div>
                    ) : null
                  )}
                </dl>
              )}
            </CardContent>
          </Card>

          {/* Pulses */}
          <Card>
            <CardHeader>
              <CardTitle>Denyut terakhir</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {pulses.length === 0 ? (
                <p className="text-sm text-navy-500">Belum ada denyut.</p>
              ) : (
                <ul className="space-y-3">
                  {pulses.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-2 text-sm"
                    >
                      <span className="w-24 shrink-0 text-xs text-navy-500">
                        {formatPlainDateID(p.week_start)}
                      </span>
                      <Badge>{FEELING_LABELS[p.feeling]}</Badge>
                      <span className="text-xs text-navy-600">
                        Energi {p.energy_level}/5 · Tekanan {p.pressure_level}/5
                      </span>
                      {p.needs_help ? (
                        <Badge tone="amber">Meminta bantuan</Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Tanya Wali terakhir</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              {requests.length === 0 ? (
                <p className="text-sm text-navy-500">Belum ada pesan.</p>
              ) : (
                <ul className="space-y-3">
                  {requests.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/teacher/requests/${r.id}`}
                        className="block rounded-xl border border-navy-100 px-4 py-3 transition-colors hover:bg-navy-50"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{CATEGORY_LABELS[r.category]}</Badge>
                          <UrgencyBadge urgency={r.urgency} />
                          <StatusBadge status={r.status} />
                          <span className="ml-auto text-xs text-navy-400">
                            {formatDateShortID(r.created_at)}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-navy-700">
                          {r.message}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-navy-400">
        Terdaftar sejak {formatDateTimeID(student.created_at)}. Kapsul Waktu
        siswa tidak ditampilkan — data tersebut privat milik siswa.
      </p>

      <DeleteStudentForm
        userId={student.id}
        username={displayUsername(student.email)}
      />
    </div>
  );
}
