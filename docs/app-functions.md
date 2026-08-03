# Sovereign Messenger — App Operations Guide

> **Quick answer to "do I need to run the frontend separately?"**
> **No.** The built Element Web app lives in `frontend/element-web/apps/web/webapp/` and is served by the `matrix_element` Docker container (nginx:alpine). Just run `docker compose up` and open your browser. You only need to run `dev.sh` if you are actively editing frontend source code and want live hot-reload.

---

## Architecture at a glance

```
Browser → https://gov.local
              │
              ▼
        Nginx (matrix_proxy)  :443
              │
    ┌─────────┴──────────────────┐
    │                            │
    ▼                            ▼
location /              location /_matrix
matrix_element:80       matrix_synapse:8008
(Element Web app)       (Matrix C-S API)
    │
location /admin/
matrix_admin:80
(synapse-admin UI)
```

`matrix_element` serves the **pre-built** files from  
`frontend/element-web/apps/web/webapp/` — your customised Element fork.  
No separate frontend process is needed during normal operation.

---

## 1. First-time host setup (do once)

### 1a. Add `gov.local` to your hosts file

```bash
echo "127.0.0.1 gov.local" | sudo tee -a /etc/hosts
```

### 1b. Trust the self-signed TLS certificate

```bash
# Regenerate a fresh cert (if not already done):
bash certs/generate.sh

# Trust it system-wide (Linux):
sudo cp certs/gov.local.crt /usr/local/share/ca-certificates/gov.local.crt
sudo update-ca-certificates

# Then restart your browser completely (not just a new tab).
```

> **Chrome workaround:** if you still see a cert warning, go to  
> `chrome://flags/#allow-insecure-localhost` → Enable, relaunch.  
> Or type `thisisunsafe` on the warning page (Chrome only).

---

## 2. Starting the stack

```bash
# From the repo root — do this every time:
python3 backend/scripts/render_homeserver.py   # renders homeserver.yaml from .env
cd backend && docker compose --env-file ../.env up -d && cd ..
```

**Expected containers:**

| Container | Role | Healthy when |
|---|---|---|
| `matrix_postgres` | Database | `pg_isready` passes |
| `matrix_synapse` | Matrix homeserver | `/_matrix/client/versions` → 200 |
| `matrix_element` | Element Web (frontend) | nginx serves `index.html` |
| `matrix_admin` | synapse-admin UI | nginx serves admin SPA |
| `matrix_proxy` | TLS + reverse proxy | all upstreams healthy |

```bash
# Check status:
docker ps --format "table {{.Names}}\t{{.Status}}"

# Watch Synapse logs (Ctrl-C to stop):
docker logs -f matrix_synapse --tail 30
```

---

## 3. Stopping the stack

```bash
# Stop containers — keeps all data (postgres_data volume intact):
cd backend && docker compose --env-file ../.env down && cd ..

# ⚠️  NEVER run `docker compose down -v` — this wipes the database.
```

---

## 4. Opening the app in your browser

| URL | What you get |
|---|---|
| `https://gov.local` | Sovereign Messenger (Element Web) |
| `https://gov.local/admin/` | synapse-admin panel |

**Homeserver URL to enter at login:** `https://gov.local`

The login page has the homeserver pre-filled (`disable_custom_urls: true` in `config.json`), so you should not need to type it — just enter your Matrix username and password.

---

## 5. Creating your first admin user

The homeserver has public registration disabled. All accounts are created via the Admin API or the provisioning script.

### Method A — Admin API (quick, one user)

```bash
# From repo root, with .env values:
source .env

# Create an admin account:
curl -sk -X PUT "https://gov.local/_synapse/admin/v2/users/@admin:gov.local" \
  -H "Authorization: Bearer $SYNAPSE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "ChangeMe123!",
    "displayname": "System Administrator",
    "admin": true,
    "deactivated": false
  }'
```

> **First time problem:** You don't have a token yet — it's a chicken-and-egg.  
> Use Method B for the very first account.

### Method B — register_new_matrix_user CLI (first account only)

```bash
# Run inside the Synapse container (uses the registration_shared_secret from .env):
source .env
docker exec -it matrix_synapse register_new_matrix_user \
  -u admin \
  -p "ChangeMe123!" \
  -a \
  --shared-secret "$REGISTRATION_SHARED_SECRET" \
  http://localhost:8008
```

Flags: `-u` = username, `-p` = password, `-a` = make admin.

### Method C — synapse-admin UI (graphical)

1. Open `https://gov.local/admin/`
2. Enter homeserver URL: `https://gov.local`
3. Log in with your admin username + password
4. Go to **Users** → **Create user**

---

## 6. Getting an admin access token (required for provisioning scripts)

After creating your admin account via Method B:

```bash
# Login and capture the token:
ADMIN_TOKEN=$(curl -sk -X POST "https://gov.local/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "identifier": {"type": "m.id.user", "user": "admin"},
    "password": "ChangeMe123!"
  }' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

echo "Token: $ADMIN_TOKEN"

# Save it to .env:
sed -i "s|^SYNAPSE_ADMIN_TOKEN=.*|SYNAPSE_ADMIN_TOKEN=$ADMIN_TOKEN|" .env
echo "✅ Token saved to .env"
```

---

## 7. Creating regular users

### Single user (CLI):

```bash
source .env
python3 backend/scripts/provision_org.py \
  --create-user \
  --username johndoe \
  --password "SecurePass123!" \
  --display-name "John Doe" \
  --department "Ministry of Finance" \
  --region "Tashkent" \
  --title "Senior Analyst" \
  --role employee
```

### Bulk users from org structure file:

