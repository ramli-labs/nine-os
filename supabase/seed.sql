-- ============================================================
-- NINE.OS — Development seed data
--
-- ⚠️  DEVELOPMENT ONLY. Never run this against a project that
--     contains real student accounts. All names are fictional.
--
-- Creates: 1 teacher + 5 fake students (via auth.users, so the
-- profile trigger fires), plus sample announcements, events,
-- resources, charter items, pulses, and wali requests.
-- ============================================================

-- Fixed UUIDs so the seed is idempotent-ish and easy to reference.
-- All accounts share the DEV password: nineos-dev-123
-- Students log in with their username (arka, bila, …); the teacher
-- logs in with the full email guru.dev@nineos.local.
insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'guru.dev@nineos.local', crypt('nineos-dev-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Guru Dev (FIKTIF)","nickname":"Pak Guru"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'arka@siswa.nineos.id', crypt('nineos-dev-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Arka Contoh (FIKTIF)","nickname":"Arka"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'bila@siswa.nineos.id', crypt('nineos-dev-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bila Contoh (FIKTIF)","nickname":"Bila"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated',
   'chandra@siswa.nineos.id', crypt('nineos-dev-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Chandra Contoh (FIKTIF)","nickname":"Chandra"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated',
   'dinda@siswa.nineos.id', crypt('nineos-dev-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dinda Contoh (FIKTIF)","nickname":"Dinda"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated',
   'emil@siswa.nineos.id', crypt('nineos-dev-123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emil Contoh (FIKTIF)","nickname":"Emil"}', now(), now())
on conflict (id) do nothing;

-- Promote the dev teacher (the ONLY sanctioned way to assign teacher role).
update public.profiles set role = 'teacher'
where id = 'd0000000-0000-4000-8000-000000000001';

-- ── Sample content (created by the dev teacher) ───────────────
insert into public.announcements (title, content, is_published, published_at, created_by) values
  ('Selamat datang di NINE.OS',
   E'Halo 9B! Ini ruang digital kelas kita untuk satu tahun ke depan.\n\nMulai minggu ini, isi Denyut Mingguan setiap hari Senin–Rabu. Butuh waktu kurang dari satu menit.',
   true, now() - interval '2 days', 'd0000000-0000-4000-8000-000000000001'),
  ('Fokus minggu ini: adaptasi & ritme belajar',
   E'Fokus kita minggu ini sederhana: menemukan kembali ritme belajar setelah libur.\n\nCatat jadwalmu, siapkan target kecil, dan jangan ragu memakai Tanya Wali bila ada yang mengganjal.',
   true, now() - interval '6 hours', 'd0000000-0000-4000-8000-000000000001'),
  ('Draft: persiapan asesmen (belum dipublikasikan)',
   'Draft pengumuman tentang jadwal asesmen — masih disusun.',
   false, null, 'd0000000-0000-4000-8000-000000000001');

insert into public.events (title, description, start_at, end_at, location, created_by) values
  ('Upacara & apel pagi', 'Seragam lengkap. Datang 06.45.',
   date_trunc('week', now() at time zone 'Asia/Jakarta')::date + interval '4 day' + interval '7 hour' - interval '7 hour',
   null, 'Lapangan utama', 'd0000000-0000-4000-8000-000000000001'),
  ('Jam wali kelas: cek target semester',
   'Sesi santai 30 menit — kita lihat kembali target masing-masing.',
   now() + interval '3 days', now() + interval '3 days' + interval '1 hour',
   'Ruang 9B', 'd0000000-0000-4000-8000-000000000001'),
  ('Pengumpulan proyek Informatika',
   'Unggah proyek melalui LMS sekolah sebelum 15.00.',
   now() + interval '6 days', null, 'Online', 'd0000000-0000-4000-8000-000000000001');

insert into public.resources (title, description, content, url, category, is_published, created_by) values
  ('Cara belajar 25 menit yang benar-benar jalan',
   'Teknik fokus singkat untuk PR dan persiapan ulangan.',
   E'1. Pilih SATU tugas.\n2. Jauhkan HP dari meja (bukan sekadar dibalik).\n3. Pasang timer 25 menit.\n4. Istirahat 5 menit — berdiri, minum, jangan buka media sosial.\n5. Ulangi maksimal 4 putaran.',
   null, 'study', true, 'd0000000-0000-4000-8000-000000000001'),
  ('Memakai AI dengan jujur',
   'AI boleh membantumu berpikir — bukan berpikir menggantikanmu.',
   E'Boleh: minta penjelasan konsep, minta contoh soal latihan, minta umpan balik atas tulisanmu sendiri.\n\nTidak boleh: menyalin jawaban AI dan mengumpulkannya sebagai karyamu.\n\nAturan sederhananya: kalau kamu tidak bisa menjelaskan jawabanmu tanpa melihat layar, itu bukan jawabanmu.',
   null, 'ai_integrity', true, 'd0000000-0000-4000-8000-000000000001'),
  ('Peta jalan menuju SMA', 'Linimasa kasar pendaftaran SMA untuk tahun ajaran ini.',
   null, 'https://example.com/roadmap-sma', 'high_school', true, 'd0000000-0000-4000-8000-000000000001'),
  ('Draft: keamanan akun (belum terbit)', 'Masih disusun.', null, null, 'digital_safety', false,
   'd0000000-0000-4000-8000-000000000001');

insert into public.class_charter_items (title, description, display_order, is_active, created_by) values
  ('Kita hadir tepat waktu', 'Menghargai waktu bersama dimulai dari datang tepat waktu.', 1, true, 'd0000000-0000-4000-8000-000000000001'),
  ('Kita bertanya sebelum menilai', 'Salah paham dibereskan dengan bertanya, bukan berasumsi.', 2, true, 'd0000000-0000-4000-8000-000000000001'),
  ('Kita jujur dalam berkarya', 'Termasuk saat memakai AI dan sumber dari internet.', 3, true, 'd0000000-0000-4000-8000-000000000001'),
  ('Kita menjaga cerita teman', 'Hal pribadi yang diceritakan di kelas tidak menjadi bahan gosip.', 4, true, 'd0000000-0000-4000-8000-000000000001');

-- ── Sample student data ───────────────────────────────────────
insert into public.weekly_pulses (student_id, week_start, energy_level, pressure_level, feeling, needs_help, help_category, note) values
  ('d0000000-0000-4000-8000-000000000002', date_trunc('week', (now() at time zone 'Asia/Jakarta'))::date, 4, 2, 'termotivasi', false, null, 'Minggu pertama lumayan lancar.'),
  ('d0000000-0000-4000-8000-000000000003', date_trunc('week', (now() at time zone 'Asia/Jakarta'))::date, 2, 4, 'lelah', true, 'academic', 'Banyak tugas numpuk dari minggu lalu.'),
  ('d0000000-0000-4000-8000-000000000004', date_trunc('week', (now() at time zone 'Asia/Jakarta'))::date, 3, 3, 'campur_aduk', false, null, null),
  ('d0000000-0000-4000-8000-000000000005', date_trunc('week', (now() at time zone 'Asia/Jakarta'))::date, 5, 1, 'baik', false, null, 'Siap!'),
  ('d0000000-0000-4000-8000-000000000003', (date_trunc('week', (now() at time zone 'Asia/Jakarta'))::date - 7), 3, 3, 'bingung', false, null, null);

insert into public.wali_requests (student_id, category, message, urgency, status) values
  ('d0000000-0000-4000-8000-000000000003', 'academic',
   'Pak, saya kesulitan mengejar materi Matematika setelah sakit minggu lalu. Boleh minta saran cara mengejar ketinggalan?', 'this_week', 'submitted'),
  ('d0000000-0000-4000-8000-000000000004', 'friendship',
   'Ada masalah kecil dengan teman sebangku, saya ingin cerita kalau ada waktu.', 'normal', 'seen'),
  ('d0000000-0000-4000-8000-000000000006', 'future',
   'Saya masih bingung memilih SMA. Kapan bisa konsultasi?', 'normal', 'closed');

update public.wali_requests set closed_at = now() where status = 'closed';

insert into public.goals (student_id, academic_goal, character_goal, courage_goal) values
  ('d0000000-0000-4000-8000-000000000002', 'Nilai Matematika stabil di atas 85.', 'Lebih rapi mencatat dan mengatur waktu.', 'Berani presentasi tanpa membaca teks.');

insert into public.student_profiles (user_id, three_words, strengths, growth_area, hope, concern, future_plan, problem_response, support_note) values
  ('d0000000-0000-4000-8000-000000000002', 'Penasaran, santai, setia kawan', 'Cepat paham kalau sudah tertarik.',
   'Konsistensi belajar.', 'Lulus dengan nilai yang bikin orang tua tenang.', 'Takut keteteran di semester dua.',
   'SMA negeri dekat rumah.', 'Biasanya diam dulu, lalu cerita ke teman dekat.', 'Ingatkan saja kalau saya mulai banyak bercanda di kelas.');
