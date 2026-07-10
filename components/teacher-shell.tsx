"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { UserRound } from "lucide-react";

const nav = [
  { href: "/teacher", label: "Ringkasan", exact: true },
  { href: "/teacher/students", label: "Siswa" },
  { href: "/teacher/pulse", label: "Denyut" },
  { href: "/teacher/requests", label: "Tanya Wali" },
  { href: "/teacher/announcements", label: "Pengumuman" },
  { href: "/teacher/events", label: "Agenda" },
  { href: "/teacher/resources", label: "Materi" },
  { href: "/teacher/charter", label: "Kesepakatan" },
];

export function TeacherShell({
  nickname,
  children,
}: {
  nickname: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-navy-100 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-baseline gap-2">
            <Logo href="/teacher" />
            <span className="hidden text-xs font-medium uppercase tracking-wide text-navy-400 sm:inline">
              Wali Kelas
            </span>
          </div>
          <Link
            href="/teacher/profile"
            className="flex items-center gap-2 rounded-full border border-navy-200 py-1.5 pl-2 pr-3 text-sm text-navy-800 hover:bg-navy-100"
          >
            <UserRound className="h-4 w-4" aria-hidden />
            <span className="max-w-28 truncate">{nickname}</span>
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 scrollbar-none">
          {nav.map(({ href, label, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-navy-900 font-medium text-cream-50"
                    : "text-navy-700 hover:bg-navy-100"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
