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

# ── 2. Switch Nginx config back to matrix_element Docker container ─────────────
NGINX_CONF="$REPO_ROOT/nginx/default.conf"
echo "▶  Switching Nginx proxy back to matrix_element:80 (production)..."
sed -i 's|proxy_pass http://host.docker.internal:8080;|proxy_pass http://matrix_element:80;|g' "$NGINX_CONF"
# Remove the WebSocket upgrade lines (not needed in production)
sed -i '/# Required for webpack HMR/d' "$NGINX_CONF"
sed -i '/proxy_http_version 1.1;/d' "$NGINX_CONF"
sed -i '/proxy_set_header Upgrade/d' "$NGINX_CONF"
sed -i '/proxy_set_header Connection "upgrade";/d' "$NGINX_CONF"
echo "   ✅ Nginx config updated."

# ── 3. Start matrix_element container and restart Nginx ───────────────────────
echo "▶  Starting Docker backend..."
cd "$REPO_ROOT/backend"
docker compose up -d
docker compose restart nginx
echo "   ✅ All containers running."

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Production mode active!                                  ║"
echo "║  🌐  https://gov.local  (hard refresh with Ctrl+F5)          ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
