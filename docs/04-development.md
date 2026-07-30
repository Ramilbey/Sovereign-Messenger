# Development Journal & Setup Guide

## System Requirements
- **Node.js**: `v24.x` (configured in `.node-version`)
- **Package Manager**: `pnpm` (configured to `11.5.2` in `pnpm-workspace.yaml`)

## Setup Instructions

### 1. Enable Corepack / Install PNPM
If `pnpm` is not installed on your host, you can activate it through `corepack`:
```bash
corepack enable
corepack prepare pnpm@11.5.2 --activate
```
Or download it directly:
```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 2. Install Dependencies
Run this command from the `element-web` folder to install dependencies:
```bash
cd ~/Desktop/Sovereign-Messenger/frontend/element-web
pnpm install
```

### 3. Start Development Server
Start the client server using `nx`:
```bash
pnpm start
```
This starts the Webpack dev server, which will serve the client at `http://localhost:8080`.

---

## Development Journal

### Day 1
- [x] Synapse configured
- [x] PostgreSQL configured
- [x] Docker networking working
- [x] Nginx configured
- [x] Element connected
- [x] Custom Uzbek Sovereign branding assets created (`logo.svg`, `element-desktop-logo.svg`, `element-shiny.svg`)
- [x] Created custom Azure Blue/Gold Sovereign Dark theme config in `config.json`
- [x] Modified HTML title, metadata names, and noscript references to **Sovereign Messenger** in `index.html`
- [x] Verified active local server run (`pnpm start` working at `http://localhost:8080`)
- [x] Resolved logo asset resolving error by updating config to use Webpack themes asset folder
- [x] Generated high-quality Uzbekistan Government cybersecurity seal emblem
- [x] Created `frontend/Dockerfile` and configured `backend/docker-compose.yml` for unified build integration
- [x] Created custom Uzbek language translation mapping (`uz.json`) for login and landing screens
- [x] Locked build pipeline to only compile and bundle the Uzbek (`uz`) locale
- [x] Resolved Synapse database connection DNS issue by switching host to `postgres`
- [x] Resolved Postgres configuration by hardcoding the password in Docker Compose
- [x] Successfully started and validated all container statuses (Synapse, Postgres, Element, Nginx Proxy)
- [x] Fixed UI raw translation keys (like common|home) by compiling en_EN as a silent background fallback while restricting settings dropdown to Uzbek only

**Verification & Launch:**
1. Open a browser tab and go to **`https://gov.local/_matrix/client/versions`**. Click **Advanced** -> **Proceed to gov.local (unsafe)** to whitelist the self-signed SSL certificate.
2. Load **`http://localhost:8080`** (local dev server) or **`https://gov.local`** (Docker proxy) in your browser.
3. Verify that the Sovereign Messenger login screen displays fully in Uzbek by default, with only the Uzbek option selectable, and all untranslated keys fall back gracefully to English rather than raw key strings.
