import { z } from "zod";

// ── Shared enums (mirror the Postgres enums) ─────────────────
export const requestCategoryEnum = z.enum([
  "academic",
  "friendship",
  "personal",
  "future",
  "digital",
  "other",
]);

export const requestUrgencyEnum = z.enum(["normal", "this_week", "soon"]);

export const requestStatusEnum = z.enum([
  "submitted",
  "seen",
  "follow_up",
  "closed",
]);

export const resourceCategoryEnum = z.enum([
  "study",
  "high_school",
  "ai_integrity",
  "digital_safety",
  "wellbeing",
  "other",
]);

export const feelingEnum = z.enum([
  "baik",
  "lelah",
  "bingung",
  "tertekan",
  "termotivasi",
  "campur_aduk",
  "lainnya",
]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maksimal ${max} karakter.`)
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

// ── Auth ─────────────────────────────────────────────────────
export const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9._-]{2,29}$/,
    "Username 3–30 karakter: huruf kecil, angka, titik, strip, atau garis bawah."
  );

export const loginSchema = z.object({
  // students type a username; the teacher may type a full email
  identifier: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Isi username atau email.")
    .max(100),
  password: z.string().min(1, "Isi password.").max(200),
});

export const genderEnum = z.enum(["L", "P"], {
  message: "Pilih L atau P.",
});

export const createStudentSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(100, "Maksimal 100 karakter."),
  nickname: z
    .string()
    .trim()
    .min(1, "Nama panggilan wajib diisi.")
    .max(40, "Maksimal 40 karakter."),
  username: usernameField,
  gender: genderEnum,
  // Password TIDAK diinput siapa pun — sistem membuat password
  // sementara yang tampil satu kali, lalu siswa menggantinya sendiri.
});

export const setGenderSchema = z.object({
  user_id: z.string().uuid(),
  gender: genderEnum,
});

export const setStatusSchema = z.object({
  user_id: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(72, "Password maksimal 72 karakter."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Ulangi password dengan sama persis.",
    path: ["confirm"],
  });

// ── Tanya Wali: catatan tindak lanjut (teacher-only) ─────────
export const requestNoteSchema = z.object({
  request_id: z.string().uuid(),
  teacher_note: optionalText(4000),
  follow_up_at: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  closed_reason: optionalText(500),
});

// ── Piket harian ─────────────────────────────────────────────
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pilih tanggal yang valid.");

export const generatePiketSchema = z.object({
  duty_date: dateField,
  team_size: z.coerce.number().int().min(1, "Minimal 1 petugas.").max(20),
  confirm_overwrite: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((v) => v === true || v === "true")
    .default(false),
});

export const overridePiketSchema = z.object({
  assignment_id: z.string().uuid(),
  new_student_id: z.string().uuid(),
});

export const exclusionSchema = z.object({
  student_id: z.string().uuid(),
  exclusion_date: dateField,
  reason: optionalText(200),
});

export const resetPasswordSchema = z.object({
  user_id: z.string().uuid(),
});

// ── Profile ──────────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "Nama tidak boleh kosong.")
    .max(100, "Maksimal 100 karakter."),
  nickname: z
    .string()
    .trim()
    .min(1, "Nama panggilan tidak boleh kosong.")
    .max(40, "Maksimal 40 karakter."),
});

// ── Kenali Saya (student profile) ────────────────────────────
export const studentProfileSchema = z.object({
  three_words: optionalText(120),
  strengths: optionalText(1000),
  growth_area: optionalText(1000),
  hope: optionalText(1000),
  concern: optionalText(1000),
  future_plan: optionalText(1000),
  problem_response: optionalText(1000),
  support_note: optionalText(2000),
  private_note_to_teacher: optionalText(2000),
});

// ── Weekly Pulse ─────────────────────────────────────────────
export const pulseSchema = z
  .object({
    energy_level: z.coerce
      .number()
      .int()
      .min(1, "Pilih nilai 1–5.")
      .max(5, "Pilih nilai 1–5."),
    pressure_level: z.coerce
      .number()
      .int()
      .min(1, "Pilih nilai 1–5.")
      .max(5, "Pilih nilai 1–5."),
    feeling: feelingEnum,
    feeling_detail: optionalText(100),
    needs_help: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true"),
    help_category: requestCategoryEnum.optional().nullable(),
    note: optionalText(1000),
  })
  .transform((v) => ({
    ...v,
    // category only meaningful when help is requested
    help_category: v.needs_help ? (v.help_category ?? "other") : null,
    // free-text feeling only meaningful for "lainnya"
    feeling_detail: v.feeling === "lainnya" ? v.feeling_detail : null,
  }))
  .refine((v) => v.feeling !== "lainnya" || Boolean(v.feeling_detail), {
    message: "Tulis perasaanmu di sini.",
    path: ["feeling_detail"],
  });

// ── Tanya Wali ───────────────────────────────────────────────
export const waliRequestSchema = z.object({
  category: requestCategoryEnum,
  urgency: requestUrgencyEnum,
  message: z
    .string()
    .trim()
    .min(5, "Ceritakan sedikit lebih detail, ya (minimal 5 karakter).")
    .max(4000, "Maksimal 4000 karakter."),
});

export const requestStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: requestStatusEnum,
});

// ── My Journey (goals) ───────────────────────────────────────
export const goalsSchema = z.object({
  academic_goal: optionalText(500),
  character_goal: optionalText(500),
  courage_goal: optionalText(500),
  period: optionalText(100),
});

// ── Time Capsule ─────────────────────────────────────────────
export const timeCapsuleSchema = z.object({
  current_feeling: optionalText(2000),
  desired_change: optionalText(2000),
  self_proof: optionalText(2000),
  future_message: z
    .string()
    .trim()
    .min(1, "Tulis pesan untuk dirimu di masa depan.")
    .max(5000, "Maksimal 5000 karakter."),
});

// ── Teacher content ──────────────────────────────────────────
const boolField = z
  .union([z.boolean(), z.enum(["true", "false", "on"])])
  .transform((v) => v === true || v === "true" || v === "on");

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(200),
  content: z.string().trim().min(1, "Isi pengumuman wajib diisi.").max(10000),
  is_published: boolField.default(false),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "Judul wajib diisi.").max(200),
    description: optionalText(2000),
    start_at: z.string().min(1, "Waktu mulai wajib diisi."),
    end_at: z
      .string()
      .optional()
      .transform((v) => (v ? v : null)),
    location: optionalText(200),
  })
  .refine(
    (v) => !v.end_at || new Date(v.end_at) >= new Date(v.start_at),
    { message: "Waktu selesai harus setelah waktu mulai.", path: ["end_at"] }
  );

export const resourceSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(200),
  description: optionalText(500),
  content: optionalText(10000),
  url: z
    .string()
    .trim()
    .url("URL tidak valid.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  category: resourceCategoryEnum,
  is_published: boolField.default(false),
});

export const charterItemSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi.").max(200),
  description: optionalText(1000),
  display_order: z.coerce.number().int().min(0).max(999).default(0),
  is_active: boolField.default(true),
});
