#!/usr/bin/env bash
set -euo pipefail
# Load the repo-root .env when it exists (Node's built-in --env-file-if-exists),
# so DATABASE_URL is available without exporting it by hand. An absent .env is
# fine (the flag is a no-op) and already-set environment variables — e.g. those
# injected by CI — take precedence over the file, so this is safe in every
# context. The npm script `npm run db:seed` runs the same tsx invocation
# directly (no bash needed); this wrapper is for direct callers.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
exec npx tsx --env-file-if-exists="$ROOT_DIR/.env" "$ROOT_DIR/packages/database/src/seed/index.ts"
