#!/usr/bin/env bash
# =============================================================================
# pg_backup.sh — PostgreSQL Backup Script for Sovereign Messenger
# =============================================================================
# Dumps the Synapse PostgreSQL database to a timestamped .sql.gz file.
# Designed to be run as a cron job or manually.
#
# SETUP (run once):
#   1. Create the backup directory:
#      mkdir -p /home/mrsand/Desktop/Sovereign-Messenger/backend/scripts/pg_backup
#
#   2. Schedule daily backups (example crontab entry — run at 02:00 daily):
#      crontab -e
#      Add: 0 2 * * * /home/mrsand/Desktop/Sovereign-Messenger/backend/scripts/pg_backup.sh >> /var/log/sovereign-backup.log 2>&1
#
#   3. (Optional) Mount the backup dir to the postgres container so pg_dump
#      can also write there from inside the container — already configured
#      in docker-compose.yml as:
#        volumes:
#          - ../backend/scripts/pg_backup:/pg_backup
#
# RESTORE:
#   gunzip -c <backup_file.sql.gz> | docker exec -i matrix_postgres \
#     psql -U synapse_user -d synapse
#
# RETENTION: Files older than KEEP_DAYS are deleted automatically.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_DIR="$REPO_ROOT/backend/scripts/pg_backup"
KEEP_DAYS=30
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/synapse_backup_${TIMESTAMP}.sql.gz"

# Load secrets from .env (POSTGRES_PASSWORD)
ENV_FILE="$REPO_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -o allexport
    source "$ENV_FILE"
    set +o allexport
else
    echo "❌ ERROR: .env file not found at $ENV_FILE" >&2
    echo "   Cannot read POSTGRES_PASSWORD. Aborting." >&2
    exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "=== Sovereign Messenger — Postgres Backup ==="
echo "  Timestamp : $TIMESTAMP"
echo "  Output    : $BACKUP_FILE"
echo "  Retention : $KEEP_DAYS days"
echo ""

# ── Dump the database via the running postgres container ──────────────────────
echo "▶  Running pg_dump via matrix_postgres container..."
docker exec matrix_postgres \
    pg_dump \
    --username=synapse_user \
    --no-password \
    --clean \
    --if-exists \
    --format=plain \
    synapse \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "   ✅ Backup complete. Size: $BACKUP_SIZE"
echo "   📁 File: $BACKUP_FILE"

# ── Prune old backups ─────────────────────────────────────────────────────────
echo ""
echo "▶  Pruning backups older than $KEEP_DAYS days..."
DELETED=$(find "$BACKUP_DIR" -name "synapse_backup_*.sql.gz" -mtime "+$KEEP_DAYS" -print -delete | wc -l)
echo "   🗑️  Deleted $DELETED old backup(s)."

echo ""
echo "✅ Done. $(date)"
