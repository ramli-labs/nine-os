// ── Piket (class duty) schedule generator ─────────────────────
// Distributes students across Mon–Fri so that day sizes differ by
// at most 1 and each day's gender mix is as balanced as possible.

export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
};

export const GENDER_LABELS: Record<"L" | "P", string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export interface PiketStudent {
  id: string;
  gender: "L" | "P" | null;
}

export interface PiketSlot {
  student_id: string;
  weekday: number; // 1..5
  display_order: number;
}

function shuffle<T>(input: T[], rng: () => number): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fair random distribution:
 * 1. shuffle each gender group,
 * 2. interleave them (L,P,L,P,…) into one deck,
 * 3. deal the deck round-robin over a shuffled day order.
 *
 * Dealing an alternating deck with step 5 keeps each day's gender
 * difference ≤ 1 when group sizes allow, and day sizes automatically
 * come out ⌈n/5⌉ / ⌊n/5⌋ (32 students → 7,7,6,6,6).
 */
export function generatePiket(
  students: PiketStudent[],
  rng: () => number = Math.random
): PiketSlot[] {
  const male = shuffle(students.filter((s) => s.gender === "L"), rng);
  const female = shuffle(students.filter((s) => s.gender === "P"), rng);
  const unknown = shuffle(students.filter((s) => !s.gender), rng);

  const [longer, shorter] =
    male.length >= female.length ? [male, female] : [female, male];

  const deck: PiketStudent[] = [];
  for (let i = 0; i < longer.length; i++) {
    deck.push(longer[i]);
    if (shorter[i]) deck.push(shorter[i]);
  }
  deck.push(...unknown);

  const dayOrder = shuffle([1, 2, 3, 4, 5], rng);

  return deck.map((student, i) => ({
    student_id: student.id,
    weekday: dayOrder[i % 5],
    display_order: Math.floor(i / 5),
  }));
}
