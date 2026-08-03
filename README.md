# 🏛️ Sovereign Messenger

**Secure, self-hosted government communication platform for the Republic of Uzbekistan.**

Built on Matrix Synapse + custom Element Web, containerized with Docker Desktop, proxied through Nginx with TLS.

---

## What Is This?

Sovereign Messenger is a government-grade secure messaging portal. It uses the open Matrix protocol as its backbone, a heavily customized Element Web as the browser UI, and runs entirely on the organization's own servers — no third-party cloud, no data leaving the country.

---

## Quick Start

### First Time Only

```bash
chmod +x dev.sh prod.sh
```

### Development Mode (active UI work, hot reload)

```bash
./dev.sh
```

### Production Mode (final build, full Docker stack)

```bash
./prod.sh
```

---

## Access

| URL | What |
|-----|------|
| `https://gov.local` | The messenger web UI |
| `https://gov.local/admin/` | Synapse Admin Management UI |
| `https://gov.local/_matrix` | Matrix API (internal, used by Element) |

> Add `127.0.0.1 gov.local` to `/etc/hosts` if the domain does not resolve.

---

## Documentation

All detailed documentation lives in [`docs/`](docs/):

| Topic | File |
|-------|------|
| **App operations & CLI tasks guide** | [docs/app-functions.md](docs/app-functions.md) |
| System architecture & how everything connects | [docs/Architecture/system-overview.md](docs/Architecture/system-overview.md) |
| Development mode — hot reload setup | [docs/Development/dev-mode.md](docs/Development/dev-mode.md) |
| Production build & deployment | [docs/Deployment/production.md](docs/Deployment/production.md) |
| Docker containers & networking | [docs/Docker/containers.md](docs/Docker/containers.md) |
| Nginx reverse proxy & SSL | [docs/Nginx/proxy.md](docs/Nginx/proxy.md) |
| Matrix Synapse homeserver | [docs/Backend/synapse.md](docs/Backend/synapse.md) |
| PostgreSQL database | [docs/Backend/postgresql.md](docs/Backend/postgresql.md) |
| Element Web — UI customization | [docs/Frontend/element-customization.md](docs/Frontend/element-customization.md) |
| Telegram-style theme | [docs/Frontend/theming.md](docs/Frontend/theming.md) |
| Uzbek & Russian language support | [docs/Frontend/i18n.md](docs/Frontend/i18n.md) |
| SSL certificates | [docs/Security/ssl-certificates.md](docs/Security/ssl-certificates.md) |
| Troubleshooting common issues | [docs/Troubleshooting/common-issues.md](docs/Troubleshooting/common-issues.md) |
| Glossary of terms | [docs/Glossary/glossary.md](docs/Glossary/glossary.md) |
| Engineering decisions (ADRs) | [docs/ADRs/](docs/ADRs/) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Protocol | Matrix (open standard) |
| Homeserver | Synapse v1.100.0 |
| Database | PostgreSQL 15 |
| Frontend | Element Web (heavily customized) |
| Proxy / TLS | Nginx (Alpine) |
| Containers | Docker Desktop for Linux |
| Languages | Uzbek (primary), Russian, English (fallback) |
| UI Theme | Telegram Web Z/K dark style |
