// ── Database row types (hand-written, mirrors supabase/migrations) ──

export type UserRole = "student" | "teacher";

export type RequestCategory =
  | "academic"
  | "friendship"
  | "personal"
  | "future"
  | "digital"
  | "other";

export type RequestUrgency = "normal" | "this_week" | "soon";

export type RequestStatus = "submitted" | "seen" | "follow_up" | "closed";

export type ResourceCategory =
  | "study"
  | "high_school"
  | "ai_integrity"
  | "digital_safety"
  | "wellbeing"
  | "other";

export type Feeling =
  | "baik"
  | "lelah"
  | "bingung"
  | "tertekan"
  | "termotivasi"
  | "campur_aduk"
  | "lainnya";

export type Gender = "L" | "P";

export type AccountStatus = "active" | "inactive";

export interface Profile {
  id: string;
  full_name: string;
  nickname: string;
  email: string;
  role: UserRole;
  class_name: string;
  avatar_url: string | null;
  gender: Gender | null;
  status: AccountStatus;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PiketSchedule {
  id: string;
  duty_date: string; // YYYY-MM-DD
  generated_by: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

export interface PiketAssignment {
  id: string;
  schedule_id: string;
  student_id: string;
  role: string | null;
  completed: boolean;
  created_at: string;
}

export interface PiketExclusion {
  id: string;
  student_id: string;
  exclusion_date: string;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface WaliRequestNote {
  id: string;
  request_id: string;
  teacher_note: string | null;
  follow_up_at: string | null;
  closed_reason: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  three_words: string | null;
  strengths: string | null;
  growth_area: string | null;
  hope: string | null;
  concern: string | null;
  future_plan: string | null;
  problem_response: string | null;
  support_note: string | null;
  private_note_to_teacher: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeeklyPulse {
  id: string;
  student_id: string;
  week_start: string;
  energy_level: number;
  pressure_level: number;
  feeling: Feeling;
  feeling_detail: string | null;
  needs_help: boolean;
  help_category: RequestCategory | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaliRequest {
  id: string;
  student_id: string;
  category: RequestCategory;
  message: string;
  urgency: RequestUrgency;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface Goals {
  id: string;
  student_id: string;
  academic_goal: string | null;
  character_goal: string | null;
  courage_goal: string | null;
  period: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeCapsule {
  id: string;
  student_id: string;
  current_feeling: string | null;
  desired_change: string | null;
  self_proof: string | null;
  future_message: string;
  unlock_date: string;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClassEvent {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  url: string | null;
  category: ResourceCategory;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CharterItem {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Shared server-action result shape ────────────────────────
// `secret` carries a one-time value (e.g. temporary password) that
// the UI shows exactly once and is never persisted anywhere.
export type ActionResult =
  | { ok: true; message?: string; secret?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
