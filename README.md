# 🏛️ Sovereign Messenger — Republic of Uzbekistan

> **Secure, Government-Branded Matrix Communication Platform**
> Sovereign Messenger is an enterprise-grade, self-hosted communication portal tailored for government entities of the Republic of Uzbekistan. Built on top of Matrix Synapse, PostgreSQL, Nginx, and a heavily customized Element Web client featuring Telegram Web (Z/K) aesthetics and native trilingual support (Uzbek, Russian, English).

---

## 📋 Table of Contents
1. [Workspace Structure](#-workspace-structure)
2. [Quickstart & Run Commands](#-quickstart--run-commands)
3. [System Architecture & Network Flow](#-system-architecture--network-flow)
4. [Service Configurations & Customizations](#-service-configurations--customizations)
   - [PostgreSQL Database](#1-postgresql-database)
   - [Synapse Matrix Homeserver](#2-synapse-matrix-homeserver)
   - [Nginx Reverse Proxy & SSL](#3-nginx-reverse-proxy--ssl)
   - [Custom Element Web Frontend](#4-custom-element-web-frontend)
5. [Status Matrix (Working vs Pending)](#-status-matrix)
6. [💡 Troubleshooting & Valuable Developer Advice](#-troubleshooting--valuable-developer-advice)
7. [🎯 Current Step & Next Roadmap](#-current-step--next-roadmap)

---

## 📁 Workspace Structure

```
Sovereign-Messenger/
├── README.md                           # Master Project Documentation & Runbook
├── .env                                # Local environment variables
├── certs/                              # Local SSL Certificates for https://gov.local
│   ├── gov.local.crt                   # Public SSL Certificate
│   └── gov.local.key                   # Private SSL Key
├── nginx/                              # Nginx Proxy Configuration
│   └── default.conf                    # Routing rules for Web UI (80) & Matrix API (8008)
├── backend/                            # Docker Compose & Synapse Core
│   ├── docker-compose.yml              # Container orchestration (Postgres, Synapse, Element, Nginx)
│   ├── connect_synapse.sh              # CLI utility to shell into running Synapse container
│   └── synapse-data/                   # Synapse persistent data & configuration
│       ├── homeserver.yaml             # Core Matrix homeserver configuration
│       └── gov.local.signing.key       # Matrix federation/signing keys
└── frontend/                           # Custom Element Web Source Code
    ├── config.json                     # Main Element Web runtime configuration
    └── element-web/                    # Element Web monorepo
        └── apps/web/
            ├── I18nWebpackPlugin.ts    # Custom i18n build plugin (filters & builds uz, ru, en_EN)
            ├── src/i18n/strings/
            │   ├── uz.json             # Pure Uzbek translations (350+ UI keys covered)
            │   ├── ru.json             # Russian translation bundle
            │   └── en_EN.json          # English fallback dictionary
            ├── res/css/
            │   └── _sovereign.pcss     # Telegram Web (Z/K) custom theme stylesheet
            └── webapp/                 # Compiled production web assets
```

---

## 🚀 Quickstart & Run Commands

### 1. Frontend Development & Build Commands

All frontend operations take place inside `frontend/element-web`.

```bash
# Navigate to element-web
cd ~/Desktop/Sovereign-Messenger/frontend/element-web

# Rebuild the production web assets (compiles JS, CSS themes & i18n bundles)
pnpm --filter element-web build

# Run local hot-reloading dev server (Optional for active UI dev)
pnpm --filter element-web start
```

### 2. Backend & Docker Container Management

All container management commands are executed from the `backend/` directory.

```bash
# Navigate to backend directory
cd ~/Desktop/Sovereign-Messenger/backend

# Start the complete backend stack in detached mode
docker compose up -d

# Restart all services
docker compose restart

# Restart ONLY the Element Web frontend container (e.g. after a rebuild)
docker compose restart element

# View live container logs
docker compose logs -f [postgres|synapse|element|nginx]

# Stop all running containers
docker compose down
```

### 3. User Administration & Synapse Commands

```bash
# Connect directly to the interactive shell of the running Synapse container
./backend/connect_synapse.sh
# OR: docker exec -it matrix_synapse /bin/bash

# Create a new Matrix user (e.g., Admin or Official user)
docker exec -it matrix_synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  https://localhost:8008
```

---

## 🏗️ System Architecture & Network Flow

The system runs entirely containerized within an isolated Docker network:

```
                  ┌─────────────────────────────────────────┐
                  │              User Browser               │
                  │   https://gov.local  /  http://localhost │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼ (HTTPS 443 / HTTP 80)
┌─────────────────────────────────────────────────────────────────────────────┐
│ Docker Network: backend_default                                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      Nginx Reverse Proxy                            │   │
│   │                      (Container: matrix_proxy)                      │   │
│   └───────────────┬─────────────────────────────────────┬───────────────┘   │
│                   │                                     │                   │
│      Location /   │ (Static Web Assets)    Location /_matrix│ (API Proxy)       │
│                   ▼                                     ▼                   │
│   ┌───────────────────────────────┐     ┌───────────────────────────────┐   │
│   │     Element Web Frontend      │     │      Matrix Synapse Engine    │   │
│   │   (Container: matrix_element) │     │   (Container: matrix_synapse) │   │
│   └───────────────────────────────┘     └───────────────┬───────────────┘   │
│                                                         │ Internal TCP      │
│                                                         ▼                   │
│                                         ┌───────────────────────────────┐   │
│                                         │      PostgreSQL 15 Database   │   │
│                                         │  (Container: matrix_postgres) │   │
│                                         └───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Service Configurations & Customizations

### 1. PostgreSQL Database (`matrix_postgres`)
- **Image**: `postgres:15-alpine`
- **Database**: `synapse`
- **User**: `synapse_user`
- **Encoding**: UTF-8 with `C` collation (optimized for Matrix string indexing).
- **Data Persistence**: Named Docker volume `postgres_data`.

### 2. Synapse Matrix Homeserver (`matrix_synapse`)
- **Image**: `matrixdotorg/synapse:v1.100.0`
- **Server Name**: `gov.local`
- **Key Settings (`homeserver.yaml`)**:
  - **Registration Security**: Hard-restricted to approved official government email domains (`@gov.uz`, `@mf.uz`).
  - **Federation Isolation**: `federation_domain_whitelist: []` (Disabled public federation to enforce sovereign security perimeter).
  - **Database Connector**: Configured to connect directly to `matrix_postgres:5432`.

### 3. Nginx Reverse Proxy & SSL (`matrix_proxy`)
- **Image**: `nginx:alpine`
- **Ports**: `80` (HTTP redirects to HTTPS) and `443` (TLS 1.2/1.3 encrypted).
- **SSL Certificates**: Self-signed government SSL certificates stored in `certs/gov.local.crt` and `certs/gov.local.key`.
- **Routing Rules**:
  - `/` -> Proxies to `matrix_element:80` (serves compiled static webapp).
  - `/_matrix` & `/_synapse` -> Proxies to `matrix_synapse:8008` (Matrix Client-Server API).

### 4. Custom Element Web Frontend (`matrix_element`)
- **Branding**: Customized to **Sovereign Messenger** with official Uzbekistan Coat of Arms seal in the authentication header.
- **Language Support**:
  - `I18nWebpackPlugin.ts` configured to compile `uz` (O'zbekcha), `ru` (Русский), and `en_EN` (English fallback).
  - Expanded `uz.json` dictionary covering over **350+ UI keys** (Actions, Auth, Composer, Room List, Settings, Encryption, Keyboard Shortcuts, Threads, Polls).
- **Telegram Web (Z/K) Theme (`_sovereign.pcss`)**:
  - **Palette**: Telegram Dark `#17212b` (sidebar/headers) and `#0e1621` (timeline canvas).
  - **Bubbles**: Rounded chat bubbles — Incoming `#182533` (left) and Outgoing `#2b5278` (Telegram sent blue, right).
  - **Avatars**: 100% circular avatars throughout chat list, header, and timeline.
  - **Composer**: Floating pill input bar with circular `#5288c1` / `#40a7e3` send button.

---

## 📊 Status Matrix

| Component / Feature | Status | Details |
| :--- | :---: | :--- |
| **Container Stack (Docker)** | ✅ Working | Postgres 15, Synapse, Element Web, Nginx reverse proxy running. |
| **HTTPS / SSL Proxy** | ✅ Working | Nginx serving `https://gov.local` with local certs. |
| **Uzbekistan Government Branding** | ✅ Working | Official seal logo, sovereign title, government dark color palette. |
| **Telegram Web UI Aesthetic** | ✅ Working | Custom CSS (`_sovereign.pcss`) styled matching Telegram Web Z/K. |
| **Uzbek Language (`uz`)** | ✅ Working | 350+ translated keys in `uz.json` integrated into build. |
| **Russian Language (`ru`)** | ✅ Working | Enabled in build pipeline and exposed in UI selector. |
| **Synapse Matrix API** | ✅ Working | Listening on port 8008, communicating with Postgres. |
| **Domain Restriction** | ✅ Working | Synapse configured for `@gov.uz` and `@mf.uz` domains. |
| **Automated Email Registration** | ⏳ Pending (Stage 2) | Needs SMTP credentials configured in `homeserver.yaml`. |
| **Voice/Video Calls (TURN)** | ⏳ Pending (Stage 2) | Coturn container installation required for NAT traversal. |

---

### 🐳 Docker Desktop Environment Note
> **Important**: This project runs on **Docker Desktop for Linux** (NOT standard standalone Docker Engine / `dockerd`).
- **Control Service**: Docker Desktop is managed as a user service (`systemctl --user start/stop/status docker-desktop`) or via the Docker Desktop GUI application.
- **Resource Allocation**: Ensure Docker Desktop has allocated at least **4GB RAM** and **2 CPUs** (Settings → Resources) to ensure Webpack builds and Synapse database migrations run smoothly without Out-Of-Memory (OOM) kills.
- **Docker Context**: Verify your CLI is pointing to Docker Desktop:
  ```bash
  docker context ls
  # Should show 'desktop-linux' as active (*)
  ```

---

## 💡 Troubleshooting & Valuable Developer Advice

### 1. Why Docker Desktop / Containers May Not Start or Fail

- **Docker Desktop Service Not Running**:
  - *Symptom*: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`.
  - *Fix*: Start Docker Desktop via systemd user service or launcher:
    ```bash
    systemctl --user start docker-desktop
    ```
    Or check status:
    ```bash
    systemctl --user status docker-desktop
    ```

- **Port Conflicts (80 or 443 already in use)**:
  - *Symptom*: Nginx container fails to bind to 0.0.0.0:80 or 0.0.0.0:443.
  - *Fix*: Check what is using port 80/443 with `sudo lsof -i :80` or `sudo netstat -tlpn | grep :80`. Stop local web servers (like system Apache or system Nginx) before running `docker compose up -d`.

- **Out of Memory (OOM) Kills during Webpack / Synapse startup**:
  - *Symptom*: Container exits with code `137` or Webpack build fails abruptly.
  - *Fix*: Open Docker Desktop GUI → **Settings** → **Resources** and increase Memory to **4GB+**.

- **Synapse File Permission Denied**:
  - *Symptom*: `matrix_synapse` container exits immediately with permission errors on `/data/homeserver.yaml`.
  - *Fix*: Synapse runs as UID `991`. Fix permissions with: `sudo chown -R 991:991 backend/synapse-data`.

- **Database Connection Failure on Cold Start**:
  - *Symptom*: Synapse starts before Postgres is completely initialized.
  - *Fix*: Docker Compose `depends_on` handles startup order, but on first run Postgres initializes schema. If Synapse fails once, run `docker compose restart synapse`.

### 2. Browser Cache & UI Verification
- After running `pnpm --filter element-web build` and restarting `matrix_element`, your browser may still display old cached JS/CSS files.
- **Always do a Hard Refresh**: Press `Ctrl + F5` (or `Cmd + Shift + R` on macOS) to bypass browser cache.

### 3. Local Domain Resolution (`gov.local`)
- Ensure `/etc/hosts` contains the line:
  ```
  127.0.0.1 gov.local
  ```

---

## 🎯 Current Step & Next Roadmap

### 📍 Current Milestone: Stage 1 (PoC / MVP Complete)
The sovereign web app is fully containerized, branded for Uzbekistan state entities, translated into Uzbek and Russian, styled like Telegram Web, and connected to Matrix Synapse.

### 🚩 Next Steps for Stage 2 & Production Deployment
1. **SMTP Configuration**: Configure real SMTP server details in `backend/synapse-data/homeserver.yaml` to allow self-registration via email verification link.
2. **Coturn / TURN Server Setup**: Deploy `coturn` image for peer-to-peer encrypted video and audio calls across restricted government subnets.
3. **IT Park Pipeline Submission**: Package the repository with deployment scripts for official startup incubator / government pipeline submission.
