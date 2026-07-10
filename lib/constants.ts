/**
 * Student accounts are provisioned by the teacher and log in with a
 * username. Under the hood each username maps to a synthetic email on
 * this domain (Supabase Auth requires an email identifier). No mail is
 * ever sent to these addresses.
 */
export const STUDENT_EMAIL_DOMAIN = "siswa.nineos.id";

/** "arka" → "arka@siswa.nineos.id"; passes emails through untouched. */
export function identifierToEmail(identifier: string): string {
  const clean = identifier.trim().toLowerCase();
  return clean.includes("@") ? clean : `${clean}@${STUDENT_EMAIL_DOMAIN}`;
}

/** Display helper: hides the synthetic domain from students. */
export function displayUsername(email: string): string {
  return email.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)
    ? email.slice(0, -(STUDENT_EMAIL_DOMAIN.length + 1))
    : email;
}
