import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, EyeOff, HeartHandshake } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Tentang" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-950">
        Tentang NINE.OS
      </h1>

      <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-navy-700">
        <p>
          NINE.OS adalah ruang digital kelas 9 — dibuat oleh wali kelas, untuk
          satu tahun yang hanya terjadi sekali. Bukan LMS, bukan sistem
          administrasi sekolah. Lebih seperti meja wali kelas yang selalu bisa
          kamu datangi.
        </p>
        <p>
          Di dalamnya ada agenda kelas, refleksi mingguan yang selesai dalam
          satu menit, ruang pribadi untuk bertanya kepada wali kelas, target
          pribadimu untuk Juni 2027, dan sebuah surat yang baru akan kamu buka
          menjelang kelulusan.
        </p>
        <p className="font-medium text-navy-900">
          Prinsipnya satu: teknologi membantu kita terhubung — bukan
          menggantikan percakapan. Hal terpenting tetap terjadi di ruang kelas,
          bukan di layar.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        {[
          {
            icon: EyeOff,
            title: "Privasi dihargai",
            desc: "Refleksi, target, dan pesanmu hanya bisa dibaca olehmu dan wali kelas — tidak pernah oleh teman sekelas. Kapsul Waktu bahkan tidak dibaca wali kelas.",
          },
          {
            icon: ShieldCheck,
            title: "Bukan pengawasan",
            desc: "Tidak ada peringkat, tidak ada papan mood kelas, tidak ada label. Data dipakai untuk satu hal: membantu wali kelas hadir lebih tepat.",
          },
          {
            icon: HeartHandshake,
            title: "Keselamatan tetap utama",
            desc: "Jika ada hal yang menyangkut keselamatanmu atau orang lain, wali kelas mungkin perlu mencari dukungan yang tepat. Itu dilakukan demi kamu, bukan tentang kamu.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title}>
            <CardContent className="flex gap-4 px-5 py-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" aria-hidden />
              <div>
                <p className="font-medium text-navy-900">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-navy-600">
                  {desc}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/login">
          <Button size="lg">Masuk ke NINE.OS</Button>
        </Link>
      </div>
    </div>
  );
}
