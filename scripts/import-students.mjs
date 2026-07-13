#!/usr/bin/env node
/**
 * Impor massal akun siswa NINE.OS dari CSV.
 *
 * Meniru persis proses "Tambah siswa" di aplikasi:
 *   - email  = <username>@siswa.nineos.id  (username dari NAMA DEPAN)
 *   - password sementara 10 karakter (CSPRNG, tanpa karakter ambigu)
 *   - metadata: full_name, nickname, gender (L/P), must_change_password=true
 * Trigger database membuat profil-nya otomatis (role selalu 'student').
 *
 * Pemakaian (dari folder project):
 *   node scripts/import-students.mjs data-siswa.csv
 *
 * Kolom CSV yang dibaca (baris pertama = header, urutan bebas):
 *   nama_lengkap      (wajib)
 *   nama_panggilan    (opsional; default: nama depan)
 *   jenis_kelamin     (opsional; L / P)
 *
 * Hasil: file <nama>-passwords.csv berisi username + password sementara
 *        tiap siswa untuk dicetak jadi kartu. JANGAN di-commit ke git.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ── Muat env dari .env.local ──────────────────────────────────
function loadEnvLocal() {
  try {
    const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    /* abaikan — mungkin env sudah di-set di shell */
  }
}
loadEnvLocal();

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SERVICE_KEY) {
  console.error(
    "❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local"
  );
  process.exit(1);
}

const DOMAIN = "siswa.nineos.id";
const PW_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
function tempPassword(len = 10) {
  let out = "";
  for (let i = 0; i < len; i++) out += PW_CHARS[randomInt(PW_CHARS.length)];
  return out;
}

// ── Parser CSV sederhana (tangani tanda kutip & koma) ─────────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

// ── username dari nama depan ──────────────────────────────────
function firstNameSlug(fullName) {
  const first = (fullName.trim().split(/\s+/)[0] || "").toLowerCase();
  let s = first
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (s.length < 3) s = (s + "xyz").slice(0, 3); // username minimal 3 karakter
  return s.slice(0, 20);
}

function normGender(v) {
  const t = (v || "").trim().toUpperCase();
  if (t.startsWith("L") || t.startsWith("M")) return "L";
  if (t.startsWith("P") || t.startsWith("W") || t.startsWith("F")) return "P";
  return null;
}

// ── Baca file ─────────────────────────────────────────────────
const file = process.argv[2];
if (!file) {
  console.error("Pemakaian: node scripts/import-students.mjs data-siswa.csv");
  process.exit(1);
}
const rows = parseCSV(readFileSync(file, "utf8"));
if (rows.length < 2) {
  console.error("CSV kosong atau hanya berisi header.");
  process.exit(1);
}
const header = rows[0].map((h) => h.trim().toLowerCase());
const findCol = (names) => header.findIndex((h) => names.includes(h));
const iName = findCol(["nama_lengkap", "nama lengkap", "nama", "full_name", "name"]);
const iNick = findCol(["nama_panggilan", "panggilan", "nickname"]);
const iGender = findCol(["jenis_kelamin", "gender", "jk", "l/p"]);
if (iName === -1) {
  console.error(
    "❌ Kolom nama lengkap tidak ditemukan. Header CSV harus memuat 'nama_lengkap'."
  );
  process.exit(1);
}

const admin = createClient(SUPA_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const used = new Set();
function uniqueUsername(base) {
  let u = base;
  let n = 1;
  while (used.has(u)) {
    n++;
    u = `${base}${n}`;
  }
  used.add(u);
  return u;
}

const results = [];
let ok = 0;
let skip = 0;
let fail = 0;

for (const r of rows.slice(1)) {
  const full = (r[iName] || "").trim();
  if (!full) continue;
  const nick = ((iNick >= 0 ? r[iNick] : "") || "").trim() || full.split(/\s+/)[0];
  const gender = normGender(iGender >= 0 ? r[iGender] : "");
  const username = uniqueUsername(firstNameSlug(full));
  const email = `${username}@${DOMAIN}`;
  const password = tempPassword();

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full,
      nickname: nick,
      gender,
      must_change_password: true,
    },
  });

  if (error) {
    if (error.code === "email_exists" || /exist/i.test(error.message)) {
      console.log(`SKIP  ${username.padEnd(16)} (sudah ada)`);
      skip++;
      results.push({ username, full, password: "(sudah ada)" });
    } else {
      console.log(`GAGAL ${username.padEnd(16)} ${error.message}`);
      fail++;
    }
  } else {
    console.log(`OK    ${username.padEnd(16)} ${full}`);
    ok++;
    results.push({ username, full, password });
  }
}

const outCsv =
  "username,nama_lengkap,password_sementara\n" +
  results
    .map((r) => `${r.username},"${r.full.replace(/"/g, '""')}",${r.password}`)
    .join("\n") +
  "\n";
const outFile = file.replace(/\.csv$/i, "") + "-passwords.csv";
writeFileSync(outFile, outCsv);

console.log(`\nSelesai — dibuat: ${ok}, dilewati (sudah ada): ${skip}, gagal: ${fail}.`);
console.log(`Daftar username + password → ${outFile}`);
console.log(
  "⚠️  Simpan file itu baik-baik, JANGAN di-commit ke git, dan hapus setelah kartu dibagikan."
);
