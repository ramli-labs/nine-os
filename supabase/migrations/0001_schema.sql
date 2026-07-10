-- ============================================================
-- NINE.OS — Migration 0001: schema
-- Tables, enums, constraints, indexes, triggers, role helper.
-- ============================================================

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────
create type public.user_role as enum ('student', 'teacher');

create type public.request_category as enum
  ('academic', 'friendship', 'personal', 'future', 'digital', 'other');

create type public.request_urgency as enum
  ('normal', 'this_week', 'soon');

create type public.request_status as enum
  ('submitted', 'seen', 'follow_up', 'closed');

create type public.resource_category as enum
  ('study', 'high_school', 'ai_integrity', 'digital_safety', 'wellbeing', 'other');

-- ── updated_at helper ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ─────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  nickname text not null default '',
  email text not null default '',
  role public.user_role not null default 'student',
  class_name text not null default '9B',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile whenever a new auth user signs up.
-- SECURITY DEFINER + fixed search_path: runs with owner rights,
-- role is ALWAYS 'student' — promotion to teacher happens only
-- via manual SQL by the project owner (see README_SETUP.md).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, nickname, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(
      new.raw_user_meta_data->>'nickname',
      initcap(split_part(coalesce(new.email, ''), '@', 1))
    ),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Role helper (avoids recursive RLS policies) ──────────────
-- SECURITY DEFINER so it can read profiles without triggering
-- the profiles RLS policies from inside another policy.
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- ── student_profiles (form "Kenali Saya") ────────────────────
create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  three_words text,
  strengths text,
  growth_area text,
  hope text,
  concern text,
  future_plan text,
  problem_response text,
  support_note text,
  private_note_to_teacher text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_student_profiles_updated_at
  before update on public.student_profiles
  for each row execute function public.set_updated_at();

-- ── weekly_pulses ────────────────────────────────────────────
create table public.weekly_pulses (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  energy_level integer not null check (energy_level between 1 and 5),
  pressure_level integer not null check (pressure_level between 1 and 5),
  feeling text not null check (feeling in
    ('baik', 'lelah', 'bingung', 'tertekan', 'termotivasi', 'campur_aduk', 'lainnya')),
  needs_help boolean not null default false,
  help_category text check (help_category is null or help_category in
    ('academic', 'friendship', 'personal', 'future', 'digital', 'other')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, week_start)
);

create index idx_weekly_pulses_week on public.weekly_pulses (week_start);
create index idx_weekly_pulses_student on public.weekly_pulses (student_id, week_start desc);

create trigger trg_weekly_pulses_updated_at
  before update on public.weekly_pulses
  for each row execute function public.set_updated_at();

-- ── wali_requests (Tanya Wali) ───────────────────────────────
create table public.wali_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  category public.request_category not null,
  message text not null check (char_length(message) between 1 and 4000),
  urgency public.request_urgency not null default 'normal',
  status public.request_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index idx_wali_requests_student on public.wali_requests (student_id, created_at desc);
create index idx_wali_requests_status on public.wali_requests (status, created_at desc);

create trigger trg_wali_requests_updated_at
  before update on public.wali_requests
  for each row execute function public.set_updated_at();

-- ── goals (My Journey — one active set per student) ──────────
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  academic_goal text,
  character_goal text,
  courage_goal text,
  period text default 'Kelas 9 — 2026/2027',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ── time_capsules (very private — see 0002 RLS notes) ────────
create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  current_feeling text,
  desired_change text,
  self_proof text,
  future_message text not null default '',
  unlock_date date not null default '2027-06-01',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_time_capsules_updated_at
  before update on public.time_capsules
  for each row execute function public.set_updated_at();

-- ── announcements ────────────────────────────────────────────
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  content text not null,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_announcements_published
  on public.announcements (is_published, published_at desc);

create trigger trg_announcements_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

-- ── events (agenda kelas) ────────────────────────────────────
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at is null or end_at >= start_at)
);

create index idx_events_start on public.events (start_at);

create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ── resources ────────────────────────────────────────────────
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  content text,
  url text,
  category public.resource_category not null default 'other',
  is_published boolean not null default false,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resources_pub_cat on public.resources (is_published, category);

create trigger trg_resources_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

-- ── class_charter_items ──────────────────────────────────────
create table public.class_charter_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_charter_order on public.class_charter_items (display_order);

create trigger trg_charter_updated_at
  before update on public.class_charter_items
  for each row execute function public.set_updated_at();
