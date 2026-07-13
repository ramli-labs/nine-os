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

// ── Pembagian mingguan — seluruh kelas dibagi ke Senin–Jumat ───
// Setiap siswa mendapat TEPAT satu hari. Jumlah per hari dibuat
// serata mungkin, dan L/P disebar merata antar hari (round-robin
// per gender, kursor berlanjut agar total per hari tetap seimbang).

export interface WeekStudent {
  id: string;
  gender: "L" | "P" | null;
}

function shuffleIds(ids: string[], rng: () => number): string[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Bagi seluruh siswa ke `days` hari (default 5, Senin–Jumat).
 * Mengembalikan array sepanjang `days`; indeks 0 = Senin … 4 = Jumat,
 * masing-masing berisi daftar student id.
 *
 * Sifat yang dijamin:
 *   - tiap siswa muncul tepat sekali,
 *   - selisih jumlah petugas antar hari ≤ 1,
 *   - jumlah L antar hari selisihnya ≤ 1 (idem untuk P).
 */
export function distributeAcrossWeek(
  students: WeekStudent[],
  rng: () => number = Math.random,
  days = 5
): string[][] {
  const L = shuffleIds(
    students.filter((s) => s.gender === "L").map((s) => s.id),
    rng
  );
  const P = shuffleIds(
    students.filter((s) => s.gender === "P").map((s) => s.id),
    rng
  );
  const U = shuffleIds(
    students.filter((s) => s.gender !== "L" && s.gender !== "P").map((s) => s.id),
    rng
  );

  const result: string[][] = Array.from({ length: days }, () => []);
  let cursor = 0;
  for (const group of [L, P, U]) {
    for (const id of group) {
      result[cursor % days].push(id);
      cursor++;
    }
  }
  return result;
}

export interface WeekPlanRow {
  studentId: string;
  day: number; // 0=Senin … 4=Jumat
  coordinator: boolean;
}

/**
 * Susun jadwal seminggu DENGAN koordinator.
 *   - Tiap koordinator ditempatkan di satu hari BERBEDA (diacak),
 *     maksimal satu koordinator per hari.
 *   - Siswa lain dibagi rata seperti biasa (ukuran & L/P seimbang).
 * Koordinator tetap dihitung sebagai petugas hari itu (menandai
 * coordinator=true), jadi ia memimpin sekaligus ikut piket.
 */
export function distributeWeekWithCoordinators(
  coordinatorIds: string[],
  others: WeekStudent[],
  rng: () => number = Math.random,
  days = 5
): WeekPlanRow[] {
  const coords = shuffleIds(coordinatorIds, rng).slice(0, days);
  const rows: WeekPlanRow[] = [];
  coords.forEach((id, day) => {
    rows.push({ studentId: id, day, coordinator: true });
  });

  const rest = distributeAcrossWeek(others, rng, days);
  rest.forEach((group, day) => {
    for (const id of group) rows.push({ studentId: id, day, coordinator: false });
  });

  return rows;
}
