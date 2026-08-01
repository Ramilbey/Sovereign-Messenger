# Phase 0/1 Verification Checklist
# Run these commands in order. Each must pass before calling Phase 0/1 done.
# =============================================================================

# ── PRE-FLIGHT ────────────────────────────────────────────────────────────────

# 0a. Delete the stale duplicate template (gitignored, but confusing):
rm -f backend/synapse-data/homeserver.yaml.template

# 0b. Make scripts executable:
chmod +x certs/generate.sh backend/scripts/pg_backup.sh backend/scripts/provision_org.py

# 0c. Confirm .env exists and has real values (not CHANGE_ME):
grep -E "POSTGRES_PASSWORD|REGISTRATION_SHARED_SECRET" .env


# ── STACK STARTUP ─────────────────────────────────────────────────────────────

# 1. Tear down existing containers WITHOUT touching the postgres_data volume.
#    (If the volume already has data from previous runs, this preserves it.)
cd backend
docker compose --env-file ../.env down
cd ..

# 2. Start the full stack:
cd backend
docker compose --env-file ../.env up -d
cd ..

# Expected startup order:
#   1. synapse-config starts (Alpine), installs gettext, runs envsubst, exits 0
#   2. postgres starts, passes pg_isready healthcheck
#   3. synapse starts (no entrypoint override), reads rendered homeserver.yaml
#   4. synapse passes python3 healthcheck on /_matrix/client/versions
#   5. element + synapse-admin start
#   6. nginx starts (depends on synapse: healthy)


# ── VERIFICATION STEPS ────────────────────────────────────────────────────────

# 3. Check all containers are up (none should be "Restarting" or "Exited"):
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
# Expected: matrix_synapse, matrix_postgres, matrix_element, matrix_admin, matrix_proxy
# matrix_synapse_config should be "Exited (0)" — this is correct.

# 4. Confirm homeserver.yaml was rendered correctly (should show real password, not ${VAR}):
docker exec matrix_synapse cat /data/homeserver.yaml | grep -E "password|registration_shared_secret"
# Must NOT show "${POSTGRES_PASSWORD}" or "${REGISTRATION_SHARED_SECRET}" as literals.

# 5. Confirm Matrix C-S API is reachable through nginx:
curl -sk https://gov.local/_matrix/client/versions | python3 -m json.tool | head -5
# Expected: JSON with "versions": ["r0.0.1", ...]

# 6. Confirm synapse-admin UI is reachable:
curl -skI https://gov.local/admin/ | head -5
# Expected: HTTP/2 200 (or redirect to /admin/#/)

# 7. Confirm Synapse logs show no errors:
docker logs matrix_synapse --tail 30 2>&1 | grep -iE "error|critical|exception" || echo "No errors found"


# ── LOGIN ROUND-TRIP TEST ─────────────────────────────────────────────────────
# This is the protocol-safety check. Must pass before Phase 1 is considered done.

# 8. Register a test user via the Admin API:
#    (Requires SYNAPSE_ADMIN_TOKEN in .env — see backend/scripts/README.md for how to get it)
source .env
curl -sk -X PUT "https://gov.local/_synapse/admin/v2/users/@testuser:gov.local" \
  -H "Authorization: Bearer $SYNAPSE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "TestPassword123!", "displayname": "Test User", "admin": false}'
# Expected: {"name":"@testuser:gov.local", ...}

# 9. Log in as the test user and capture an access token:
TEST_TOKEN=$(curl -sk -X POST "https://gov.local/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"testuser"},"password":"TestPassword123!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo "Test user token: $TEST_TOKEN"
# Expected: a non-empty token string starting with "syt_"

# 10. Create a room as the test user:
ROOM_ID=$(curl -sk -X POST "https://gov.local/_matrix/client/v3/createRoom" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Verification Room","preset":"private_chat"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['room_id'])")
echo "Room ID: $ROOM_ID"
# Expected: !xxxxxxxx:gov.local

# 11. Send a message in the room:
curl -sk -X PUT \
  "https://gov.local/_matrix/client/v3/rooms/$ROOM_ID/send/m.room.message/1" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"msgtype":"m.text","body":"Phase 0/1 verification message"}'
# Expected: {"event_id":"$xxxxxxx"}

# 12. Read back the message from the room timeline:
curl -sk "https://gov.local/_matrix/client/v3/rooms/$ROOM_ID/messages?limit=5" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  | python3 -m json.tool | grep "body"
# Expected: "body": "Phase 0/1 verification message"

# ── CLEAN UP TEST USER ────────────────────────────────────────────────────────
# After verification, deactivate the test user:
curl -sk -X POST "https://gov.local/_synapse/admin/v1/deactivate/@testuser:gov.local" \
  -H "Authorization: Bearer $SYNAPSE_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"erase": true}'

echo ""
echo "=== All checks passed — Phase 0/1 verified ==="
