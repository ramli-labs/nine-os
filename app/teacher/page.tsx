import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Activity,
  HandHelping,
  MessageCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { currentWeekStart, formatDateTimeID, greetingID } from "@/lib/date";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { WaliRequest, WeeklyPulse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, UrgencyBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Ringkasan Kelas" };

type PulseWithStudent = WeeklyPulse & {
  profiles: { nickname: string; full_name: string } | null;
};
type RequestWithStudent = WaliRequest & {
  profiles: { nickname: string; full_name: string } | null;
};

export default async function TeacherHomePage() {
  const profile = await requireTeacher();
  const supabase = await createClient();
  const weekStart = currentWeekStart();

  const [studentsRes, pulsesRes, openReqRes, eventsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("weekly_pulses")
      .select("*, profiles(nickname, full_name)")
      .eq("week_start", weekStart),
    supabase
      .from("wali_requests")
      .select("*, profiles(nickname, full_name)")
      .neq("status", "closed")
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("*")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(3),
  ]);

  const totalStudents = studentsRes.count ?? 0;
  const pulses = (pulsesRes.data ?? []) as PulseWithStudent[];
  const openRequests = (openReqRes.data ?? []) as RequestWithStudent[];
  const events = eventsRes.data ?? [];

  const helpAsked = pulses.filter((p) => p.needs_help);
  const highPressure = pulses.filter((p) => p.pressure_level >= 4);
  const completion =
    totalStudents > 0 ? Math.round((pulses.length / totalStudents) * 100) : 0;

  const stats = [
    { label: "Siswa", value: totalStudents, icon: Users, href: "/teacher/students" },
    {
      label: "Denyut minggu ini",
      value: `${pulses.length}/${totalStudents}`,
      icon: Activity,
      href: "/teacher/pulse",
      sub: `${completion}% terisi`,
    },
    {
      label: "Meminta bantuan",
      value: helpAsked.length,
      icon: HandHelping,
      href: "/teacher/pulse",
    },
    {
      label: "Pesan terbuka",
      value: openRequests.length,
      icon: MessageCircle,
      href: "/teacher/requests",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          {greetingID()}, {profile.nickname || profile.full_name}.
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Ringkasan kelas {profile.class_name} minggu ini.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, sub }) => (
          <Link key={label} href={href}>
            <Card className="h-full transition-shadow hover:shadow-lift">
              <CardContent className="px-4 py-4">
                <Icon className="h-5 w-5 text-accent-600" aria-hidden />
                <p className="mt-2 text-2xl font-semibold text-navy-950">
                  {value}
                </p>
                <p className="text-xs text-navy-500">{sub ?? label}</p>
                {sub ? <p className="text-xs text-navy-400">{label}</p> : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Perlu Perhatian */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Perlu Perhatian</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {helpAsked.length === 0 &&
            highPressure.length === 0 &&
            openRequests.length === 0 ? (
              <EmptyState
                title="Tidak ada yang menunggu"
                description="Saat ini tidak ada permintaan bantuan, pesan terbuka, atau laporan tekanan tinggi."
              />
            ) : (
              <ul className="divide-y divide-navy-100">
                {helpAsked.map((p) => (
                  <li key={`help-${p.id}`} className="flex items-center gap-3 py-3">
                    <Badge tone="amber">Meminta bantuan</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-900">
                        {p.profiles?.nickname || p.profiles?.full_name || "Siswa"}
                      </p>
                      <p className="text-xs text-navy-500">
                        Denyut mingguan ·{" "}
                        {p.help_category
                          ? CATEGORY_LABELS[p.help_category]
                          : "Umum"}
                      </p>
                    </div>
                    <Link
                      href="/teacher/pulse"
                      className="text-navy-400 hover:text-navy-700"
                      aria-label="Lihat denyut"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </li>
                ))}
                {highPressure
                  .filter((p) => !p.needs_help)
                  .map((p) => (
                    <li key={`pressure-${p.id}`} className="flex items-center gap-3 py-3">
                      <Badge tone="red">Tekanan dilaporkan tinggi</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy-900">
                          {p.profiles?.nickname || p.profiles?.full_name || "Siswa"}
                        </p>
                        <p className="text-xs text-navy-500">
                          Tekanan {p.pressure_level}/5 · energi {p.energy_level}/5
                        </p>
                      </div>
                      <Link
                        href="/teacher/pulse"
                        className="text-navy-400 hover:text-navy-700"
                        aria-label="Lihat denyut"
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </li>
                  ))}
                {openRequests.slice(0, 5).map((r) => (
                  <li key={`req-${r.id}`} className="flex items-center gap-3 py-3">
                    <Badge tone="blue">Perlu ditindaklanjuti</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-900">
                        {r.profiles?.nickname || r.profiles?.full_name || "Siswa"}
                      </p>
                      <p className="text-xs text-navy-500">
                        Tanya Wali · {CATEGORY_LABELS[r.category]}
                      </p>
                    </div>
                    <UrgencyBadge urgency={r.urgency} />
                    <Link
                      href={`/teacher/requests/${r.id}`}
                      className="text-navy-400 hover:text-navy-700"
                      aria-label="Buka pesan"
                    >
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs leading-relaxed text-navy-400">
              Daftar ini berdasarkan laporan siswa sendiri — bukan penilaian
              atau diagnosis. Tindak lanjut terbaik tetap percakapan langsung.
            </p>
          </CardContent>
        </Card>

        {/* Agenda */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent-600" aria-hidden />
              <CardTitle>Agenda terdekat</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {events.length === 0 ? (
              <p className="text-sm text-navy-500">Belum ada agenda.</p>
            ) : (
              <ul className="space-y-3">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <p className="text-sm font-medium text-navy-900">
                      {ev.title}
                    </p>
                    <p className="text-xs text-navy-500">
                      {formatDateTimeID(ev.start_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/teacher/events"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-navy-800 underline-offset-2 hover:underline"
            >
              Kelola agenda <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
