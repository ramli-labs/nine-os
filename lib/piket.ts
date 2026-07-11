// ── Piket harian — pemilihan petugas yang adil ────────────────
// Bukan sekadar shuffle: kandidat diurutkan berdasarkan beban piket
// historis (paling sedikit didahulukan), menghindari petugas kemarin
// bila jumlah siswa memungkinkan, menyeimbangkan L/P, dan random
// HANYA di antara kandidat dengan beban setara.

export const GENDER_LABELS: Record<"L" | "P", string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export interface DutyCandidate {
  id: string;
  gender: "L" | "P" | null;
  /** berapa kali pernah piket (riwayat piket_assignments) */
  historyCount: number;
  /** bertugas pada jadwal hari sebelumnya */
  servedYesterday: boolean;
}

/**
 * Memilih `size` petugas dari kandidat (siswa aktif yang tidak
 * di-exclude pada tanggal tsb — penyaringan itu tugas pemanggil).
 *
 * Urutan prioritas per slot:
 *   1. beban historis terendah,
 *   2. bukan petugas kemarin (bila kandidat lain masih cukup),
 *   3. gender yang menyeimbangkan tim,
 *   4. acak di antara yang setara.
 */
export function pickDutyTeam(
  candidates: DutyCandidate[],
  size: number,
  rng: () => number = Math.random
): string[] {
  const teamIds: string[] = [];
  let teamL = 0;
  let teamP = 0;

  // Hindari petugas kemarin bila sisanya masih mencukupi.
  let pool = [...candidates];
  const fresh = pool.filter((c) => !c.servedYesterday);
  if (fresh.length >= Math.min(size, pool.length)) {
    pool = fresh;
  }

  while (teamIds.length < size && pool.length > 0) {
    const minCount = Math.min(...pool.map((c) => c.historyCount));
    let tier = pool.filter((c) => c.historyCount === minCount);

    // Seimbangkan gender: pilih dari gender yang sedang tertinggal.
    const preferred: "L" | "P" | null =
      teamL < teamP ? "L" : teamP < teamL ? "P" : null;
    if (preferred) {
      const balanced = tier.filter((c) => c.gender === preferred);
      if (balanced.length > 0) tier = balanced;
    }

    const chosen = tier[Math.floor(rng() * tier.length)];
    teamIds.push(chosen.id);
    if (chosen.gender === "L") teamL++;
    if (chosen.gender === "P") teamP++;
    pool = pool.filter((c) => c.id !== chosen.id);
  }

  return teamIds;
}

/** Ukuran tim default: kelas dibagi 5 hari sekolah, dibulatkan ke atas. */
export function defaultTeamSize(activeStudents: number): number {
  if (activeStudents <= 0) return 0;
  return Math.max(1, Math.ceil(activeStudents / 5));
}