```bash
# 1. Create your org config:
cp backend/scripts/org_structure.example.json backend/scripts/org_structure.json
# Edit org_structure.json with your real departments, users, passwords

# 2. Dry-run (no API calls, just shows what would happen):
python3 backend/scripts/provision_org.py \
  --org-file backend/scripts/org_structure.json \
  --dry-run

# 3. Execute for real:
python3 backend/scripts/provision_org.py \
  --org-file backend/scripts/org_structure.json
```

---

## 8. Logging in to the app

1. Open `https://gov.local` in your browser
2. The homeserver is pre-filled as `gov.local` — do not change it
3. Enter your Matrix username (without `@` or `:gov.local`) and password
4. You should land on the Sovereign Messenger home screen

**Username format at login:** just the local part, e.g. `admin` or `johndoe`  
**Full Matrix ID (for sharing/invites):** `@johndoe:gov.local`

---

## 9. Sending a test message (verification round-trip via API)

```bash
source .env

# 1. Login and get token:
TEST_TOKEN=$(curl -sk -X POST "https://gov.local/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"admin"},"password":"ChangeMe123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. Create a room:
ROOM_ID=$(curl -sk -X POST "https://gov.local/_matrix/client/v3/createRoom" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Room","preset":"private_chat"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['room_id'])")
echo "Room: $ROOM_ID"

# 3. Send a message:
curl -sk -X PUT \
  "https://gov.local/_matrix/client/v3/rooms/$ROOM_ID/send/m.room.message/txn1" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"msgtype":"m.text","body":"Hello from Sovereign Messenger!"}' \
  | python3 -m json.tool

# 4. Read it back:
curl -sk "https://gov.local/_matrix/client/v3/rooms/$ROOM_ID/messages?limit=3" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  | python3 -m json.tool | grep '"body"'
# Expected: "body": "Hello from Sovereign Messenger!"
```

---

## 10. Creating department spaces (org structure)

```bash
source .env

# Create a department space + #general + #announcements rooms
# under an existing region space:
python3 backend/scripts/provision_org.py \
  --create-department \
  --dept-name "Ministry of Finance" \
  --region-name "Tashkent" \
  --region-space-id "!REPLACE_WITH_SPACE_ROOM_ID:gov.local" \
  --manager-user-id "@finance_manager:gov.local"
```

---

## 11. Deactivating / removing a user

```bash
source .env

# Via Admin API:
curl -sk -X POST \
  "https://gov.local/_synapse/admin/v1/deactivate/@username:gov.local" \
  -H "Authorization: Bearer $SYNAPSE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"erase": false}'
# erase: true = also removes message history (irreversible)
# erase: false = deactivates login only, keeps messages

# Or use synapse-admin UI: https://gov.local/admin/ → Users → Deactivate
```

---

## 12. Database backup

```bash
# Manual backup (writes to backend/scripts/pg_backup/):
bash backend/scripts/pg_backup.sh

# Automated daily at 02:00 (add to crontab once):
crontab -e
# Add this line:
# 0 2 * * * /home/mrsand/Desktop/Sovereign-Messenger/backend/scripts/pg_backup.sh >> /var/log/sovereign-backup.log 2>&1

# Restore from backup (⚠️ overwrites all data — confirm first):
gunzip -c backend/scripts/pg_backup/synapse_backup_YYYY-MM-DD_HH-MM-SS.sql.gz \
  | docker exec -i matrix_postgres psql -U synapse_user -d synapse
```

---

## 13. Renewing TLS certificates

```bash
# Regenerate (will prompt before overwriting existing cert):
bash certs/generate.sh

# Apply to running nginx:
cd backend && docker compose --env-file ../.env restart nginx && cd ..

# Re-trust in browser (Linux):
sudo cp certs/gov.local.crt /usr/local/share/ca-certificates/gov.local.crt
sudo update-ca-certificates
```

---

## 14. Development mode (frontend hot-reload)

Only needed when editing Element Web source code (`_sovereign.pcss`, translations, etc.):

```bash
# Starts webpack-dev-server on localhost:8080
# nginx temporarily proxies / → host:8080 instead of matrix_element
# nginx config is restored to production mode automatically on exit (Ctrl-C)
./dev.sh
```

To go back to production serving after dev work:

```bash
./prod.sh   # rebuilds the webpack bundle + restores nginx to matrix_element:80
```

---

## 15. Useful docker commands

```bash
# See all container statuses:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

# Tail Synapse logs:
docker logs -f matrix_synapse

# Tail nginx logs:
docker logs -f matrix_proxy

# Restart a single service:
cd backend && docker compose --env-file ../.env restart synapse && cd ..

# Open a shell inside Synapse container (for debugging):
docker exec -it matrix_synapse bash

# Open a Postgres shell:
docker exec -it matrix_postgres psql -U synapse_user -d synapse
```

---

## 16. Troubleshooting quick reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `NET::ERR_CERT_AUTHORITY_INVALID` | Self-signed cert not trusted | Follow §1b above |
| Login fails, "homeserver unreachable" | `gov.local` not in `/etc/hosts` | `echo "127.0.0.1 gov.local" \| sudo tee -a /etc/hosts` |
| Synapse not starting | `homeserver.yaml` not rendered | Run `python3 backend/scripts/render_homeserver.py` first |
| nginx 502 Bad Gateway | Synapse not healthy yet | Wait 60s after `docker compose up`; check `docker logs matrix_synapse` |
| `matrix_postgres` unhealthy | Wrong `POSTGRES_PASSWORD` in `.env` | Check `.env`, re-run render + compose up |
| Element shows wrong homeserver | Stale `config.json` in `webapp/` | `cp frontend/config.json frontend/element-web/apps/web/webapp/config.json` |
| synapse-admin shows "Could not connect" | Wrong homeserver URL entered | Enter exactly `https://gov.local` (no trailing slash) |
