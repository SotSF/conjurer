#!/usr/bin/env bash
# Download production database + cloud audio for offline / local-data use.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Downloading production database"
yarn downloadProdDatabase

echo
echo "==> Downloading cloud audio"
yarn downloadProdAudio

AUDIO_DIR="public/cloud-assets/audio"
if [[ ! -d "$AUDIO_DIR" ]]; then
  echo "error: ${AUDIO_DIR} missing after audio download" >&2
  exit 1
fi

missing=0
while IFS='|' read -r id name filename; do
  [[ -z "${filename:-}" ]] && continue
  if [[ ! -f "${AUDIO_DIR}/${filename}" ]]; then
    echo "warning: song ${id} (${name}) missing local audio: ${filename}"
    missing=$((missing + 1))
  fi
done < <(sqlite3 local.db "SELECT id, name, filename FROM songs ORDER BY id;")

song_count="$(sqlite3 local.db "SELECT COUNT(*) FROM songs;")"

echo
echo "Prod data ready for local use."
echo "  songs: ${song_count}"
if [[ "$missing" -gt 0 ]]; then
  echo "  missing audio files: ${missing}"
  exit 1
fi
echo "  all song audio files present under ${AUDIO_DIR}"
