#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# start-dev.sh — Start local dev environment
#   PostgreSQL → Docker container (port 5433)
#   API + Web  → local nx serve (ports 3000, 4200)
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

API_PORT=3000
WEB_PORT=4200
DB_CONTAINER=jira-postgres-1
DB_USER=jira
DB_PASS=jira
DB_NAME=jira
DB_PORT=5433
DB_TIMEOUT_SEC=30

# =============================================================================
# 1. Ensure Docker is available
# =============================================================================

echo "==> Checking Docker..."

if ! docker info >/dev/null 2>&1; then
  echo "    Docker daemon is not running. Starting Docker Desktop..."
  systemctl --user start docker-desktop 2>/dev/null || true

  ELAPSED=0
  while [ "$ELAPSED" -lt "$DB_TIMEOUT_SEC" ]; do
    if docker info >/dev/null 2>&1; then
      echo "    Docker is ready."
      break
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
  done

  if [ "$ELAPSED" -ge "$DB_TIMEOUT_SEC" ]; then
    echo "ERROR: Docker failed to start after ${DB_TIMEOUT_SEC}s." >&2
    exit 1
  fi
fi

# =============================================================================
# 2. Start PostgreSQL
# =============================================================================

echo "==> Starting PostgreSQL (Docker, port ${DB_PORT})..."
docker compose up -d

echo "==> Waiting for PostgreSQL (timeout: ${DB_TIMEOUT_SEC}s)..."
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

# =============================================================================
# 3. Run Prisma migrations
# =============================================================================

echo "==> Running database migrations..."
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"
(cd apps/api && npx prisma migrate deploy)

# =============================================================================
# 4. Start API and Web locally
# =============================================================================

echo "==> Starting API (port ${API_PORT}) and Web (port ${WEB_PORT})..."
echo "    Ctrl+C to stop both servers."
echo ""

npx -y concurrently \
  --kill-others-on-fail \
  --prefix "[{name}]" \
  --names "API,WEB" \
  --prefix-colors "green,blue" \
  "DATABASE_URL=$DATABASE_URL PORT=$API_PORT $REPO_ROOT/node_modules/.bin/nx serve api" \
  "$REPO_ROOT/node_modules/.bin/nx serve web"

echo ""
echo "==> Dev servers stopped."
echo "    PostgreSQL is still running (use 'docker compose down' to stop it)."
