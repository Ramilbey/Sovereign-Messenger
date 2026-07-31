# Troubleshooting Common Issues

## Purpose

Answers to the most common problems you will encounter working on this project. Each section describes the symptom, explains why it happens, and gives the fix.

---

## Docker Desktop Not Running

**Symptom:**
```
Cannot connect to the Docker daemon at unix:///run/user/1000/docker.sock
```

**Why:** Docker Desktop is not running. This project uses Docker Desktop for Linux (user-space service), not the system Docker Engine.

**Fix:**
```bash
systemctl --user start docker-desktop
# Wait 15-20 seconds for it to fully start, then:
docker ps
```

Or open the Docker Desktop GUI application and wait for the whale icon to stop animating.

**Check current context:**
```bash
docker context ls
# Active (*) context should be: desktop-linux
```

---

## Port 80 or 443 Already in Use

**Symptom:**
```
Error starting userland proxy: listen tcp 0.0.0.0:80: bind: address already in use
```

**Why:** Another process on your machine is already using port 80 or 443. Common culprits: system Nginx, Apache, or another Docker container.

**Fix:**
```bash
# Find what is using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop the conflicting service (example: system nginx)
sudo systemctl stop nginx

# Then try starting Docker containers again
cd backend && docker compose up -d
```

---

## Synapse Exits Immediately (Permission Error)

**Symptom:**
```
matrix_synapse exited with code 1
# In logs:
Permission denied: '/data/homeserver.yaml'
```

**Why:** Synapse runs as user ID 991 inside the container. The files in `backend/synapse-data/` are owned by a different user on your host.

**Fix:**
```bash
sudo chown -R 991:991 ~/Desktop/Sovereign-Messenger/backend/synapse-data
cd backend && docker compose restart synapse
```

---

## Synapse Fails to Connect to PostgreSQL

**Symptom:**
```
# In synapse logs:
synapse.storage.database - ERROR - Connection failed to database
```

**Why:** Either PostgreSQL is not running, or Synapse started before PostgreSQL was fully initialized (race condition on first run).

**Fix:**
```bash
cd backend

# Check if postgres is running
docker compose ps postgres

# If not running, start it and wait a moment
docker compose start postgres
sleep 10

# Then restart synapse
docker compose restart synapse
```

---

## "502 Bad Gateway" in Browser

**Symptom:** Opening `https://gov.local` shows a 502 error page from Nginx.

**Why:** Nginx is running but cannot reach the backend it is trying to proxy to.

**Diagnosis:**
```bash
cd backend
docker compose ps          # Check which containers are running
docker compose logs nginx  # See what Nginx is complaining about
```

**Possible causes:**

| Cause | Fix |
|-------|-----|
| `matrix_element` container is stopped (in production mode) | `docker compose start element` |
| webpack dev server not running (in dev mode) | Run `./dev.sh` from project root |
| `matrix_synapse` not running | `docker compose start synapse` |
| All containers just started; Synapse still initializing | Wait 15 seconds and refresh |

---

## "Cannot Reach Homeserver" in Element UI

**Symptom:** Element Web loads but shows an error connecting to the homeserver.

**Why:** Element loaded successfully but its API calls to `/_matrix` are failing.

**Check:**
```bash
# Test Synapse directly
curl -k https://gov.local/_matrix/client/v3/versions
# Should return JSON with supported Matrix versions

# Check Synapse logs
cd backend && docker compose logs -f synapse
```

**Common causes:**
- Synapse container is not running
- `homeserver.yaml` has a syntax error (check `docker compose logs synapse`)
- PostgreSQL connection failure (see above)

---

## UI Changes Not Appearing After Edit

**Symptom:** You edited `_sovereign.pcss` or `uz.json` but the browser still shows the old version.

**In Dev Mode (dev server running):**
1. Check the terminal — is webpack showing a compilation error? Fix the error first.
2. Check the browser console for a red WebSocket error — if HMR is not connected, changes will not auto-apply. Do a manual refresh (Ctrl+F5).
3. Check you actually saved the file.

**In Production Mode (built webapp):**
1. Did you run `pnpm --filter element-web build`? That step is required.
2. Did you restart the element container? `docker compose restart element`
3. Did you hard refresh? `Ctrl+F5` (not just F5 — browser caches CSS and JS aggressively).

---

## CSS Build Error: "Unknown word 400"

**Symptom:**
```
ERROR in bundles/.../theme-light.css
Unknown word 400 [theme-light.css:1,84]
```

**Why:** A `@import url('...')` statement with semicolons inside the URL string (like Google Fonts weight queries: `wght@300;400;500`) is being parsed by PostCSS as multiple CSS declarations. PostCSS interprets the semicolons as statement terminators.

**Fix:** Do not use `@import url()` with semicolons in `_sovereign.pcss`. Instead, load Google Fonts via a `<link>` tag in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

This was already done. If the error recurs, check that `_sovereign.pcss` does not have any `@import url()` lines.

---

## Browser Shows SSL Certificate Warning

**Symptom:** Browser shows "Your connection is not private" or `NET::ERR_CERT_AUTHORITY_INVALID`.

**Why:** The SSL certificate for `gov.local` is self-signed (not from a trusted CA). Browsers warn about this by default.

**Fix (temporary — per browser visit):**
Click "Advanced" → "Proceed to gov.local (unsafe)".

**Fix (permanent — trust the certificate system-wide):**
```bash
sudo cp ~/Desktop/Sovereign-Messenger/certs/gov.local.crt /usr/local/share/ca-certificates/gov.local.crt
sudo update-ca-certificates
# Restart the browser
```

**Fix (if certificates expired or lost):**
```bash
cd ~/Desktop/Sovereign-Messenger/certs
openssl req -x509 -nodes -days 3650 -newkey rsa:4096 \
  -keyout gov.local.key \
  -out gov.local.crt \
  -subj "/C=UZ/ST=Tashkent/L=Tashkent/O=Government/CN=gov.local" \
  -addext "subjectAltName=DNS:gov.local,IP:127.0.0.1"
cd ../backend && docker compose restart nginx
```

---

## `gov.local` Domain Not Resolving

**Symptom:** Browser shows `ERR_NAME_NOT_RESOLVED` for `https://gov.local`.

**Why:** `gov.local` is a custom local domain that does not exist in public DNS. It must be manually mapped in `/etc/hosts`.

**Fix:**
```bash
# Check if it is already in /etc/hosts
grep gov.local /etc/hosts

# If not, add it
echo "127.0.0.1 gov.local" | sudo tee -a /etc/hosts
```

---

## Container Exits with Code 137

**Symptom:** A container keeps restarting and its exit code is 137.

**Why:** Exit code 137 means the process was killed by the operating system, usually due to Out of Memory (OOM). The container used more RAM than Docker Desktop is allowed.

**Fix:**
1. Open Docker Desktop GUI
2. Go to **Settings → Resources**
3. Increase **Memory** to at least **4 GB**
4. Click **Apply & Restart**
5. Run `docker compose up -d` again

---

## pnpm Build Fails — "Module not found"

**Symptom:**
```
Module not found: Error: Can't resolve '...'
```

**Why:** A dependency is missing. This can happen if `node_modules` is corrupted or outdated.

**Fix:**
```bash
cd ~/Desktop/Sovereign-Messenger/frontend/element-web
pnpm install   # Reinstall all dependencies
pnpm --filter element-web build
```

---

## Related Documents

- [Docker Containers](../Docker/containers.md)
- [Nginx Proxy](../Nginx/proxy.md)
- [Development Mode](../Development/dev-mode.md)
- [SSL Certificates](../Security/ssl-certificates.md)
