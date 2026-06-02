#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# stop-dev.sh — Stop local dev environment
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# --- Kill API and Web servers ---
echo "==> Stopping API and Web servers..."

pkill -f "nx serve api" 2>/dev/null && echo "    API stopped." || echo "    API was not running."
pkill -f "nx serve web" 2>/dev/null && echo "    Web stopped." || echo "    Web was not running."

# --- Optionally stop PostgreSQL ---
if [ "${1:-}" = "--db" ] || [ "${1:-}" = "-d" ]; then
  echo "==> Stopping PostgreSQL..."
  docker compose down
  echo "    PostgreSQL stopped."
else
  echo ""
  echo "    PostgreSQL is still running (use 'stop-dev.sh --db' to stop it too)."
fi
