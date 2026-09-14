#!/usr/bin/env bash
# Start a throwaway PocketBase for tests: scripts/pb-scratch.sh <workdir> <port>
# Uses BE-pocketbase's binary but its own data/hooks/migrations dirs, so the
# project's pb_data is never touched. Prints the server PID.
set -euo pipefail
WORK="$1"; PORT="$2"
HERE="$(cd "$(dirname "$0")" && pwd)"
BIN="$HERE/../../BE-pocketbase/pocketbase"
MIGRATIONS="${PB_MIGRATIONS_DIR:-$WORK/migrations}"
mkdir -p "$WORK/data" "$WORK/hooks" "$MIGRATIONS"
FLAGS=(--dir "$WORK/data" --hooksDir "$WORK/hooks" --migrationsDir "$MIGRATIONS")
"$BIN" superuser upsert setup@example.com setuppass123 "${FLAGS[@]}" > /dev/null
"$BIN" serve --http "127.0.0.1:$PORT" "${FLAGS[@]}" > "$WORK/serve.log" 2>&1 &
echo $!
curl -s --retry 20 --retry-connrefused --retry-delay 1 -o /dev/null "http://127.0.0.1:$PORT/api/health"
