import "server-only";
import { randomInt } from "node:crypto";

// Tanpa karakter ambigu (0/O, 1/l/I) supaya mudah disalin dari kartu.
const CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Password sementara yang dibuat server (CSPRNG). Nilainya hanya
 * dikembalikan sekali ke wali kelas dan tidak pernah disimpan —
 * Supabase Auth hanya menyimpan hash-nya.
 */
export function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARS[randomInt(CHARS.length)];
  }
  return out;
}
