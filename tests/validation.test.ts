import { describe, expect, it } from "vitest";
import {
  pulseSchema,
  waliRequestSchema,
  profileUpdateSchema,
  timeCapsuleSchema,
  requestStatusUpdateSchema,
  announcementSchema,
  eventSchema,
  createStudentSchema,
  loginSchema,
} from "@/lib/validation";
import { identifierToEmail, displayUsername } from "@/lib/constants";

describe("account provisioning (username + password)", () => {
  const base = {
    full_name: "Arka Contoh",
    nickname: "Arka",
    username: "arka.pratama",
    password: "rahasia-kuat-9",
  };

  it("accepts a valid student account", () => {
    expect(createStudentSchema.safeParse(base).success).toBe(true);
  });

  it("rejects bad usernames", () => {
    for (const username of ["ab", "arka pratama", "@arka", "-arka", "arka!"]) {
      expect(
        createStudentSchema.safeParse({ ...base, username }).success
      ).toBe(false);
    }
  });

  it("normalizes uppercase usernames instead of rejecting them", () => {
    const r = createStudentSchema.safeParse({ ...base, username: "Arka" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.username).toBe("arka");
  });

  it("normalizes username case", () => {
    const r = loginSchema.safeParse({ identifier: "ARKA", password: "x1234567" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.identifier).toBe("arka");
  });

  it("rejects short passwords", () => {
    expect(
      createStudentSchema.safeParse({ ...base, password: "1234567" }).success
    ).toBe(false);
  });

  it("maps usernames to the synthetic domain, passes emails through", () => {
    expect(identifierToEmail("arka")).toBe("arka@siswa.nineos.id");
    expect(identifierToEmail("Guru@labschool.sch.id")).toBe(
      "guru@labschool.sch.id"
    );
  });

  it("round-trips username display", () => {
    expect(displayUsername(identifierToEmail("arka"))).toBe("arka");
    expect(displayUsername("guru@labschool.sch.id")).toBe(
      "guru@labschool.sch.id"
    );
  });
});

describe("pulseSchema", () => {
  const base = {
    energy_level: "3",
    pressure_level: "4",
    feeling: "lelah",
    needs_help: "true",
    help_category: "academic",
    note: "",
  };

  it("accepts a valid submission and coerces types", () => {
    const r = pulseSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.energy_level).toBe(3);
      expect(r.data.needs_help).toBe(true);
      expect(r.data.help_category).toBe("academic");
      expect(r.data.note).toBeNull();
    }
  });

  it("rejects out-of-range levels (numeric boundaries)", () => {
    expect(pulseSchema.safeParse({ ...base, energy_level: "0" }).success).toBe(false);
    expect(pulseSchema.safeParse({ ...base, energy_level: "6" }).success).toBe(false);
    expect(pulseSchema.safeParse({ ...base, pressure_level: "2.5" }).success).toBe(false);
  });

  it("rejects unknown feelings (enum validation)", () => {
    expect(pulseSchema.safeParse({ ...base, feeling: "hancur" }).success).toBe(false);
  });

  it("nulls help_category when help not needed", () => {
    const r = pulseSchema.safeParse({ ...base, needs_help: "false" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.help_category).toBeNull();
  });

  it("defaults help_category to other when help needed but not chosen", () => {
    const r = pulseSchema.safeParse({ ...base, help_category: null });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.help_category).toBe("other");
  });
});

describe("waliRequestSchema", () => {
  it("requires a real message", () => {
    expect(
      waliRequestSchema.safeParse({
        category: "academic",
        urgency: "normal",
        message: "abc",
      }).success
    ).toBe(false);
    expect(
      waliRequestSchema.safeParse({
        category: "academic",
        urgency: "soon",
        message: "Saya ingin bicara tentang nilai.",
      }).success
    ).toBe(true);
  });

  it("rejects invalid category/urgency", () => {
    expect(
      waliRequestSchema.safeParse({
        category: "gossip",
        urgency: "normal",
        message: "Pesan valid di sini.",
      }).success
    ).toBe(false);
    expect(
      waliRequestSchema.safeParse({
        category: "other",
        urgency: "immediately",
        message: "Pesan valid di sini.",
      }).success
    ).toBe(false);
  });

  it("has NO status field — clients cannot set workflow state", () => {
    const r = waliRequestSchema.safeParse({
      category: "other",
      urgency: "normal",
      message: "Pesan valid di sini.",
      status: "closed",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect("status" in r.data).toBe(false);
    }
  });
});

describe("profileUpdateSchema", () => {
  it("only allows safe fields — role is never part of the schema", () => {
    const r = profileUpdateSchema.safeParse({
      full_name: "Arka",
      nickname: "Ka",
      role: "teacher",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect("role" in r.data).toBe(false);
      expect(Object.keys(r.data).sort()).toEqual(["full_name", "nickname"]);
    }
  });

  it("rejects empty names", () => {
    expect(
      profileUpdateSchema.safeParse({ full_name: " ", nickname: "x" }).success
    ).toBe(false);
  });
});

describe("timeCapsuleSchema", () => {
  it("requires the future message only", () => {
    expect(timeCapsuleSchema.safeParse({ future_message: "" }).success).toBe(false);
    const r = timeCapsuleSchema.safeParse({ future_message: "Halo aku." });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.current_feeling).toBeNull();
  });
});

describe("requestStatusUpdateSchema", () => {
  it("validates uuid + workflow enum", () => {
    expect(
      requestStatusUpdateSchema.safeParse({ id: "not-a-uuid", status: "seen" })
        .success
    ).toBe(false);
    expect(
      requestStatusUpdateSchema.safeParse({
        id: "3e0c1a1e-6dc9-4b7a-a37d-1c4b30f6a111",
        status: "deleted",
      }).success
    ).toBe(false);
    expect(
      requestStatusUpdateSchema.safeParse({
        id: "3e0c1a1e-6dc9-4b7a-a37d-1c4b30f6a111",
        status: "follow_up",
      }).success
    ).toBe(true);
  });
});

describe("announcementSchema", () => {
  it("parses checkbox booleans", () => {
    const r = announcementSchema.safeParse({
      title: "Halo",
      content: "Isi",
      is_published: "on",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.is_published).toBe(true);
  });
});

describe("eventSchema", () => {
  it("rejects end before start", () => {
    expect(
      eventSchema.safeParse({
        title: "Ujian",
        start_at: "2026-07-14T08:00",
        end_at: "2026-07-14T07:00",
      }).success
    ).toBe(false);
  });

  it("accepts open-ended events", () => {
    expect(
      eventSchema.safeParse({
        title: "Ujian",
        start_at: "2026-07-14T08:00",
        end_at: "",
      }).success
    ).toBe(true);
  });
});
