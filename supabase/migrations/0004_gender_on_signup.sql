-- ============================================================
-- NINE.OS — Migration 0004: set gender atomically on signup
--
-- Fix: gender digunakan generator piket, sebelumnya disimpan lewat
-- UPDATE terpisah setelah akun dibuat — bisa gagal diam-diam (mis.
-- schema cache PostgREST belum kenal kolom baru). Sekarang trigger
-- pembuatan profil membaca gender langsung dari user_metadata, jadi
-- satu langkah atomik. Role tetap DIPAKSA 'student'.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, nickname, role, gender)
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
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Refresh PostgREST's schema cache (harmless if already fresh).
notify pgrst, 'reload schema';
