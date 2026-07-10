-- ============================================================
-- NINE.OS — RLS test suite (runs against local Postgres via
-- scripts/test-rls.sh, on top of auth_shim + migrations + seed).
--
-- Identities from seed.sql:
--   TEACHER   d0000000-0000-4000-8000-000000000001
--   STUDENT A d0000000-0000-4000-8000-000000000002 (Arka)
--   STUDENT B d0000000-0000-4000-8000-000000000003 (Bila)
-- Seed facts: A has 1 pulse, B has 2; A has 0 requests, B has 1;
-- total pulses 5, total requests 3, announcements 2 pub + 1 draft,
-- resources 3 pub + 1 draft, charter 4 active.
-- ============================================================

\set ON_ERROR_STOP on

-- ── Extra fixtures (as superuser, bypasses RLS) ───────────────
insert into public.time_capsules (student_id, current_feeling, future_message) values
  ('d0000000-0000-4000-8000-000000000002', 'deg-degan tapi siap', 'Halo Arka Juni 2027 — semoga kamu bangga.'),
  ('d0000000-0000-4000-8000-000000000003', 'capek tapi oke', 'Bila, kamu pasti sudah melewati ini.');

-- ════════════════════════════════════════════════════════════
-- AS STUDENT A
-- ════════════════════════════════════════════════════════════
set role authenticated;
set request.jwt.claims to '{"sub":"d0000000-0000-4000-8000-000000000002","role":"authenticated"}';

do $$
declare n int;
begin
  -- 1. profiles: sees ONLY own row
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FAIL 1: student A sees % profiles (expected 1)', n; end if;
  raise notice 'PASS 1: student sees only own profile';

  -- 2. pulses: only own (A has exactly 1; B has 2 hidden)
  select count(*) into n from public.weekly_pulses;
  if n <> 1 then raise exception 'FAIL 2: student A sees % pulses (expected 1)', n; end if;
  select count(*) into n from public.weekly_pulses where student_id = 'd0000000-0000-4000-8000-000000000003';
  if n <> 0 then raise exception 'FAIL 2b: student A can read student B pulses'; end if;
  raise notice 'PASS 2: pulse isolation';

  -- 3. wali_requests: A has none, must see zero (B''s request hidden)
  select count(*) into n from public.wali_requests;
  if n <> 0 then raise exception 'FAIL 3: student A sees % requests (expected 0)', n; end if;
  raise notice 'PASS 3: request isolation';

  -- 4. goals: only own
  select count(*) into n from public.goals;
  if n <> 1 then raise exception 'FAIL 4: student A sees % goals (expected 1)', n; end if;
  raise notice 'PASS 4: goals isolation';

  -- 5. time capsules: only own (B''s exists but hidden)
  select count(*) into n from public.time_capsules;
  if n <> 1 then raise exception 'FAIL 5: student A sees % capsules (expected 1)', n; end if;
  raise notice 'PASS 5: time capsule isolation';

  -- 6. student_profiles: only own
  select count(*) into n from public.student_profiles;
  if n <> 1 then raise exception 'FAIL 6: student A sees % student_profiles (expected 1)', n; end if;
  raise notice 'PASS 6: student_profiles isolation';

  -- 7. cannot update another student''s pulse (0 rows affected)
  update public.weekly_pulses set note = 'hacked'
    where student_id = 'd0000000-0000-4000-8000-000000000003';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 7: student A updated B''s pulse'; end if;
  raise notice 'PASS 7: cannot modify other student data';

  -- 8. cannot move wali request workflow (teacher-only policy → 0 rows)
  update public.wali_requests set status = 'closed';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL 8: student changed request status'; end if;
  raise notice 'PASS 8: student cannot drive request workflow';

  -- 9. role escalation blocked by column-level privileges
  begin
    update public.profiles set role = 'teacher' where id = auth.uid();
    raise exception 'FAIL 9: student escalated own role to teacher';
  exception when insufficient_privilege then
    raise notice 'PASS 9: role escalation blocked (permission denied)';
  end;

  -- 10. cannot insert a pulse for someone else
  begin
    insert into public.weekly_pulses (student_id, week_start, energy_level, pressure_level, feeling)
    values ('d0000000-0000-4000-8000-000000000003', current_date, 3, 3, 'baik');
    raise exception 'FAIL 10: student inserted pulse for another student';
  exception when insufficient_privilege then
    raise notice 'PASS 10: cannot insert data as another student';
  end;

  -- 11. cannot submit a request with a pre-set workflow status
  begin
    insert into public.wali_requests (student_id, category, message, urgency, status)
    values (auth.uid(), 'other', 'test', 'normal', 'closed');
    raise exception 'FAIL 11: student inserted request with status=closed';
  exception when insufficient_privilege then
    raise notice 'PASS 11: new requests are forced to status=submitted';
  end;

  -- 12. CAN submit a legitimate request
  insert into public.wali_requests (student_id, category, message, urgency)
  values (auth.uid(), 'academic', 'Uji coba pertanyaan dari test suite.', 'normal');
  raise notice 'PASS 12: student can submit own request';

  -- 13. cannot create announcements
  begin
    insert into public.announcements (title, content, is_published, created_by)
    values ('spam', 'spam', true, auth.uid());
    raise exception 'FAIL 13: student created an announcement';
  exception when insufficient_privilege then
    raise notice 'PASS 13: students cannot create announcements';
  end;

  -- 14. sees only PUBLISHED announcements (2 of 3)
  select count(*) into n from public.announcements;
  if n <> 2 then raise exception 'FAIL 14: student sees % announcements (expected 2 published)', n; end if;
  raise notice 'PASS 14: drafts hidden from students';
