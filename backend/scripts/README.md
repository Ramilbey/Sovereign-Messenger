# Backend Scripts — README

This directory contains provisioning and operational scripts for the Sovereign Messenger platform.

---

## Scripts

| Script | Purpose | PRD Ref |
|---|---|---|
| `provision_org.py` | Create org Space hierarchy, rooms, users, and profile fields | §3, §4.2–4.4, §8 |
| `pg_backup.sh` | Scheduled PostgreSQL backup (pg_dump → timestamped .sql.gz) | Phase 0 |

---

## Setup

### 1. Install Python dependencies

```bash
pip install requests python-dotenv
```

### 2. Configure `.env`

The scripts auto-load `.env` from the repo root. Required variables:

```
SYNAPSE_BASE_URL=https://gov.local
SYNAPSE_ADMIN_TOKEN=syt_...          # obtain in step 3
REGISTRATION_SHARED_SECRET=...       # from .env
POSTGRES_PASSWORD=...                # from .env
```

### 3. Obtain an admin access token

**First time** — you must have an admin account already created via `register_new_matrix_user` or the synapse-admin UI.

```bash
# Log in and capture the access token
curl -sk -X POST https://gov.local/_matrix/client/v3/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "identifier": {"type": "m.id.user", "user": "admin"},
    "password": "YOUR_ADMIN_PASSWORD"
  }' | python3 -m json.tool | grep access_token
```

Add the returned token to `.env`:
```
SYNAPSE_ADMIN_TOKEN=syt_YWRtaW4...
```

---

## provision_org.py

### Option A — Full org structure from JSON

```bash
# 1. Copy and edit the example
cp org_structure.example.json org_structure.json
# Edit org_structure.json with real usernames, passwords, region/dept names

# 2. Dry-run first — no API calls, just prints what would happen
python3 provision_org.py --org-file org_structure.json --dry-run

# 3. Execute
python3 provision_org.py --org-file org_structure.json
```

### Option B — Create a single user

```bash
python3 provision_org.py --create-user \
  --username johndoe \
  --password "SecureP@ss123!" \
  --display-name "John Doe" \
  --department "Ministry of Finance" \
  --region "Tashkent" \
  --title "Senior Analyst" \
  --role employee
```

Valid `--role` values: `employee`, `dept_manager`, `regional_admin`, `national_admin`, `it_admin`, `security_officer`, `auditor`, `help_desk`

### Option C — Create a department under an existing region space

```bash
python3 provision_org.py --create-department \
  --dept-name "Ministry of Transport" \
  --region-name "Tashkent" \
  --region-space-id "!abc123:gov.local" \
  --manager-user-id "@transport_manager:gov.local"
```

---

## pg_backup.sh

### Manual run

```bash
bash backend/scripts/pg_backup.sh
```

Backup files are written to `backend/scripts/pg_backup/` (gitignored).

### Automated (cron) — recommended for production

```bash
crontab -e
# Add this line (runs at 02:00 daily):
0 2 * * * /home/mrsand/Desktop/Sovereign-Messenger/backend/scripts/pg_backup.sh >> /var/log/sovereign-backup.log 2>&1
```

### Restore from backup

```bash
gunzip -c backend/scripts/pg_backup/synapse_backup_YYYY-MM-DD_HH-MM-SS.sql.gz \
  | docker exec -i matrix_postgres psql -U synapse_user -d synapse
```

> **⚠️ CAUTION:** Restoring overwrites all data in the Synapse database. Only do this after explicit confirmation (PRD Ground Rule 4).

---

## Profile fields (§8 — Verified Employee Directory baseline)

The provisioning script stores each user's department, region, title, and role as Matrix account data under the key `uz.gov.sovereign.profile`. This can be read back:

```bash
curl -sk https://gov.local/_matrix/client/v3/user/@johndoe:gov.local/account_data/uz.gov.sovereign.profile \
  -H "Authorization: Bearer $SYNAPSE_ADMIN_TOKEN"
```

Phase 2 will add the custom Element profile card component that displays these fields with a "Verified — Government of Uzbekistan" badge (PRD §8, 🔵 Custom-FE).
