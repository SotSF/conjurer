#!/usr/bin/env bash
# Replace local.db with a dump of the production Turso database.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

DB_NAME="${TURSO_DB_NAME:-conjurer-db}"
LOCAL_DB="local.db"
INCOMING_DB="local.db.incoming"
DUMP_FILE="$(mktemp -t conjurer-prod-dump.XXXXXX.sql)"

cleanup() {
  rm -f "$DUMP_FILE"
  if [[ -n "${INCOMING_DB}" ]]; then
    rm -f "$INCOMING_DB"
  fi
}
trap cleanup EXIT

if ! command -v turso >/dev/null 2>&1; then
  echo "error: turso CLI not found. Install with: brew install tursodatabase/tap/turso" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "error: sqlite3 not found." >&2
  exit 1
fi

# turso auth whoami exits 0 even when logged out, so check the output text.
whoami_output="$(turso auth whoami 2>&1 || true)"
if [[ "$whoami_output" == *"not logged in"* ]] || [[ -z "$whoami_output" ]]; then
  echo "error: not logged into turso. Run: turso auth login" >&2
  exit 1
fi

echo "Dumping production database (${DB_NAME}) as ${whoami_output}..."
turso db shell "$DB_NAME" .dump >"$DUMP_FILE"

if [[ ! -s "$DUMP_FILE" ]]; then
  echo "error: dump was empty" >&2
  exit 1
fi

if grep -qi "not logged in" "$DUMP_FILE"; then
  echo "error: turso dump failed (not logged in). Run: turso auth login" >&2
  exit 1
fi

if ! grep -qiE '^CREATE TABLE' "$DUMP_FILE"; then
  echo "error: dump does not look like a SQL database dump. First lines:" >&2
  head -n 20 "$DUMP_FILE" >&2
  exit 1
fi

rm -f "$INCOMING_DB"
echo "Importing dump into ${INCOMING_DB}..."
sqlite3 "$INCOMING_DB" <"$DUMP_FILE"

required_tables=(users songs experiences playlists vj_presets)
for table in "${required_tables[@]}"; do
  if ! sqlite3 "$INCOMING_DB" "SELECT 1 FROM sqlite_master WHERE type='table' AND name='$table';" | grep -q 1; then
    echo "error: downloaded database is missing table: $table" >&2
    exit 1
  fi
done

song_count="$(sqlite3 "$INCOMING_DB" "SELECT COUNT(*) FROM songs;")"
experience_count="$(sqlite3 "$INCOMING_DB" "SELECT COUNT(*) FROM experiences;")"
playlist_count="$(sqlite3 "$INCOMING_DB" "SELECT COUNT(*) FROM playlists;")"
vj_count="$(sqlite3 "$INCOMING_DB" "SELECT COUNT(*) FROM vj_presets;")"

rm -f "$LOCAL_DB"
mv "$INCOMING_DB" "$LOCAL_DB"
# Incoming file was moved; don't delete it in cleanup.
INCOMING_DB=""

echo "Wrote ${LOCAL_DB}"
echo "  songs:        ${song_count}"
echo "  experiences:  ${experience_count}"
echo "  playlists:    ${playlist_count}"
echo "  vj presets:   ${vj_count}"