end $$;

reset role;
reset request.jwt.claims;

-- ════════════════════════════════════════════════════════════
-- AS TEACHER
-- ════════════════════════════════════════════════════════════
set role authenticated;
set request.jwt.claims to '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';

do $$
declare n int;
begin
  -- 15. teacher sees all profiles (6 seeded)
  select count(*) into n from public.profiles;
  if n < 6 then raise exception 'FAIL 15: teacher sees % profiles (expected >= 6)', n; end if;
  raise notice 'PASS 15: teacher reads all profiles';

  -- 16. teacher sees all pulses (5 seeded)
  select count(*) into n from public.weekly_pulses;
  if n < 5 then raise exception 'FAIL 16: teacher sees % pulses', n; end if;
  raise notice 'PASS 16: teacher reads all pulses';

  -- 17. teacher sees all requests (3 seed + 1 from test 12)
  select count(*) into n from public.wali_requests;
  if n < 4 then raise exception 'FAIL 17: teacher sees % requests', n; end if;
  raise notice 'PASS 17: teacher reads all requests';

  -- 18. teacher can move workflow status
  update public.wali_requests set status = 'seen'
    where status = 'submitted';
  get diagnostics n = row_count;
  if n < 1 then raise exception 'FAIL 18: teacher could not update request status'; end if;
  raise notice 'PASS 18: teacher drives request workflow';

  -- 19. teacher CANNOT read time capsules (no policy — by design)
  select count(*) into n from public.time_capsules;
  if n <> 0 then raise exception 'FAIL 19: teacher can read % time capsules (expected 0)', n; end if;
  raise notice 'PASS 19: time capsules hidden even from teacher';

  -- 20. teacher can create announcements
  insert into public.announcements (title, content, is_published, published_at, created_by)
  values ('Tes pengumuman', 'Dibuat oleh test suite.', true, now(), auth.uid());
  raise notice 'PASS 20: teacher creates announcements';

  -- 21. teacher sees drafts too (2 published + 1 draft + 1 new = 4)
  select count(*) into n from public.announcements;
  if n < 4 then raise exception 'FAIL 21: teacher sees % announcements', n; end if;
  raise notice 'PASS 21: teacher sees drafts';
end $$;

reset role;
reset request.jwt.claims;

-- ════════════════════════════════════════════════════════════
-- AS ANON (not logged in)
-- ════════════════════════════════════════════════════════════
set role anon;

