-- ============================================================
-- NINE.OS — Migration 0006: revisi keamanan & struktur
--   A. profiles: status akun, wajib ganti password, last login
--   B. audit_logs: jejak aksi wali kelas (teacher-only)
--   C. wali_request_notes: catatan tindak lanjut — TABEL TERPISAH
--      agar RLS (per-baris) bisa menjamin siswa tak membacanya
--   D. piket: restrukturisasi ke jadwal HARIAN dengan riwayat,
--      fairness, exclusions, completed, dan manual override
-- ============================================================

-- ── A. profiles ──────────────────────────────────────────────
alter table public.profiles
  add column status text not null default 'active'
    check (status in ('active', 'inactive')),
  add column must_change_password boolean not null default false,
  add column last_login_at timestamptz;

-- status / must_change_password / last_login_at TIDAK diberi
-- column grant ke authenticated — semuanya diubah lewat server
-- action ber-guard teacher (service role) sehingga siswa tidak
-- mungkin mengaktifkan kembali akunnya sendiri.

-- Trigger signup: baca gender & must_change_password dari metadata;
-- role tetap DIPAKSA 'student'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles
    (id, email, full_name, nickname, role, gender, must_change_password)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(
      new.raw_user_meta_data->>'nickname',
      initcap(split_part(coalesce(new.email, ''), '@', 1))
    ),
    'student',
    case
      when new.raw_user_meta_data->>'gender' in ('L', 'P')
        then new.raw_user_meta_data->>'gender'
      else null
    end,
    coalesce((new.raw_user_meta_data->>'must_change_password')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── B. audit_logs ────────────────────────────────────────────
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_created on public.audit_logs (created_at desc);
create index idx_audit_logs_target on public.audit_logs (target_type, target_id);

alter table public.audit_logs enable row level security;
grant select, insert on public.audit_logs to authenticated;

create policy "audit: teacher reads"
  on public.audit_logs for select to authenticated
  using (public.is_teacher());

-- insert hanya oleh teacher, dan actor tak bisa dipalsukan
create policy "audit: teacher inserts as self"
  on public.audit_logs for insert to authenticated
  with check (actor_id = auth.uid() and public.is_teacher());

-- ── C. wali_request_notes (teacher-only, 1:1 dengan request) ─
create table public.wali_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique
    references public.wali_requests(id) on delete cascade,
  teacher_note text,
  follow_up_at timestamptz,
  closed_reason text,
  updated_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_request_notes_updated_at
  before update on public.wali_request_notes
  for each row execute function public.set_updated_at();

alter table public.wali_request_notes enable row level security;
grant select, insert, update, delete on public.wali_request_notes to authenticated;

create policy "request notes: teacher only"
  on public.wali_request_notes for all to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

-- ── D. piket harian ──────────────────────────────────────────
drop table if exists public.piket_assignments;

create table public.piket_schedules (
  id uuid primary key default gen_random_uuid(),
  duty_date date not null unique,
  generated_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_piket_schedules_date on public.piket_schedules (duty_date desc);

create trigger trg_piket_schedules_updated_at
  before update on public.piket_schedules
  for each row execute function public.set_updated_at();

create table public.piket_assignments (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null
    references public.piket_schedules(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (schedule_id, student_id)
);

create index idx_piket_assignments_schedule on public.piket_assignments (schedule_id);
create index idx_piket_assignments_student on public.piket_assignments (student_id);

create table public.piket_exclusions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  exclusion_date date not null,
  reason text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, exclusion_date)
);

create index idx_piket_exclusions_date on public.piket_exclusions (exclusion_date);

alter table public.piket_schedules  enable row level security;
alter table public.piket_assignments enable row level security;
alter table public.piket_exclusions enable row level security;

grant select, insert, update, delete on public.piket_schedules  to authenticated;
grant select, insert, update, delete on public.piket_assignments to authenticated;
grant select, insert, update, delete on public.piket_exclusions to authenticated;

-- Jadwal & petugas terlihat oleh seluruh kelas (nama saja) — tidak publik.
create policy "piket schedules: class reads active, teacher all"
  on public.piket_schedules for select to authenticated
  using (status = 'active' or public.is_teacher());

create policy "piket schedules: teacher insert"
  on public.piket_schedules for insert to authenticated
  with check (public.is_teacher() and generated_by = auth.uid());

create policy "piket schedules: teacher update"
  on public.piket_schedules for update to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "piket schedules: teacher delete"
  on public.piket_schedules for delete to authenticated
  using (public.is_teacher());

create policy "piket assignments: class reads"
  on public.piket_assignments for select to authenticated
  using (true);

create policy "piket assignments: teacher insert"
  on public.piket_assignments for insert to authenticated
  with check (public.is_teacher());

create policy "piket assignments: teacher update"
  on public.piket_assignments for update to authenticated
  using (public.is_teacher()) with check (public.is_teacher());

create policy "piket assignments: teacher delete"
  on public.piket_assignments for delete to authenticated
  using (public.is_teacher());

-- Exclusions berisi alasan (bisa sensitif) → teacher only.
create policy "piket exclusions: teacher only"
  on public.piket_exclusions for all to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

-- Refresh PostgREST schema cache.
notify pgrst, 'reload schema';
