#!/usr/bin/env bash
# =============================================================================
# dev.sh — Sovereign Messenger Development Mode Launcher
# =============================================================================
# Starts Element Web dev server with HMR (Hot Module Replacement).
# Synapse, PostgreSQL, and Nginx continue running in Docker.
# Nginx proxies https://gov.local -> localhost:8080 (this dev server).
# =============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
ELEMENT_WEB="$REPO_ROOT/frontend/element-web"
WEBAPP="$REPO_ROOT/frontend/element-web/apps/web/webapp"
CONFIG_SRC="$REPO_ROOT/frontend/config.json"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          🏛️  Sovereign Messenger — DEV MODE                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Ensure Docker Desktop containers are running ──────────────────────────
echo "▶  Checking Docker backend (Synapse + Postgres + Nginx)..."
cd "$REPO_ROOT/backend"
docker compose up -d postgres synapse nginx
echo "   ✅ Docker backend up."

# ── 2. Stop the element Docker container (we're replacing it locally) ─────────
echo "▶  Stopping matrix_element Docker container (replacing with local dev server)..."
docker compose stop element 2>/dev/null || true
echo "   ✅ matrix_element stopped."

# ── 3. Restart Nginx so it picks up the updated proxy config ─────────────────
echo "▶  Reloading Nginx config (now proxying to host:8080)..."
docker compose restart nginx
echo "   ✅ Nginx reloaded."

# ── 4. Copy config.json into webapp/ so dev server serves it ─────────────────
echo "▶  Syncing config.json into webapp/ directory..."
mkdir -p "$WEBAPP"
cp "$CONFIG_SRC" "$WEBAPP/config.json"
echo "   ✅ config.json synced to webapp/."

# ── 5. Launch Element Web dev server ─────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  Starting webpack-dev-server with Hot Module Replacement...  ║"
echo "║                                                               ║"
echo "║  🌐  Access via:  https://gov.local  (through Nginx)         ║"
echo "║  🌐  Or direct:   http://localhost:8080                      ║"
echo "║                                                               ║"
echo "║  Changes to _sovereign.pcss, uz.json, tsx files              ║"
echo "║  will hot-reload automatically in the browser!               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd "$ELEMENT_WEB"
pnpm --filter element-web start
