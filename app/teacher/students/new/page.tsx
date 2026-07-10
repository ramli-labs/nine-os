import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTeacher } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { NewStudentForm } from "./student-form";

export const metadata: Metadata = { title: "Tambah Siswa" };

export default async function NewStudentPage() {
  await requireTeacher();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Semua siswa
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">
          Tambah Siswa
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-navy-600">
          Buat akun untuk siswa 9B. Siswa masuk dengan username + password —
          tanpa email. Akun baru selalu berperan siswa.
        </p>
      </div>

      <Card>
        <CardContent>
          <NewStudentForm />
        </CardContent>
      </Card>
    </div>
  );
}
