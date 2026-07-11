import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  MessageCircle,
  Compass,
  Mail,
  CalendarDays,
  Megaphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  currentWeekStart,
  formatDateTimeID,
  formatPlainDateID,
  greetingID,
  jakartaDateString,
} from "@/lib/date";
import { feelingDisplay } from "@/lib/labels";
import type { Announcement, ClassEvent, WeeklyPulse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Beranda" };

const quickLinks = [
  {
    href: "/pulse",
    title: "Isi Denyut Mingguan",
    desc: "Kurang dari satu menit",
    icon: Activity,
  },
  {
    href: "/ask-wali",
    title: "Tanya Wali",
    desc: "Ruang pribadi untuk bicara",
    icon: MessageCircle,
  },
  {
    href: "/journey",
    title: "Lihat Target Saya",
    desc: "Diriku pada Juni 2027",
    icon: Compass,
  },
  {
    href: "/time-capsule",
    title: "Kapsul Waktu",
    desc: "Surat untuk masa depan",
    icon: Mail,
  },
];

export default async function DashboardPage() {
  const profile = await requireStudent();
  const supabase = await createClient();
  const weekStart = currentWeekStart();

  const [pulseRes, eventsRes, announcementsRes, onboardingRes, piketRes] =
    await Promise.all([
      supabase
        .from("weekly_pulses")
        .select("*")
        .eq("student_id", profile.id)
        .eq("week_start", weekStart)
        .maybeSingle(),
      supabase
        .from("events")
        .select("*")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3),
      supabase
        .from("announcements")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3),
      supabase
        .from("student_profiles")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle(),
      supabase
        .from("piket_schedules")
        .select("id, duty_date")
        .gte("duty_date", jakartaDateString())
        .order("duty_date", { ascending: true })
        .limit(5),
    ]);

  const pulse = pulseRes.data as WeeklyPulse | null;
  const events = (eventsRes.data ?? []) as ClassEvent[];
  const announcements = (announcementsRes.data ?? []) as Announcement[];
  const hasOnboarded = Boolean(onboardingRes.data);
  const focus = announcements[0] ?? null;

  // Giliran piketku berikutnya (jadwal harian).
  const upcomingSchedules = (piketRes.data ?? []) as {
    id: string;
    duty_date: string;
  }[];
  let myDutyDate: string | null = null;
  if (upcomingSchedules.length > 0) {
    const { data: myAssignments } = await supabase
      .from("piket_assignments")
      .select("schedule_id")
      .eq("student_id", profile.id)
      .in(
        "schedule_id",
        upcomingSchedules.map((s) => s.id)
      );
    const mine = new Set((myAssignments ?? []).map((a) => a.schedule_id));
    myDutyDate =
      upcomingSchedules.find((s) => mine.has(s.id))?.duty_date ?? null;
  }
  const today = jakartaDateString();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          {greetingID()}, {profile.nickname || profile.full_name}.
        </h1>
        <p className="mt-1 text-sm text-navy-600">
          Selamat datang di ruang kelasmu.
          {myDutyDate ? (
            <>
              {" "}
              <Link
                href="/piket"
                className="font-medium text-navy-900 underline-offset-2 hover:underline"
              >
                {myDutyDate === today
                  ? "Hari ini kamu bertugas piket."
                  : `Piketmu berikutnya: ${formatPlainDateID(myDutyDate)}.`}
              </Link>
            </>
          ) : null}
        </p>
      </section>

      {!hasOnboarded ? (
        <Link href="/onboarding" className="block">
          <Card className="border-accent-500/40 bg-gradient-to-r from-accent-400/10 to-transparent transition-shadow hover:shadow-lift">
            <CardContent className="flex items-center gap-4">
              <Sparkles className="h-6 w-6 shrink-0 text-accent-600" aria-hidden />
              <div className="flex-1">
                <p className="font-medium text-navy-950">Kenali Saya</p>
                <p className="text-sm text-navy-600">
                  Bantu wali kelas mengenalmu — 9 pertanyaan singkat, sekali
                  saja di awal tahun.
                </p>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-navy-400" aria-hidden />
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {/* Fokus Minggu Ini */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-accent-600" aria-hidden />
            <CardTitle>Fokus Minggu Ini</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {focus ? (
            <>
              <p className="font-medium text-navy-900">{focus.title}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-navy-700">
                {focus.content}
              </p>
            </>
          ) : (
            <p className="text-sm text-navy-500">
              Belum ada fokus minggu ini. Nantikan pengumuman dari wali kelas.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Agenda Terdekat */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent-600" aria-hidden />
              <CardTitle>Agenda Terdekat</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {events.length === 0 ? (
              <p className="text-sm text-navy-500">
                Belum ada agenda terjadwal.
              </p>
            ) : (
              <ul className="space-y-3">
                {events.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-500" />
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {ev.title}
                      </p>
                      <p className="text-xs text-navy-500">
                        {formatDateTimeID(ev.start_at)}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Refleksi Singkat */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent-600" aria-hidden />
              <CardTitle>Refleksi Singkat</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            {pulse ? (
              <div className="space-y-2 text-sm text-navy-700">
                <p>
                  Denyut minggu ini sudah terisi — perasaan dominan:{" "}
                  <span className="font-medium text-navy-900">
                    {feelingDisplay(pulse.feeling, pulse.feeling_detail)}
                  </span>
                  .
                </p>
                <Link
                  href="/pulse"
                  className="inline-flex items-center gap-1 text-sm font-medium text-navy-800 underline-offset-2 hover:underline"
                >
                  Lihat / perbarui <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-navy-700">
                <p>
                  Kamu belum mengisi Denyut Mingguan. Satu menit saja — supaya
                  minggumu tidak lewat begitu saja.
                </p>
                <Link
                  href="/pulse"
                  className="inline-flex items-center gap-1 text-sm font-medium text-navy-800 underline-offset-2 hover:underline"
                >
                  Isi sekarang <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Akses cepat */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
          Akses cepat
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickLinks.map(({ href, title, desc, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="h-full transition-shadow hover:shadow-lift">
                <CardContent className="px-4 py-4">
                  <Icon className="h-5 w-5 text-accent-600" aria-hidden />
                  <p className="mt-2 text-sm font-medium leading-snug text-navy-900">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-500">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Pengumuman */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-500">
          Pengumuman terbaru
        </h2>
        {announcements.length === 0 ? (
          <EmptyState
            title="Belum ada pengumuman"
            description="Pengumuman dari wali kelas akan muncul di sini."
          />
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <CardContent className="px-5 py-4">
                  <p className="font-medium text-navy-900">{a.title}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-navy-600">
                    {a.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
