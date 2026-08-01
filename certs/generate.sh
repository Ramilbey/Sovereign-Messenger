#!/usr/bin/env bash
# =============================================================================
# generate_certs.sh — TLS Certificate Generation / Renewal
# =============================================================================
# Generates a self-signed TLS certificate for gov.local.
#
# DEVELOPMENT USE ONLY.
# For production, replace this with a proper CA-signed certificate:
#   Option A: Internal CA (recommended for government deployment) — generate
#             a CSR here and have your PKI team sign it.
#   Option B: Let's Encrypt (only if gov.local has a real public DNS record).
#
# RENEWAL: Run this script again. New certs take effect after:
#   docker compose -f backend/docker-compose.yml restart nginx
#
# LOCATION: certs/gov.local.crt and certs/gov.local.key
#   These files are gitignored (certs/ is in .gitignore).
#   Back them up outside the repo, or regenerate as needed.
#
# BROWSER TRUST: After running this script, import certs/gov.local.crt
#   into your OS/browser trust store so the browser stops showing warnings.
#   Linux:  sudo cp certs/gov.local.crt /usr/local/share/ca-certificates/ && sudo update-ca-certificates
#   macOS:  open certs/gov.local.crt  (then trust it in Keychain Access)
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CERTS_DIR="$REPO_ROOT/certs"
DOMAIN="gov.local"
DAYS_VALID=825  # ~2.25 years (Apple/Chrome max for self-signed is 825 days)

mkdir -p "$CERTS_DIR"

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     🔐  Sovereign Messenger — TLS Certificate Generator      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "  Domain  : $DOMAIN"
echo "  Valid   : $DAYS_VALID days (~2.25 years)"
echo "  Output  : $CERTS_DIR/"
echo ""

# ── Check for existing certs ──────────────────────────────────────────────────
if [[ -f "$CERTS_DIR/$DOMAIN.crt" ]]; then
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERTS_DIR/$DOMAIN.crt" 2>/dev/null | cut -d= -f2 || echo "unknown")
    echo "  ⚠️  Existing certificate found. Expiry: $EXPIRY"
    echo ""
    read -r -p "  Overwrite? (y/N): " confirm
    [[ "$confirm" =~ ^[Yy]$ ]] || { echo "  Aborted."; exit 0; }
    echo ""
fi

# ── Generate private key ──────────────────────────────────────────────────────
echo "▶  Generating RSA-4096 private key..."
openssl genrsa -out "$CERTS_DIR/$DOMAIN.key" 4096
chmod 600 "$CERTS_DIR/$DOMAIN.key"
echo "   ✅ Key:  $CERTS_DIR/$DOMAIN.key"

# ── Generate certificate with SAN (Subject Alternative Names) ─────────────────
# SAN is required for Chrome/Safari to trust self-signed certs.
echo "▶  Generating self-signed certificate with SAN..."
openssl req -new -x509 \
    -key "$CERTS_DIR/$DOMAIN.key" \
    -out "$CERTS_DIR/$DOMAIN.crt" \
    -days "$DAYS_VALID" \
    -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=Government of Uzbekistan/OU=IT/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:127.0.0.1"
chmod 644 "$CERTS_DIR/$DOMAIN.crt"
echo "   ✅ Cert: $CERTS_DIR/$DOMAIN.crt"

# ── Print expiry info ─────────────────────────────────────────────────────────
echo ""
EXPIRY=$(openssl x509 -enddate -noout -in "$CERTS_DIR/$DOMAIN.crt" | cut -d= -f2)
echo "  📅 Expires: $EXPIRY"
echo ""
echo "  Next steps:"
echo "  1. Restart Nginx to pick up the new cert:"
echo "     docker compose -f backend/docker-compose.yml restart nginx"
echo ""
echo "  2. Trust the cert in your browser:"
echo "     Linux:  sudo cp $CERTS_DIR/$DOMAIN.crt /usr/local/share/ca-certificates/"
echo "             sudo update-ca-certificates"
echo "     macOS:  open $CERTS_DIR/$DOMAIN.crt (then trust in Keychain)"
echo ""
echo "  ⚠️  PRODUCTION: Replace this with a CA-signed cert before any"
echo "      real government deployment. Self-signed is development only."
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅  Certificate generated successfully.                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
