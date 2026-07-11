import { describe, expect, it } from "vitest";
import {
  pickDutyTeam,
  defaultTeamSize,
  type DutyCandidate,
} from "@/lib/piket";

function candidate(
  id: string,
  historyCount: number,
  opts: Partial<DutyCandidate> = {}
): DutyCandidate {
  return {
    id,
    gender: opts.gender ?? (Number(id.slice(1)) % 2 === 0 ? "L" : "P"),
    historyCount,
    servedYesterday: opts.servedYesterday ?? false,
  };
}

describe("pickDutyTeam (fairness)", () => {
  it("selects exactly `size` unique students", () => {
    const cands = Array.from({ length: 36 }, (_, i) => candidate(`s${i}`, 0));
    const team = pickDutyTeam(cands, 7);
    expect(team).toHaveLength(7);
    expect(new Set(team).size).toBe(7);
  });

  it("prioritises students with the lowest historical count", () => {
    // 5 siswa belum pernah piket, sisanya sudah 3×
    const fresh = ["a", "b", "c", "d", "e"];
    const cands = [
      ...fresh.map((id) => candidate(id, 0)),
      ...Array.from({ length: 20 }, (_, i) => candidate(`x${i}`, 3)),
    ];
    for (let run = 0; run < 10; run++) {
      const team = pickDutyTeam(cands, 5);
      expect([...team].sort()).toEqual([...fresh].sort());
    }
  });

  it("fills remaining slots from the next-lowest tier", () => {
    const cands = [
      candidate("zero1", 0),
      candidate("zero2", 0),
      ...Array.from({ length: 10 }, (_, i) => candidate(`one${i}`, 1)),
      ...Array.from({ length: 10 }, (_, i) => candidate(`five${i}`, 5)),
    ];
    for (let run = 0; run < 10; run++) {
      const team = pickDutyTeam(cands, 6);
      expect(team).toContain("zero1");
      expect(team).toContain("zero2");
      // sisanya harus dari tier count=1, bukan count=5
      for (const id of team) {
        expect(id.startsWith("five")).toBe(false);
      }
    }
  });

  it("avoids yesterday's crew when enough others exist", () => {
    const yesterday = ["y1", "y2", "y3"];
    const cands = [
      ...yesterday.map((id) => candidate(id, 0, { servedYesterday: true })),
      ...Array.from({ length: 20 }, (_, i) => candidate(`f${i}`, 0)),
    ];
    for (let run = 0; run < 10; run++) {
      const team = pickDutyTeam(cands, 7);
      for (const id of yesterday) expect(team).not.toContain(id);
    }
  });

  it("falls back to yesterday's crew when the class is small", () => {
    const cands = [
      candidate("y1", 0, { servedYesterday: true }),
      candidate("y2", 0, { servedYesterday: true }),
      candidate("f1", 0),
      candidate("f2", 0),
    ];
    const team = pickDutyTeam(cands, 4);
    expect(team).toHaveLength(4);
  });

  it("balances gender within equal-load tiers", () => {
    const cands = [
      ...Array.from({ length: 18 }, (_, i) =>
        candidate(`l${i}`, 0, { gender: "L" })
      ),
      ...Array.from({ length: 18 }, (_, i) =>
        candidate(`p${i}`, 0, { gender: "P" })
      ),
    ];
    for (let run = 0; run < 10; run++) {
      const team = pickDutyTeam(cands, 7);
      const l = team.filter((id) => id.startsWith("l")).length;
      const p = team.filter((id) => id.startsWith("p")).length;
      expect(Math.abs(l - p)).toBeLessThanOrEqual(1);
    }
  });

  it("caps at the number of available candidates", () => {
    const cands = [candidate("a", 0), candidate("b", 2)];
    expect(pickDutyTeam(cands, 7)).toHaveLength(2);
  });

  it("is deterministic with a seeded rng", () => {
    const makeRng = () => {
      let seed = 42;
      return () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
    };
    const cands = Array.from({ length: 30 }, (_, i) => candidate(`s${i}`, i % 3));
    expect(pickDutyTeam(cands, 7, makeRng())).toEqual(
      pickDutyTeam(cands, 7, makeRng())
    );
  });
});

describe("defaultTeamSize", () => {
  it("splits the class across 5 school days", () => {
    expect(defaultTeamSize(32)).toBe(7);
    expect(defaultTeamSize(34)).toBe(7);
    expect(defaultTeamSize(36)).toBe(8);
    expect(defaultTeamSize(3)).toBe(1);
    expect(defaultTeamSize(0)).toBe(0);
  });
});
