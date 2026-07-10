import { describe, expect, it } from "vitest";
import {
  currentWeekStart,
  fromJakartaInputValue,
  greetingID,
  jakartaDateString,
  toJakartaInputValue,
} from "@/lib/date";

describe("currentWeekStart (Asia/Jakarta)", () => {
  it("returns the same Monday for any day inside one week", () => {
    // Monday 2026-07-06 00:00 WIB == 2026-07-05T17:00Z
    const monday = new Date("2026-07-05T17:00:00Z");
    // Sunday 2026-07-12 23:59 WIB == 2026-07-12T16:59Z
    const sunday = new Date("2026-07-12T16:59:00Z");
    expect(currentWeekStart(monday)).toBe("2026-07-06");
    expect(currentWeekStart(sunday)).toBe("2026-07-06");
  });

  it("rolls to the next Monday when the Jakarta week changes", () => {
    // Sunday 2026-07-12 17:01Z == Monday 2026-07-13 00:01 WIB
    const nextMonday = new Date("2026-07-12T17:01:00Z");
    expect(currentWeekStart(nextMonday)).toBe("2026-07-13");
  });

  it("handles UTC/Jakarta date boundary (evening UTC = next day WIB)", () => {
    // 2026-07-10 20:00Z == 2026-07-11 03:00 WIB (Saturday)
    const d = new Date("2026-07-10T20:00:00Z");
    expect(jakartaDateString(d)).toBe("2026-07-11");
    expect(currentWeekStart(d)).toBe("2026-07-06");
  });
});

describe("Jakarta datetime-local round trip", () => {
  it("converts input value to correct UTC instant", () => {
    // 07:00 WIB == 00:00 UTC
    expect(fromJakartaInputValue("2026-07-13T07:00")).toBe(
      "2026-07-13T00:00:00.000Z"
    );
  });

  it("round-trips ISO → input → ISO", () => {
    const iso = "2026-09-01T02:30:00.000Z"; // 09:30 WIB
    const input = toJakartaInputValue(iso);
    expect(input).toBe("2026-09-01T09:30");
    expect(fromJakartaInputValue(input)).toBe(iso);
  });
});

describe("greetingID", () => {
  it("greets by Jakarta wall clock, not server clock", () => {
    // 23:00Z == 06:00 WIB → pagi
    expect(greetingID(new Date("2026-07-09T23:00:00Z"))).toBe("Selamat pagi");
    // 06:00Z == 13:00 WIB → siang
    expect(greetingID(new Date("2026-07-10T06:00:00Z"))).toBe("Selamat siang");
    // 09:00Z == 16:00 WIB → sore
    expect(greetingID(new Date("2026-07-10T09:00:00Z"))).toBe("Selamat sore");
    // 13:00Z == 20:00 WIB → malam
    expect(greetingID(new Date("2026-07-10T13:00:00Z"))).toBe("Selamat malam");
  });
});
