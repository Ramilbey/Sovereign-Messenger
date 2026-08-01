#!/usr/bin/env bash
# =============================================================================
# prod.sh — Sovereign Messenger Production Mode Switcher
# =============================================================================
# Rebuilds Element Web, switches Nginx back to serving from the Docker
# matrix_element container, and restarts the full stack.
# Run this when you're done developing and want to go back to production mode.
# =============================================================================

set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
ELEMENT_WEB="$REPO_ROOT/frontend/element-web"

# Load secrets from .env so docker compose ${VAR} substitution works
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
echo "║       🏛️  Sovereign Messenger — PRODUCTION MODE BUILD        ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# ── 1. Build the production webpack bundle ────────────────────────────────────
echo "▶  Building Element Web (production)..."
cd "$ELEMENT_WEB"
pnpm --filter element-web build
echo "   ✅ Build complete."

# ── 2. Render homeserver.yaml from template ───────────────────────────────────
echo "▶  Rendering homeserver.yaml from template..."
python3 "$REPO_ROOT/backend/scripts/render_homeserver.py"

# ── 3. Ensure nginx/default.conf is in production mode ───────────────────────
# nginx/default.conf should already be production mode (proxy_pass matrix_element:80).
# If a dev.sh session was interrupted without triggering its EXIT trap, it may
# have been left in dev mode. This block restores it idempotently either way.
NGINX_CONF="$REPO_ROOT/nginx/default.conf"
echo "▶  Ensuring nginx/default.conf is in production mode (matrix_element:80)..."
sed -i 's|proxy_pass         http://host.docker.internal:8080;|proxy_pass         http://matrix_element:80;|g' "$NGINX_CONF"
sed -i '/proxy_http_version 1.1;/d'    "$NGINX_CONF"
sed -i '/proxy_set_header   Upgrade/d' "$NGINX_CONF"
sed -i '/proxy_set_header   Connection "upgrade";/d' "$NGINX_CONF"
echo "   ✅ nginx/default.conf is in production mode."

# ── 4. Start matrix_element container and restart Nginx ──────────────────────
echo "▶  Starting Docker backend..."
cd "$REPO_ROOT/backend"
docker compose --env-file ../.env up -d
docker compose --env-file ../.env restart nginx
echo "   ✅ All containers running."

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Production mode active!                                  ║"
echo "║  🌐  https://gov.local  (hard refresh with Ctrl+F5)          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