do $$
declare n int;
begin
  -- 22. anon reads only published resources (3 of 4)
  select count(*) into n from public.resources;
  if n <> 3 then raise exception 'FAIL 22: anon sees % resources (expected 3 published)', n; end if;
  raise notice 'PASS 22: anon sees only published resources';

  -- 23. anon reads active charter items
  select count(*) into n from public.class_charter_items;
  if n <> 4 then raise exception 'FAIL 23: anon sees % charter items (expected 4)', n; end if;
  raise notice 'PASS 23: anon sees active charter';

  -- 24. anon cannot read profiles / pulses / requests / capsules
  begin
    perform count(*) from public.profiles;
    raise exception 'FAIL 24: anon can query profiles';
  exception when insufficient_privilege then
    raise notice 'PASS 24a: anon blocked from profiles';
  end;
  begin
    perform count(*) from public.weekly_pulses;
    raise exception 'FAIL 24b: anon can query pulses';
  exception when insufficient_privilege then
    raise notice 'PASS 24b: anon blocked from pulses';
  end;
  begin
    perform count(*) from public.time_capsules;
    raise exception 'FAIL 24c: anon can query capsules';
  exception when insufficient_privilege then
    raise notice 'PASS 24c: anon blocked from capsules';
  end;
  begin
    perform count(*) from public.announcements;
    raise exception 'FAIL 24d: anon can query announcements';
  exception when insufficient_privilege then
    raise notice 'PASS 24d: anon blocked from announcements';
  end;
end $$;

reset role;

-- ════════════════════════════════════════════════════════════
-- PIKET (migration 0003)
-- ════════════════════════════════════════════════════════════
set role authenticated;
set request.jwt.claims to '{"sub":"d0000000-0000-4000-8000-000000000001","role":"authenticated"}';

do $$
declare n int;
begin
  -- 25. teacher creates piket assignments
  insert into public.piket_assignments (student_id, weekday, display_order) values
    ('d0000000-0000-4000-8000-000000000002', 1, 0),
    ('d0000000-0000-4000-8000-000000000003', 2, 0);
  raise notice 'PASS 25: teacher creates piket schedule';

  -- 26. teacher can update student gender (but not role — checked in test 9)
  update public.profiles set gender = 'L'
    where id = 'd0000000-0000-4000-8000-000000000002';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL 26: teacher could not set student gender'; end if;
  raise notice 'PASS 26: teacher sets student gender';
end $$;

reset role;
reset request.jwt.claims;

set role authenticated;
set request.jwt.claims to '{"sub":"d0000000-0000-4000-8000-000000000002","role":"authenticated"}';

do $$
declare n int;
begin
  -- 27. students read the whole schedule (class-visible)
  select count(*) into n from public.piket_assignments;
  if n < 2 then raise exception 'FAIL 27: student sees % piket rows (expected 2)', n; end if;
  raise notice 'PASS 27: students can read the schedule';

  -- 28. students cannot write the schedule
  begin
    insert into public.piket_assignments (student_id, weekday) values (auth.uid(), 5);
    raise exception 'FAIL 28: student inserted a piket assignment';
  exception when insufficient_privilege or unique_violation then
    raise notice 'PASS 28: students cannot modify the schedule';
  end;
end $$;

reset role;
reset request.jwt.claims;

set role anon;

do $$
begin
  -- 29. schedule (student names!) is NOT public
  begin
    perform count(*) from public.piket_assignments;
    raise exception 'FAIL 29: anon can read piket schedule';
  exception when insufficient_privilege then
    raise notice 'PASS 29: piket schedule hidden from public';
  end;
end $$;

reset role;

-- ════════════════════════════════════════════════════════════
-- SIGNUP TRIGGER (migration 0004) — as superuser
-- ════════════════════════════════════════════════════════════
do $$
declare g text; r text;
begin
  -- 30. gender from user_metadata lands on the profile atomically,
  --     and role is still forced to 'student' regardless of metadata.
  insert into auth.users (id, email, raw_user_meta_data) values
    ('d0000000-0000-4000-8000-000000000099',
     'trigger.test@siswa.nineos.id',
     '{"full_name":"Trigger Test","nickname":"Trig","gender":"P","role":"teacher"}');

  select gender, role::text into g, r from public.profiles
    where id = 'd0000000-0000-4000-8000-000000000099';
  if g is distinct from 'P' then
    raise exception 'FAIL 30: gender from metadata not applied (got %)', g;
  end if;
  if r <> 'student' then
    raise exception 'FAIL 30b: signup trigger produced role % (expected student)', r;
  end if;
  raise notice 'PASS 30: signup trigger sets gender, forces student role';
end $$;

select 'ALL RLS TESTS PASSED' as result;
