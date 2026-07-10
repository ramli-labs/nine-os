-- ============================================================
-- NINE.OS — Migration 0003: jadwal piket
--   * profiles.gender (L/P) — needed to balance duty groups;
--     set by the teacher, minimal single-letter value.
--   * piket_assignments — one weekday (Mon–Fri) per student.
--   * Teacher may update students' safe profile fields
--     (name/nickname/avatar/gender) — role & email stay locked
--     by column-level grants.
-- ============================================================

-- ── gender on profiles ───────────────────────────────────────
alter table public.profiles
  add column gender text check (gender in ('L', 'P'));

grant update (gender) on public.profiles to authenticated;

create policy "profiles: teacher updates safe fields"
  on public.profiles for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

-- ── piket_assignments ────────────────────────────────────────
create table public.piket_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  weekday integer not null check (weekday between 1 and 5), -- 1=Senin … 5=Jumat
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_piket_weekday on public.piket_assignments (weekday, display_order);

alter table public.piket_assignments enable row level security;

-- The schedule is class-visible (names only) — but never public.
grant select, insert, delete on public.piket_assignments to authenticated;

create policy "piket: logged-in read"
  on public.piket_assignments for select to authenticated
  using (true);

create policy "piket: teacher insert"
  on public.piket_assignments for insert to authenticated
  with check (public.is_teacher());

create policy "piket: teacher delete"
  on public.piket_assignments for delete to authenticated
  using (public.is_teacher());
