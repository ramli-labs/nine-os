-- ============================================================
-- NINE.OS — Migration 0002: Row Level Security + privileges
--
-- Security model:
--   * RLS enabled on EVERY table holding user data. Default deny.
--   * public.is_teacher() is SECURITY DEFINER → no recursive RLS.
--   * Role escalation is blocked twice:
--       1. column-level privileges: authenticated may only UPDATE
--          (full_name, nickname, avatar_url) on profiles;
--       2. profiles INSERT/DELETE have no client policies at all —
--          rows exist only via the auth trigger (always 'student').
--   * time_capsules: NO teacher policy. Capsules are readable only
--     by their owner. If a safeguarding situation ever requires
--     access, the project owner uses the service role in the
--     Supabase dashboard — deliberately NOT a feature of the app.
--   * The app never uses the service role key.
-- ============================================================

-- ── Reset default table privileges for client roles ──────────
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant execute on function public.is_teacher() to anon, authenticated;

-- ── Minimal grants (RLS still applies on top of these) ────────
grant select on public.profiles to authenticated;
grant update (full_name, nickname, avatar_url) on public.profiles to authenticated;

grant select, insert, update on public.student_profiles to authenticated;
grant select, insert, update on public.weekly_pulses to authenticated;

grant select, insert on public.wali_requests to authenticated;
grant update (status, closed_at) on public.wali_requests to authenticated;

grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.time_capsules to authenticated;

grant select, insert, update, delete on public.announcements to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.class_charter_items to authenticated;

-- Public (not logged in) may only read published resources & charter.
grant select on public.resources to anon;
grant select on public.class_charter_items to anon;

-- ── Enable RLS everywhere ─────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.student_profiles    enable row level security;
alter table public.weekly_pulses       enable row level security;
alter table public.wali_requests       enable row level security;
alter table public.goals               enable row level security;
alter table public.time_capsules       enable row level security;
alter table public.announcements       enable row level security;
alter table public.events              enable row level security;
alter table public.resources           enable row level security;
alter table public.class_charter_items enable row level security;

-- ── profiles ─────────────────────────────────────────────────
create policy "profiles: read own or teacher reads all"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_teacher());

create policy "profiles: update own safe fields"
  on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- (role/email/class_name are additionally protected by column grants)

-- ── student_profiles ─────────────────────────────────────────
create policy "student_profiles: read own or teacher"
  on public.student_profiles for select to authenticated
  using (user_id = auth.uid() or public.is_teacher());

create policy "student_profiles: insert own"
  on public.student_profiles for insert to authenticated
  with check (user_id = auth.uid());

create policy "student_profiles: update own"
  on public.student_profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── weekly_pulses ────────────────────────────────────────────
create policy "pulses: read own or teacher"
  on public.weekly_pulses for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());

create policy "pulses: insert own"
  on public.weekly_pulses for insert to authenticated
  with check (student_id = auth.uid());

create policy "pulses: update own"
  on public.weekly_pulses for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ── wali_requests ────────────────────────────────────────────
create policy "requests: read own or teacher"
  on public.wali_requests for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());

create policy "requests: student submits own (always 'submitted')"
  on public.wali_requests for insert to authenticated
  with check (student_id = auth.uid() and status = 'submitted');

-- Only the teacher moves the workflow. Column grants restrict the
-- teacher to (status, closed_at) — message content is immutable.
create policy "requests: teacher updates workflow"
  on public.wali_requests for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

-- ── goals ────────────────────────────────────────────────────
create policy "goals: read own or teacher"
  on public.goals for select to authenticated
  using (student_id = auth.uid() or public.is_teacher());

create policy "goals: insert own"
  on public.goals for insert to authenticated
  with check (student_id = auth.uid());

create policy "goals: update own"
  on public.goals for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "goals: delete own"
  on public.goals for delete to authenticated
  using (student_id = auth.uid());

-- ── time_capsules — owner ONLY, no teacher access ─────────────
create policy "capsules: owner full access"
  on public.time_capsules for all to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ── announcements ────────────────────────────────────────────
create policy "announcements: logged-in read published, teacher all"
  on public.announcements for select to authenticated
  using (is_published or public.is_teacher());

create policy "announcements: teacher insert"
  on public.announcements for insert to authenticated
  with check (public.is_teacher() and created_by = auth.uid());

create policy "announcements: teacher update"
  on public.announcements for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "announcements: teacher delete"
  on public.announcements for delete to authenticated
  using (public.is_teacher());

-- ── events ───────────────────────────────────────────────────
create policy "events: logged-in read"
  on public.events for select to authenticated
  using (true);

create policy "events: teacher insert"
  on public.events for insert to authenticated
  with check (public.is_teacher() and created_by = auth.uid());

create policy "events: teacher update"
  on public.events for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "events: teacher delete"
  on public.events for delete to authenticated
  using (public.is_teacher());

-- ── resources (published items are public) ───────────────────
create policy "resources: anyone reads published"
  on public.resources for select to anon
  using (is_published);

create policy "resources: logged-in read published, teacher all"
  on public.resources for select to authenticated
  using (is_published or public.is_teacher());

create policy "resources: teacher insert"
  on public.resources for insert to authenticated
  with check (public.is_teacher() and created_by = auth.uid());

create policy "resources: teacher update"
  on public.resources for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "resources: teacher delete"
  on public.resources for delete to authenticated
  using (public.is_teacher());

-- ── class_charter_items (active items are public) ────────────
create policy "charter: anyone reads active"
  on public.class_charter_items for select to anon
  using (is_active);

create policy "charter: logged-in read active, teacher all"
  on public.class_charter_items for select to authenticated
  using (is_active or public.is_teacher());

create policy "charter: teacher insert"
  on public.class_charter_items for insert to authenticated
  with check (public.is_teacher() and created_by = auth.uid());

create policy "charter: teacher update"
  on public.class_charter_items for update to authenticated
  using (public.is_teacher())
  with check (public.is_teacher());

create policy "charter: teacher delete"
  on public.class_charter_items for delete to authenticated
  using (public.is_teacher());
