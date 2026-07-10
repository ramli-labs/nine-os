#!/usr/bin/env node
/**
 * Minimal psql substitute for environments without the psql client.
 * Executes .sql files sequentially over a single connection and
 * prints server NOTICEs (used by the RLS test suite for PASS lines).
 *
 * Usage: node scripts/run-sql.mjs --host <dir-or-host> --port <port> --db <name> file1.sql [file2.sql…]
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const args = process.argv.slice(2);
function opt(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return args[i + 1];
}
const files = args.filter(
  (a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--"))
);

const client = new pg.Client({
  host: opt("host", "localhost"),
  port: Number(opt("port", "5432")),
  user: opt("user", "postgres"),
  database: opt("db", "postgres"),
});

client.on("notice", (msg) => {
  console.log(`NOTICE: ${msg.message}`);
});

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(file, "utf8")
      // strip psql meta-commands (e.g. \set ON_ERROR_STOP) — the driver
      // already aborts on the first error.
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("\\"))
      .join("\n");
    process.stdout.write(`→ ${file}\n`);
    const result = await client.query(sql);
    const results = Array.isArray(result) ? result : [result];
    for (const r of results) {
      if (r.command === "SELECT" && r.rows?.length && r.fields?.length === 1) {
        for (const row of r.rows) console.log(String(Object.values(row)[0]));
      }
    }
  }
  console.log("OK");
} catch (err) {
  console.error(`SQL ERROR: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
