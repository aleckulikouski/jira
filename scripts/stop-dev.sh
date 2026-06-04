#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# stop-dev.sh — Stop local dev environment
# =============================================================================

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# --- Kill local API and Web servers ---
echo "==> Stopping local servers..."

pkill -f "nx serve api" 2>/dev/null && echo "    API stopped." || echo "    API was not running."
pkill -f "nx serve web" 2>/dev/null && echo "    Web stopped." || echo "    Web was not running."

# --- Stop all Docker containers ---
echo "==> Stopping Docker containers..."
docker compose down
echo "    Done."
