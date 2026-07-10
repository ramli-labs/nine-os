import Link from "next/link";
import { getProfile, roleHome } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/about", label: "Tentang" },
  { href: "/resources", label: "Materi" },
  { href: "/class-charter", label: "Kesepakatan" },
];

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-navy-100 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none sm:gap-1">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm text-navy-700 hover:bg-navy-100 sm:px-3"
              >
                {label}
              </Link>
            ))}
          </nav>
          <Link href={profile ? roleHome(profile.role) : "/login"}>
            <Button size="sm">{profile ? "Buka NINE.OS" : "Masuk"}</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-navy-100 bg-cream-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-sm text-navy-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold text-navy-800">NINE.OS</span> ·
            Kelas 9 · SMP Labschool Jakarta
          </p>
          <p className="italic">
            “Teknologi membantu kita terhubung. Bukan menggantikan percakapan.”
          </p>
        </div>
      </footer>
    </div>
  );
}
