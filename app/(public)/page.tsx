import Link from "next/link";
import {
  CalendarDays,
  Activity,
  MessageCircle,
  Mail,
  Handshake,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const functions = [
  {
    tag: "RENCANA",
    title: "Agenda Kelas",
    desc: "Ujian, kegiatan, dan tenggat penting dalam satu tempat — tidak ada lagi “aku nggak tahu ada tugas”.",
    icon: CalendarDays,
  },
  {
    tag: "REFLEKSI",
    title: "Denyut Mingguan",
    desc: "Satu menit setiap minggu untuk berhenti sejenak dan menengok kabar diri sendiri.",
    icon: Activity,
  },
  {
    tag: "BERTANYA",
    title: "Tanya Wali",
    desc: "Ruang pribadi untuk bertanya, meminta bantuan, atau mengajak bicara — tanpa menunggu terlalu berat.",
    icon: MessageCircle,
  },
  {
    tag: "MENGINGAT",
    title: "Kapsul Waktu",
    desc: "Surat untuk dirimu di masa depan, disegel hingga menjelang kelulusan Juni 2027.",
    icon: Mail,
  },
  {
    tag: "MEMBANGUN",
    title: "Kesepakatan Kelas",
    desc: "Budaya kelas yang dirumuskan bersama — bukan aturan yang dijatuhkan dari atas.",
    icon: Handshake,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy-950 text-cream-50">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-accent-400">
            Class 9 Operating System
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
            NINE<span className="text-accent-400">.OS</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-100">
            Ruang digital kelas untuk agenda, refleksi, komunikasi, dan
            perjalanan bersama.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full bg-accent-500 text-navy-950 hover:bg-accent-400 sm:w-auto"
              >
                Masuk ke NINE.OS
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-navy-700 bg-transparent text-cream-50 hover:bg-navy-900 sm:w-auto"
              >
                Kenali Sistemnya
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Kenapa NINE.OS */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-navy-950">
          Kenapa NINE.OS?
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-600">
          Kelas 9 adalah tahun yang padat: target akademik, pilihan SMA, dan
          perpisahan. NINE.OS membantu kita menjalaninya dengan lebih tertata —
          dan lebih saling terhubung.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {functions.map(({ tag, title, desc, icon: Icon }) => (
            <Card key={tag} className="h-full">
              <CardContent className="px-5 py-5">
                <Icon className="h-6 w-6 text-accent-600" aria-hidden />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-navy-400">
                  {tag}
                </p>
                <p className="mt-1 font-semibold text-navy-950">{title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">
                  {desc}
                </p>
              </CardContent>
            </Card>
          ))}

          {/* Principle card */}
          <Card className="h-full border-navy-800 bg-navy-900">
            <CardContent className="flex h-full flex-col justify-center px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-400">
                Prinsip kami
              </p>
              <p className="mt-2 text-lg font-medium leading-snug text-cream-50">
                “Teknologi membantu kita terhubung. Bukan menggantikan
                percakapan.”
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
