// ── Date helpers — everything anchored to Asia/Jakarta ────────

const TZ = "Asia/Jakarta";

/** Returns YYYY-MM-DD for a date as seen in Asia/Jakarta. */
export function jakartaDateString(d: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // en-CA yields YYYY-MM-DD
}

/**
 * Monday (YYYY-MM-DD) of the current week in Asia/Jakarta.
 * Used as weekly_pulses.week_start.
 */
export function currentWeekStart(now: Date = new Date()): string {
  const dateStr = jakartaDateString(now);
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use UTC arithmetic on the wall-clock date to avoid TZ drift.
  const wall = new Date(Date.UTC(y, m - 1, d));
  const dow = wall.getUTCDay(); // 0=Sun..6=Sat
  const diff = dow === 0 ? 6 : dow - 1; // days since Monday
  wall.setUTCDate(wall.getUTCDate() - diff);
  return wall.toISOString().slice(0, 10);
}

/** "Senin, 13 Juli 2026" */
export function formatDateID(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** "13 Jul 2026" */
export function formatDateShortID(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** "Senin, 13 Juli 2026 · 07.00" */
export function formatDateTimeID(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const date = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  const time = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} · ${time}`;
}

/** A date-only string (YYYY-MM-DD) interpreted as a plain date. */
export function formatPlainDateID(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/**
 * ISO timestamp → value for <input type="datetime-local"> shown as
 * Jakarta wall time ("2026-07-13T07:00").
 */
export function toJakartaInputValue(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date}T${time}`;
}

/**
 * <input type="datetime-local"> value (interpreted as Jakarta wall time)
 * → UTC ISO string. Jakarta has no DST, so +07:00 is always correct.
 */
export function fromJakartaInputValue(value: string): string {
  return new Date(`${value}:00+07:00`).toISOString();
}

/** Senin (YYYY-MM-DD) dari minggu yang memuat tanggal `dateOnly`. */
export function weekMondayOf(dateOnly: string): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const wall = new Date(Date.UTC(y, m - 1, d));
  const dow = wall.getUTCDay(); // 0=Min..6=Sab
  const diff = dow === 0 ? 6 : dow - 1; // hari sejak Senin
  wall.setUTCDate(wall.getUTCDate() - diff);
  return wall.toISOString().slice(0, 10);
}

/** Dari Senin (YYYY-MM-DD) → 5 tanggal Senin–Jumat. */
export function weekdayDates(mondayOnly: string): string[] {
  const [y, m, d] = mondayOnly.split("-").map(Number);
  const base = Date.UTC(y, m - 1, d);
  return Array.from({ length: 5 }, (_, i) => {
    const dt = new Date(base);
    dt.setUTCDate(dt.getUTCDate() + i);
    return dt.toISOString().slice(0, 10);
  });
}

/** Geser tanggal (YYYY-MM-DD) sebanyak `n` hari (boleh negatif). */
export function addDaysISO(dateOnly: string, n: number): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

/** Greeting by Jakarta wall-clock hour. */
export function greetingID(now: Date = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "numeric",
      hour12: false,
    }).format(now)
  );
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}
