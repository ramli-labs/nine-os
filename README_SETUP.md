# NINE.OS — Panduan Setup (dari nol sampai online)

Estimasi total: ±30 menit. Target: siap dipakai sebelum Senin, 13 Juli 2026.

**Model akun:** kamu (wali kelas) membuat semua akun siswa dari dalam aplikasi.
Siswa login dengan **username + password** — tanpa email. Pendaftaran publik dimatikan.

## 1. Buat proyek Supabase

1. Masuk ke https://supabase.com → **New project**.
2. Nama: `nine-os` (bebas). Pilih region **Southeast Asia (Singapore)**.
3. Simpan **Database Password** di tempat aman (tidak dipakai aplikasi, hanya untuk admin).
4. Setelah proyek siap, buka **Project Settings → API** dan catat tiga nilai:
   - `Project URL` → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → untuk `SUPABASE_SERVICE_ROLE_KEY` (⚠️ rahasia server —
     jangan pernah ditaruh di variabel berawalan `NEXT_PUBLIC_`, di-commit, atau dibagikan)

## 2. Jalankan migrasi database

1. Buka **SQL Editor** di dashboard Supabase.
2. Jalankan isi `supabase/migrations/0001_schema.sql` (seluruh file, sekali jalan).
3. Jalankan isi `supabase/migrations/0002_rls.sql`.
4. Cek: **Table Editor** kini menampilkan 10 tabel, semuanya berlabel **RLS enabled**.

> Alternatif via CLI: `supabase link --project-ref <REF>` lalu `supabase db push`.

## 3. Konfigurasi Auth

1. **Authentication → Sign In / Up**: pastikan provider **Email** aktif
   (dipakai untuk login password — tidak ada email yang benar-benar dikirim ke siswa).
2. Di halaman yang sama, **matikan “Allow new users to sign up”** — semua akun
   hanya dibuat oleh kamu. Ini penting.
3. Tidak perlu mengatur template email atau SMTP untuk siswa.

## 4. Konfigurasi environment lokal

```bash
cp .env.example .env.local
```

Isi:

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

## 5. Buat akun wali kelas

Di dashboard Supabase: **Authentication → Users → Add user → Create new user**:

- Email: email kamu (mis. `nama@labschool.sch.id`)
- Password: pilih yang kuat
- Centang **Auto Confirm User**

Akun otomatis dibuat sebagai `student` oleh trigger — ini disengaja:
**tidak ada jalur self-service menjadi teacher**.

## 6. Naikkan role menjadi teacher (satu-satunya cara yang sah)

Di **SQL Editor**:

```sql
update public.profiles
set role = 'teacher', full_name = 'Nama Lengkap', nickname = 'Pak/Bu ...'
where email = 'nama@labschool.sch.id';
```

Jalankan `npm install && npm run dev`, buka `http://localhost:3000/login`,
masuk dengan **email + password** tadi → kamu diarahkan ke `/teacher`.

> Keamanan: kolom `role` tidak bisa di-update dari aplikasi oleh siapa pun
> (column-level grant + RLS). Promosi role hanya lewat SQL Editor — dan itu hanya kamu.

## 7. Kelola akun siswa (dari dalam aplikasi)

1. Buka **/teacher/students → Tambah siswa**.
2. Isi nama lengkap, nama panggilan, username (mis. `arka`), dan password awal
   (tombol **Acak** membuat password yang mudah disalin). **Catat sebelum
   menyimpan** — password tidak ditampilkan lagi.
3. Siswa login di `/login` dengan username + password tersebut.
4. Lupa password → buka profil siswa → **Atur ulang password**.

Fitur ini memakai `SUPABASE_SERVICE_ROLE_KEY` secara server-only dan hanya bisa
dijalankan akun teacher. Tanpa env tersebut, halaman lain tetap normal — hanya
pembuatan akun yang menolak dengan pesan yang jelas.

> Tips distribusi: cetak kartu kecil per siswa berisi URL, username, dan
> password awal — bagikan saat jam wali kelas pertama.

## 8. (Opsional) Seed data development

`supabase/seed.sql` membuat 1 guru + 5 siswa **FIKTIF** (password bersama:
`nineos-dev-123`; username `arka`, `bila`, `chandra`, `dinda`, `emil`; guru:
email `guru.dev@nineos.local`) plus contoh pengumuman, agenda, materi,
kesepakatan, denyut, dan pesan. **Hanya untuk proyek development** — jangan
dijalankan di proyek yang dipakai siswa sungguhan.

## 9. Verifikasi

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tanpa error
npm test           # unit test hijau
npm run test:rls   # 24 tes RLS hijau (butuh binari Postgres lokal)
```

Checklist manual singkat:

- [ ] Buka `/dashboard` tanpa login → terlempar ke `/login`.
- [ ] Login siswa (username) → mendarat di `/dashboard`; buka `/teacher` → “Akses dibatasi”.
- [ ] Login teacher (email) → mendarat di `/teacher`.
- [ ] Teacher: buat akun siswa uji, login sebagai siswa itu di jendela incognito.
- [ ] Siswa: isi Kenali Saya, Denyut, Tanya Wali, Target, Kapsul Waktu → tersimpan.
- [ ] Teacher: pesan siswa muncul di `/teacher/requests`, status bisa diubah; kapsul waktu **tidak** muncul di mana pun.
- [ ] Tes di ponsel (≈390px): navigasi bawah, form, dan tabel permintaan nyaman dipakai.

## 10. Deploy ke Vercel

1. Push repo ke GitHub (pastikan `.env.local` tidak ikut — sudah di `.gitignore`).
2. Di https://vercel.com → **Add New Project** → import repo (Next.js terdeteksi otomatis).
3. Set **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://<app>.vercel.app`
   - `SUPABASE_SERVICE_ROLE_KEY` (variabel biasa — bukan `NEXT_PUBLIC_`)
4. Deploy, lalu uji login end-to-end di URL produksi (teacher + satu akun siswa uji).

## 11. Hari pertama dipakai kelas

1. Buat akun seluruh siswa (langkah 7), siapkan kartu username+password.
2. Bagikan URL (atau QR ke `/login`).
3. Siswa login → langsung diarahkan mengisi **Kenali Saya** dari beranda.
4. Tulis pengumuman pertama (menjadi “Fokus Minggu Ini”), isi agenda minggu
   pertama, dan masukkan butir Kesepakatan Kelas hasil diskusi.
