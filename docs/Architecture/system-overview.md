# System Overview

## Purpose

This document explains how every part of Sovereign Messenger connects, why each component exists, and what happens to the system if any part is removed or changed.

Read this first before touching anything else in the codebase.

---

## Problem

The Republic of Uzbekistan government needs a secure internal messaging system that:

- Runs entirely on government-controlled infrastructure (no cloud, no third parties)
- Supports end-to-end encryption
- Is accessible via a standard web browser
- Displays the interface in Uzbek and Russian
- Looks professional and recognizable to government staff

---

## Solution

The system is built on the **Matrix protocol** — an open, decentralized messaging standard. Think of Matrix as the "HTTP of messaging": it defines how messages are sent, stored, and federated, but lets anyone build their own server and client.

The components:

| Component | Role | Why this one |
|-----------|------|--------------|
| **Matrix Synapse** | The homeserver — stores all messages, users, rooms | Reference implementation, battle-tested, open source |
| **PostgreSQL 15** | Database — stores all Synapse data persistently | Synapse requires PostgreSQL for production; SQLite is dev-only |
| **Element Web** | Browser UI — the app users actually see and use | Most mature Matrix client; fully customizable source code |
| **Nginx** | Reverse proxy — routes all traffic, terminates SSL | Industry standard; handles HTTPS so other services don't have to |
| **Docker Desktop** | Container runtime — packages everything together | Ensures identical environment across machines |

---

## Architecture Diagram

```mermaid
graph TD
    Browser["🖥️ User Browser<br/>https://gov.local"]

    subgraph Docker["Docker Desktop — backend_default network"]
        Nginx["🔀 Nginx Reverse Proxy<br/>matrix_proxy<br/>Ports 80 / 443"]
        Element["🎨 Element Web<br/>matrix_element<br/>Serves compiled UI files"]
        Synapse["⚙️ Matrix Synapse<br/>matrix_synapse<br/>Port 8008"]
        Postgres["🗄️ PostgreSQL 15<br/>matrix_postgres<br/>Port 5432"]
    end

    LocalDisk["💾 Local Laptop Disk<br/>frontend/element-web/apps/web/webapp"]

    Browser -->|"All requests<br/>HTTPS 443"| Nginx
    Nginx -->|"Path: /<br/>Static web files"| Element
    Nginx -->|"Path: /_matrix<br/>Path: /_synapse<br/>Matrix API"| Synapse
    Element -->|"Volume mount<br/>reads files directly"| LocalDisk
    Synapse -->|"SQL queries<br/>internal network"| Postgres
```

---

## Container Map

```mermaid
graph LR
    subgraph Host["Your Linux Machine (Docker Desktop)"]
        subgraph Net["Docker Network: backend_default"]
            P["matrix_proxy<br/>nginx:alpine<br/>:80 :443"]
            E["matrix_element<br/>nginx:alpine<br/>:80 (internal)"]
            S["matrix_synapse<br/>matrixdotorg/synapse:v1.100.0<br/>:8008 (internal)"]
            DB["matrix_postgres<br/>postgres:15-alpine<br/>:5432 (internal)"]
        end
        Disk["Local Disk<br/>webapp/ directory"]
    end

    P --> E
    P --> S
    S --> DB
    E -.->|"volume mount"| Disk
```

---

## How It Works — Step by Step

### When a user opens the app

1. Browser visits `https://gov.local`
2. DNS resolves `gov.local` to `127.0.0.1` (via `/etc/hosts`)
3. Docker Desktop maps port `443` on the host to the `matrix_proxy` container
4. Nginx receives the request and checks the path:
   - Path `/` → proxy to `matrix_element:80` → Nginx in that container serves static files from the local `webapp/` directory
   - Path `/_matrix` or `/_synapse` → proxy to `matrix_synapse:8008`
5. Browser receives `index.html`, loads JavaScript bundles, applies the Sovereign Messenger theme, loads Uzbek translations

### When a user logs in

1. Element Web sends `POST https://gov.local/_matrix/client/v3/login`
2. Nginx forwards to Synapse on port 8008
3. Synapse validates credentials, queries PostgreSQL for the user record
4. PostgreSQL returns the user data
5. Synapse generates an access token, returns JSON to Nginx
6. Nginx returns the response to the browser
7. Element stores the token in localStorage and opens the main UI

### When a user sends a message

1. Element sends `PUT https://gov.local/_matrix/client/v3/rooms/{roomId}/send/m.room.message`
2. Nginx forwards to Synapse
3. Synapse processes the event, stores it in PostgreSQL, broadcasts to other room members
4. Other clients receive the event via their long-poll or WebSocket connection to Synapse

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant B as Browser
    participant N as Nginx
    participant E as Element Container
    participant S as Synapse
    participant P as PostgreSQL

    Note over B,P: Phase 1 — Loading the UI
    B->>N: GET https://gov.local/
    N->>E: Proxy to matrix_element:80
    E-->>N: index.html + JS bundles (from local disk)
    N-->>B: Static files

    Note over B,P: Phase 2 — User Login
    B->>N: POST /_matrix/client/v3/login
    N->>S: Proxy to matrix_synapse:8008
    S->>P: SELECT user WHERE username=?
    P-->>S: User record
    S-->>N: {access_token: "..."}
    N-->>B: Login response

    Note over B,P: Phase 3 — Sending a Message
    B->>N: PUT /_matrix/.../send/m.room.message
    N->>S: Proxy to Synapse
    S->>P: INSERT INTO events ...
    P-->>S: OK
    S-->>N: {event_id: "..."}
    N-->>B: Message sent confirmation
```

---

## Important Files

| File | What It Does | What Breaks If Removed |
|------|-------------|----------------------|
| `backend/docker-compose.yml` | Defines all 4 containers and their network | Nothing runs |
| `nginx/default.conf` | All routing rules and SSL config | Traffic cannot reach Synapse or Element |
| `backend/synapse-data/homeserver.yaml` | All Synapse configuration | Synapse refuses to start |
| `frontend/config.json` | Tells Element which homeserver to connect to | Element connects to wrong server or fails |
| `frontend/element-web/apps/web/res/css/_sovereign.pcss` | All custom Telegram-style UI CSS | UI reverts to default Element appearance |
| `frontend/element-web/apps/web/src/i18n/strings/uz.json` | All Uzbek translations | UI shows English keys or raw key strings |
| `frontend/element-web/apps/web/webpack.config.ts` | Build configuration for the entire frontend | Cannot build or run the dev server |
| `certs/gov.local.crt` + `certs/gov.local.key` | SSL certificate for HTTPS | Nginx refuses to start; browser shows security error |

---

## Network Ports

| Port | Exposed On | Container | Purpose |
|------|-----------|-----------|---------|
| 80 | Host | matrix_proxy | HTTP (redirects to HTTPS) |
| 443 | Host | matrix_proxy | HTTPS — main entry point for all traffic |
| 8080 | Host | — (dev server) | webpack-dev-server in development mode |
| 8008 | Internal only | matrix_synapse | Matrix API — never exposed to the internet |
| 5432 | Internal only | matrix_postgres | PostgreSQL — never exposed to the internet |
| 80 | Internal only | matrix_element | Serves static web files to Nginx |

---

## Related Documents

- [Docker Containers](../Docker/containers.md)
- [Nginx Proxy](../Nginx/proxy.md)
- [Synapse Homeserver](../Backend/synapse.md)
- [PostgreSQL](../Backend/postgresql.md)
- [Element Web Customization](../Frontend/element-customization.md)
- [Development Mode](../Development/dev-mode.md)
