# NINE.OS — Class 9 Operating System

Ruang digital kelas 9 SMP Labschool Jakarta untuk agenda, refleksi, komunikasi, dan perjalanan bersama.

> “Teknologi membantu kita terhubung. Bukan menggantikan percakapan.”

## Fitur

**Publik** (tanpa login): beranda, tentang, materi terpublikasi, kesepakatan kelas.

**Siswa** (login): beranda personal (fokus minggu ini, agenda, refleksi, pengumuman), form “Kenali Saya” (onboarding 9 pertanyaan, 3 langkah, tersimpan per langkah), Denyut Mingguan (energi, tekanan, perasaan, kebutuhan bantuan — satu per minggu, bisa diperbarui), Tanya Wali (kategori, urgensi, status terpantau), Perjalananku (3 target: akademik, karakter, keberanian), Kapsul Waktu (surat untuk Juni 2027 — tidak dibaca siapa pun, termasuk wali kelas), dan profil.

**Wali kelas** (login + role teacher): ringkasan kelas + daftar “Perlu Perhatian” (berbasis laporan siswa sendiri, tanpa label diagnosis), daftar & profil pendampingan siswa, **pembuatan akun siswa + reset password** (siswa login dengan username, tanpa email), **generator jadwal piket acak** (Senin–Jumat dibagi rata, komposisi L/P per hari seimbang, bisa diacak ulang kapan saja), ikhtisar Denyut (rata-rata, sebaran perasaan, partisipasi, respons individual), workflow Tanya Wali (submitted → seen → follow_up → closed), serta CRUD pengumuman, agenda, materi, dan kesepakatan kelas.

## Tech stack

Next.js 15 (App Router, TypeScript, Server Actions) · Tailwind CSS · Supabase (Postgres + Auth + RLS) · Zod · Lucide · Vitest. Zona waktu: Asia/Jakarta. Bahasa antarmuka: Indonesia. Target deploy: Vercel.

**Model akun:** pendaftaran publik dimatikan. Semua akun siswa dibuat wali kelas dari `/teacher/students/new` (username + password; di belakang layar username dipetakan ke alamat internal `@siswa.nineos.id` — tidak ada email yang dikirim). Lupa password ditangani wali kelas lewat tombol “Atur ulang password” di profil siswa.

## Struktur proyek

```
app/
  (public)/        # /, /about, /resources, /class-charter
  (student)/       # /dashboard /onboarding /pulse /ask-wali /journey /time-capsule /profile
  teacher/         # /teacher + students, pulse, requests, announcements, events, resources, charter
  login/  auth/confirm/  unauthorized/
components/        # ui primitives, shells, crud bits
lib/               # supabase clients, auth guards, validation (zod), date (WIB), labels
supabase/
  migrations/      # 0001_schema.sql, 0002_rls.sql
  seed.sql         # data dev FIKTIF (jangan untuk produksi)
  tests/           # auth_shim.sql + rls_tests.sql (24 pengujian isolasi)
scripts/           # test-rls.sh (uji RLS di Postgres lokal), run-sql.mjs
tests/             # unit test (vitest): validasi zod + logika tanggal WIB
```

## Menjalankan

```bash
npm install
cp .env.example .env.local   # isi kredensial Supabase (lihat README_SETUP.md)
npm run dev                  # http://localhost:3000
```

## Pengujian

```bash
npm run typecheck   # TypeScript strict, tanpa error
npm test            # 21 unit test: batas nilai pulse, enum, skema role-safe, week-start WIB
npm run test:rls    # spin-up Postgres lokal → migrasi → seed → 24 tes RLS
```

`test:rls` membutuhkan binari server Postgres (`apt install postgresql postgresql-contrib`, atau `npm i --prefix /tmp/pgtools @embedded-postgres/linux-x64`). Ia memverifikasi di database sungguhan bahwa: siswa A tidak bisa membaca pulse/pesan/target/kapsul siswa B, siswa tidak bisa menaikkan role menjadi teacher, siswa tidak bisa mengubah status workflow, teacher bisa membaca data pendampingan tetapi TIDAK bisa membaca kapsul waktu, dan anon hanya melihat konten terpublikasi.

## Model keamanan

- **RLS aktif di semua tabel data pengguna, default deny.** Otorisasi ditegakkan di database — bukan hanya disembunyikan di UI.
- **Role tidak pernah berasal dari client.** Role dibaca dari tabel `profiles` di server; redirect & guard (`requireStudent` / `requireTeacher`) berjalan server-side. Trigger `handle_new_user` selalu membuat akun baru sebagai `student`.
- **Eskalasi role diblokir dua lapis:** column-level grant (`authenticated` hanya boleh UPDATE `full_name, nickname, avatar_url` di `profiles`) + tidak ada policy INSERT/DELETE profiles untuk client.
- **`is_teacher()`** adalah fungsi `SECURITY DEFINER` dengan `search_path` terkunci — menghindari recursive RLS policy.
- **Tanya Wali:** INSERT siswa dipaksa `status='submitted'` oleh policy; UPDATE hanya teacher, dan grant kolom membatasi teacher hanya pada `status, closed_at` (isi pesan siswa immutable).
- **Kapsul Waktu:** tidak ada policy teacher sama sekali. Akses darurat (mis. isu keselamatan) hanya lewat service role di dashboard Supabase oleh pemilik proyek — sengaja bukan fitur aplikasi, dan keputusan ini terdokumentasi.
- **Service role key hanya untuk administrasi akun, server-only.** Seluruh akses data memakai anon key + RLS. Satu-satunya pemakaian service role adalah membuat akun siswa & reset password, dengan tiga lapis pengaman: (1) env tanpa `NEXT_PUBLIC_` sehingga tidak pernah masuk bundle browser, (2) modul `lib/supabase/admin.ts` diberi guard paket `server-only` (import dari client component menggagalkan build), (3) setiap aksi lolos `teacherGuard()` dulu — role dibaca dari database, dan reset password menolak target non-siswa.
- Validasi Zod di setiap server action; pesan error manusiawi, tanpa raw database error ke siswa.

## Keterbatasan yang diketahui (MVP)

- Tidak ada pemulihan password mandiri untuk siswa (by design, karena tanpa email) — reset hanya lewat wali kelas. Konsekuensi: kalau akun wali kelas sendiri terkunci, pulihkan lewat dashboard Supabase.
- Pembuatan akun satu per satu (belum ada import CSV massal untuk 30+ siswa sekaligus).
- “Fokus Minggu Ini” di beranda siswa = pengumuman terpublikasi terbaru (konvensi, bukan field terpisah).
- Siswa melihat denyut minggu berjalan saja (riwayat penuh ada di sisi teacher).
- Pengujian RLS dilakukan pada Postgres lokal dengan shim skema auth (bukan instance Supabase live) — perilaku policy identik, tetapi verifikasi akhir di Supabase tetap disarankan (checklist di README_SETUP.md).
- Belum ada: notifikasi, riwayat multi-tahun, arsip kelas, atau pembukaan otomatis Kapsul Waktu pada `unlock_date` (Juni 2027) — pembukaannya adalah momen kelas, bukan fitur cron.

Panduan setup lengkap: **README_SETUP.md**.
