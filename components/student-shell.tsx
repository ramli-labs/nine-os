"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Activity,
  MessageCircle,
  Compass,
  Mail,
  BookOpen,
  Handshake,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const primaryNav = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/pulse", label: "Denyut", icon: Activity },
  { href: "/ask-wali", label: "Tanya Wali", icon: MessageCircle },
  { href: "/journey", label: "Target", icon: Compass },
  { href: "/time-capsule", label: "Kapsul", icon: Mail },
];

const secondaryNav = [
  { href: "/resources", label: "Materi", icon: BookOpen },
  { href: "/class-charter", label: "Kesepakatan", icon: Handshake },
];

export function StudentShell({
  nickname,
  children,
}: {
  nickname: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-navy-100 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex">
            {[...primaryNav, ...secondaryNav].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(href)
                    ? "bg-navy-900 font-medium text-cream-50"
                    : "text-navy-700 hover:bg-navy-100"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/profile"
            aria-label="Profil"
            className={cn(
              "flex items-center gap-2 rounded-full border border-navy-200 py-1.5 pl-2 pr-3 text-sm text-navy-800 hover:bg-navy-100",
              isActive("/profile") && "bg-navy-100"
            )}
          >
            <UserRound className="h-4 w-4" aria-hidden />
            <span className="max-w-24 truncate">{nickname}</span>
          </Link>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2 scrollbar-none md:hidden">
          {secondaryNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full border border-navy-200 px-3 py-1 text-xs",
                isActive(href)
                  ? "bg-navy-900 text-cream-50"
                  : "bg-white/60 text-navy-700"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">{children}</main>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-navy-100 bg-cream-50/95 backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {primaryNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "tap-target flex flex-col items-center justify-center gap-0.5 py-2 text-[11px]",
                  active ? "font-semibold text-navy-950" : "text-navy-500"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "text-accent-600")}
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
