import { describe, expect, it } from "vitest";
import { generatePiket, type PiketStudent } from "@/lib/piket";

function makeClass(male: number, female: number, unknown = 0): PiketStudent[] {
  const students: PiketStudent[] = [];
  for (let i = 0; i < male; i++) students.push({ id: `L${i}`, gender: "L" });
  for (let i = 0; i < female; i++) students.push({ id: `P${i}`, gender: "P" });
  for (let i = 0; i < unknown; i++) students.push({ id: `U${i}`, gender: null });
  return students;
}

function tally(slots: ReturnType<typeof generatePiket>, students: PiketStudent[]) {
  const genderOf = new Map(students.map((s) => [s.id, s.gender]));
  const days = new Map<number, { total: number; L: number; P: number }>();
  for (let d = 1; d <= 5; d++) days.set(d, { total: 0, L: 0, P: 0 });
  for (const slot of slots) {
    const day = days.get(slot.weekday)!;
    day.total++;
    const g = genderOf.get(slot.student_id);
    if (g === "L") day.L++;
    if (g === "P") day.P++;
  }
  return [...days.values()];
}

describe("generatePiket", () => {
  it("assigns every student exactly once (32 students)", () => {
    const students = makeClass(16, 16);
    const slots = generatePiket(students);
    expect(slots).toHaveLength(32);
    expect(new Set(slots.map((s) => s.student_id)).size).toBe(32);
    for (const s of slots) {
      expect(s.weekday).toBeGreaterThanOrEqual(1);
      expect(s.weekday).toBeLessThanOrEqual(5);
    }
  });

  it("32 students → day sizes 7,7,6,6,6 (max diff 1)", () => {
    const days = tally(generatePiket(makeClass(16, 16)), makeClass(16, 16));
    const sizes = days.map((d) => d.total).sort();
    expect(sizes).toEqual([6, 6, 6, 7, 7]);
  });

  it("balances gender per day (16L/16P → diff ≤ 1 each day)", () => {
    for (let run = 0; run < 20; run++) {
      const students = makeClass(16, 16);
      const days = tally(generatePiket(students), students);
      for (const d of days) {
        expect(Math.abs(d.L - d.P)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps gender reasonably balanced with uneven groups (18L/14P)", () => {
    for (let run = 0; run < 20; run++) {
      const students = makeClass(18, 14);
      const days = tally(generatePiket(students), students);
      for (const d of days) {
        expect(Math.abs(d.L - d.P)).toBeLessThanOrEqual(2);
        expect([6, 7]).toContain(d.total);
      }
    }
  });

  it("handles students without gender and odd totals", () => {
    const students = makeClass(10, 9, 4); // 23 students
    const slots = generatePiket(students);
    expect(slots).toHaveLength(23);
    const sizes = tally(slots, students)
      .map((d) => d.total)
      .sort();
    expect(sizes).toEqual([4, 4, 5, 5, 5]);
  });

  it("produces different schedules on different runs (randomness)", () => {
    const students = makeClass(16, 16);
    const a = JSON.stringify(generatePiket(students));
    const b = JSON.stringify(generatePiket(students));
    const c = JSON.stringify(generatePiket(students));
    expect(a === b && b === c).toBe(false);
  });

  it("is deterministic with a seeded rng", () => {
    let seed = 42;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    let seed2 = 42;
    const rng2 = () => {
      seed2 = (seed2 * 1103515245 + 12345) % 2147483648;
      return seed2 / 2147483648;
    };
    const students = makeClass(16, 16);
    expect(generatePiket(students, rng)).toEqual(generatePiket(students, rng2));
  });
});
