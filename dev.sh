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

# Load .env into the shell environment.
# render_homeserver.py also loads .env directly, so this is belt-and-suspenders
# (useful if other shell steps in this script need a var directly).
ENV_FILE="$REPO_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
    set -o allexport
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +o allexport
else
    echo "❌ ERROR: .env file not found. Copy .env.example to .env and fill in values."
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║          🏛️  Sovereign Messenger — DEV MODE                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Render homeserver.yaml from template ───────────────────────────────────
# Runs on the host (Python stdlib only — no network, no containers needed).
# Writes backend/synapse-data/homeserver.yaml from backend/homeserver.yaml.template
# using vars already loaded from .env above.
echo "▶  Rendering homeserver.yaml from template..."
python3 "$REPO_ROOT/backend/scripts/render_homeserver.py"

# ── 2. Ensure Docker backend containers are running ───────────────────────────
echo "▶  Checking Docker backend (Synapse + Postgres + Nginx)..."
cd "$REPO_ROOT/backend"
docker compose --env-file ../.env up -d postgres synapse nginx
echo "   ✅ Docker backend up."

# ── 3. Stop the element Docker container (we're replacing it locally) ─────────
echo "▶  Stopping matrix_element Docker container (replacing with local dev server)..."
docker compose --env-file ../.env stop element 2>/dev/null || true
echo "   ✅ matrix_element stopped."

# ── 4. Switch nginx location / to dev mode (host.docker.internal:8080) ─────────
# The base nginx/default.conf is permanently in production mode (matrix_element:80).
# We patch it in-place for the dev session, then restore it on exit (EXIT trap).
NGINX_CONF="$REPO_ROOT/nginx/default.conf"
echo "▶  Switching nginx location / to dev mode (host.docker.internal:8080)..."
sed -i \
  's|proxy_pass         http://matrix_element:80;|proxy_pass         http://host.docker.internal:8080;|g' \
  "$NGINX_CONF"
# Add WebSocket upgrade headers required for HMR, after the proxy_pass line
sed -i \
  '/proxy_pass         http:\/\/host.docker.internal:8080;/a\        proxy_http_version 1.1;\n        proxy_set_header   Upgrade    $http_upgrade;\n        proxy_set_header   Connection "upgrade";' \
  "$NGINX_CONF"

# Restore nginx/default.conf to production mode when this script exits
# (Ctrl-C, error, or normal exit from pnpm start)
trap 'echo ""; echo "▶  Restoring nginx/default.conf to production mode..."; \
      sed -i "s|proxy_pass         http://host.docker.internal:8080;|proxy_pass         http://matrix_element:80;|g" "$NGINX_CONF"; \
      sed -i "/proxy_http_version 1.1;/d"    "$NGINX_CONF"; \
      sed -i "/proxy_set_header   Upgrade/d" "$NGINX_CONF"; \
      sed -i "/proxy_set_header   Connection \"upgrade\";/d" "$NGINX_CONF"; \
      echo "   ✅ nginx/default.conf restored to production mode."' EXIT

# ── 5. Restart Nginx so it picks up the dev proxy config ─────────────────────
echo "▶  Reloading Nginx config (now proxying to host:8080)..."
docker compose --env-file ../.env restart nginx
echo "   ✅ Nginx reloaded."

# ── 6. Copy config.json into webapp/ so dev server serves it ────────────────
echo "▶  Syncing config.json into webapp/ directory..."
mkdir -p "$WEBAPP"
cp "$CONFIG_SRC" "$WEBAPP/config.json"
echo "   ✅ config.json synced to webapp/."

# ── 7. Launch Element Web dev server ─────────────────────────────────────────
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
