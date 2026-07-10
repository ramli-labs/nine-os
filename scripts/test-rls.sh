#!/usr/bin/env bash
# ============================================================
# NINE.OS — RLS verification against a real (throwaway) Postgres.
# Spins up a temporary cluster, applies auth shim + migrations +
# seed, then runs supabase/tests/rls_tests.sql.
#
# Postgres binaries are located from (in order):
#   1. $PGBIN if set
#   2. system install (/usr/lib/postgresql/*/bin)
#   3. npm package @embedded-postgres/* under /tmp/pgtools
# SQL is executed with psql when available, otherwise with the
# bundled node runner (scripts/run-sql.mjs, requires `pg`).
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${PGBIN:-}" ]; then
  PGBIN="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1 || true)"
fi
if [ -z "${PGBIN}" ]; then
  PGBIN="$(ls -d /tmp/pgtools/node_modules/@embedded-postgres/*/native/bin 2>/dev/null | head -1 || true)"
fi
if [ -z "${PGBIN}" ]; then
  echo "Postgres server binaries not found. Install postgresql, or:" >&2
  echo "  mkdir -p /tmp/pgtools && npm i --prefix /tmp/pgtools @embedded-postgres/linux-x64" >&2
  exit 1
fi
echo "→ using postgres binaries: ${PGBIN}"

DATADIR="$(mktemp -d /tmp/nineos-pg.XXXXXX)"
PORT="${NINEOS_TEST_PG_PORT:-5544}"
cleanup() {
  "${PGBIN}/pg_ctl" -D "${DATADIR}" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "${DATADIR}"
}
trap cleanup EXIT

echo "→ init temporary cluster"
"${PGBIN}/initdb" -D "${DATADIR}" -U postgres -A trust >/dev/null
"${PGBIN}/pg_ctl" -D "${DATADIR}" -w -l "${DATADIR}/pg.log" \
  -o "-p ${PORT} -k ${DATADIR} -c listen_addresses=''" start >/dev/null

run_sql() { # run_sql <db> <files…>
  local db="$1"; shift
  if [ -x "${PGBIN}/psql" ]; then
    for f in "$@"; do
      "${PGBIN}/psql" -h "${DATADIR}" -p "${PORT}" -U postgres -d "${db}" \
        -v ON_ERROR_STOP=1 -q -f "${f}"
    done
  else
    node scripts/run-sql.mjs --host "${DATADIR}" --port "${PORT}" --db "${db}" "$@"
  fi
}

echo "→ create database"
if [ -x "${PGBIN}/psql" ]; then
  "${PGBIN}/psql" -h "${DATADIR}" -p "${PORT}" -U postgres -d postgres \
    -c "create database nineos_test;" >/dev/null
else
  echo "create database nineos_test;" > /tmp/nineos-createdb.sql
  node scripts/run-sql.mjs --host "${DATADIR}" --port "${PORT}" --db postgres /tmp/nineos-createdb.sql
fi

echo "→ auth shim + migrations + seed + tests"
run_sql nineos_test \
  supabase/tests/auth_shim.sql \
  supabase/migrations/0001_schema.sql \
  supabase/migrations/0002_rls.sql \
  supabase/seed.sql \
  supabase/tests/rls_tests.sql

echo ""
echo "✅ RLS TEST SUITE PASSED"
