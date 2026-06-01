#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# start-dev.sh — Start local dev environment (DB, API, Web) with one command
# =============================================================================

# Resolve repo root relative to this script (works regardless of cwd)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# --- Config (change these if your ports differ) ---
API_PORT=3000
WEB_PORT=4200
DB_PORT=5433
DB_NAME=jira
DB_USER=jira
DB_CONTAINER=jira-postgres-1
DB_TIMEOUT_SEC=30

# --- Start PostgreSQL ---
echo "==> Starting PostgreSQL..."
docker compose up -d

# --- Wait for PostgreSQL to be healthy ---
echo "==> Waiting for PostgreSQL to be ready (timeout: ${DB_TIMEOUT_SEC}s)..."
ELAPSED=0
while [ "$ELAPSED" -lt "$DB_TIMEOUT_SEC" ]; do
  if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" -q 2>/dev/null; then
    echo "    PostgreSQL is ready."
    break
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

if [ "$ELAPSED" -ge "$DB_TIMEOUT_SEC" ]; then
  echo "ERROR: PostgreSQL failed to become ready after ${DB_TIMEOUT_SEC}s." >&2
  echo "Check with: docker logs $DB_CONTAINER" >&2
  exit 1
fi

# --- Run Prisma migrations ---
echo "==> Running database migrations..."
(cd apps/api && npx prisma migrate deploy)

# --- Start API and Web concurrently ---
echo "==> Starting API (port ${API_PORT}) and Web (port ${WEB_PORT})..."
echo "    Ctrl+C to stop both servers."
echo ""

# Use concurrently (via npx) so process-group handling works under npm run.
# Backgrounding with & + wait breaks under npm because npm manages its own
# process group and closes stdin, which kills nx serve immediately.
npx -y concurrently \
  --kill-others-on-fail \
  --prefix "[{name}]" \
  --names "API,WEB" \
  --prefix-colors "green,blue" \
  "PORT=$API_PORT $REPO_ROOT/node_modules/.bin/nx serve api" \
  "$REPO_ROOT/node_modules/.bin/nx serve web"

echo ""
echo "==> Dev servers stopped."
echo "    PostgreSQL is still running (use 'docker compose down' to stop it)."
