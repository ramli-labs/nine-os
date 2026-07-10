import type {
  Feeling,
  RequestCategory,
  RequestStatus,
  RequestUrgency,
  ResourceCategory,
} from "@/lib/types";

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  academic: "Akademik",
  friendship: "Pertemanan",
  personal: "Pribadi",
  future: "Masa Depan",
  digital: "Digital",
  other: "Lainnya",
};

export const URGENCY_LABELS: Record<RequestUrgency, string> = {
  normal: "Tidak mendesak",
  this_week: "Minggu ini",
  soon: "Saya ingin segera bicara",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Terkirim",
  seen: "Sudah dibaca",
  follow_up: "Sedang ditindaklanjuti",
  closed: "Selesai",
};

export const FEELING_LABELS: Record<Feeling, string> = {
  baik: "Baik",
  lelah: "Lelah",
  bingung: "Bingung",
  tertekan: "Tertekan",
  termotivasi: "Termotivasi",
  campur_aduk: "Campur aduk",
  lainnya: "Lainnya",
};

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  study: "Cara Belajar",
  high_school: "Menuju SMA",
  ai_integrity: "AI & Kejujuran",
  digital_safety: "Keamanan Digital",
  wellbeing: "Keseimbangan Diri",
  other: "Lainnya",
};
