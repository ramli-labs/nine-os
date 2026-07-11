-- ============================================================
-- NINE.OS — Migration 0005: perasaan "Lainnya" bisa diisi sendiri
-- weekly_pulses.feeling_detail menyimpan tulisan siswa ketika
-- memilih perasaan "lainnya". Dibaca siswa (miliknya) dan wali
-- kelas — mengikuti RLS weekly_pulses yang sudah ada.
-- ============================================================

alter table public.weekly_pulses
  add column feeling_detail text
  check (feeling_detail is null or char_length(feeling_detail) <= 100);

-- Refresh PostgREST's schema cache.
notify pgrst, 'reload schema';
