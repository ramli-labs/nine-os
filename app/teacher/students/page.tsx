import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { displayUsername } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Daftar Siswa" };

export default async function StudentsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("full_name", { ascending: true });

  const students = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
            Siswa
          </h1>
          <p className="mt-1 text-sm text-navy-600">
            {students.length} siswa terdaftar di NINE.OS.
          </p>
        </div>
        <Link href="/teacher/students/new">
          <Button size="sm">
            <UserPlus className="h-4 w-4" aria-hidden />
            Tambah siswa
          </Button>
        </Link>
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="Belum ada siswa"
          description="Buat akun siswa pertama — siswa masuk dengan username + password yang kamu berikan."
          action={
            <Link href="/teacher/students/new">
              <Button size="sm">
                <UserPlus className="h-4 w-4" aria-hidden />
                Tambah siswa
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-navy-100">
            {students.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/teacher/students/${s.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-navy-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                    {(s.nickname || s.full_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy-900">
                      {s.full_name || s.nickname}
                      {s.status === "inactive" ? (
                        <Badge tone="red" className="ml-2">
                          Nonaktif
                        </Badge>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-navy-500">
                      @{displayUsername(s.email)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-navy-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
