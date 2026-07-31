# ADR-0004: Development Mode Architecture

**Date:** 2026-07-31
**Status:** Accepted

---

## Context

During active UI development of Sovereign Messenger, the workflow was:

1. Edit a CSS file
2. Run `pnpm --filter element-web build` (~60 seconds)
3. Run `docker compose restart element`
4. Hard refresh the browser
5. Observe the change

This cycle takes 90–120 seconds per change. A developer adjusting padding values, colors, or layout would repeat this cycle dozens of times per session.

---

## Problem

The full webpack production build is required to see any frontend changes. This creates an unacceptably slow feedback loop for UI customization work.

---

## Options Considered

### Option A: Use a Docker volume mount for CSS only

Serve `_sovereign.pcss` directly from disk without rebuilding.

**Why rejected:** PostCSS compilation is required — browsers cannot parse `.pcss` files directly. The file must go through webpack to produce valid CSS. A volume mount alone does not solve the compilation step.

### Option B: Run webpack `--watch` inside the Docker element container

Use `webpack --watch` instead of a one-time build, with the element container.

**Why rejected:** Requires running Node.js and pnpm inside the container, which is not how the `nginx:alpine` image is set up. Would require a custom Dockerfile with 500MB+ of Node.js build tooling just for dev mode. Complex to maintain.

### Option C: webpack-dev-server on the host + Nginx proxy to it

Run the standard webpack development server (`webpack-dev-server`) on the host machine. Reconfigure Nginx to proxy `/` to the dev server instead of the element Docker container.

**Why chosen:**
- `webpack-dev-server` is already configured and supported in the Element Web project
- Hot Module Replacement (HMR) is built into webpack-dev-server — the browser updates in < 1 second
- Synapse and PostgreSQL remain completely in Docker (no changes to the backend)
- Nginx remains in Docker with a one-line proxy change
- The dev server uses the exact same webpack configuration as the production build — no configuration drift

---

## Decision

**Implement Option C.**

In development mode:
- Stop the `matrix_element` Docker container
- Run `pnpm --filter element-web start` on the host (webpack-dev-server on port 8080)
- Change `nginx/default.conf` `location /` to `proxy_pass http://host.docker.internal:8080`
- Restart Nginx

Two helper scripts automate the switch:
- `dev.sh` — switches to dev mode
- `prod.sh` — switches back to production mode

---

## How `host.docker.internal` Works

Docker Desktop for Linux creates a special DNS entry `host.docker.internal` that resolves to the IP address of the host machine. This allows containers to reach services running on the host.

Without Docker Desktop (e.g., plain Docker Engine), `host.docker.internal` does not exist by default and must be manually added via `extra_hosts` in docker-compose.yml.

---

## HMR WebSocket Consideration

Hot Module Replacement requires a WebSocket connection from the browser to the dev server. When the browser connects via `https://gov.local` (through Nginx), the WebSocket must also go through Nginx.

This required two changes:

**In `nginx/default.conf`:**
```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```
These headers tell Nginx to upgrade the HTTP connection to a WebSocket connection and pass it through.

**In `webpack.config.ts`:**
```typescript
client: {
    webSocketURL: "auto://0.0.0.0:0/ws"
}
```
The `auto://` scheme tells webpack to tell the browser's HMR client to connect to the WebSocket at the same host:port the page is served from — meaning it uses `https://gov.local`, which goes through Nginx, which proxies to the dev server.

Without these changes: HMR would fail silently, and file changes would only appear after a manual browser refresh.

---

## Advantages

- Full hot reload: CSS changes appear in < 1 second without page reload
- No Docker rebuild cycle
- No configuration difference between dev build and production build (same webpack config)
- Synapse and PostgreSQL are untouched — backend behavior is identical to production
- Easily reversible with a single script

## Disadvantages

- Dev server must be running on the host; if it crashes, the UI becomes unavailable
- `nginx/default.conf` is in a different state between dev and production mode
  - Mitigated: `dev.sh` and `prod.sh` automate the switch
- Developers must remember to run `./prod.sh` before committing/deploying

## Future Considerations

- If we move to a CI/CD pipeline, the build step should always use production mode
- A `SOVEREIGN_MODE=dev|prod` environment variable could make the switch more explicit
- In a multi-developer environment, consider a `.env`-based approach to track current mode

---

## Related Documents

- [Development Mode](../Development/dev-mode.md)
- [Docker Containers](../Docker/containers.md)
- [Nginx Proxy](../Nginx/proxy.md)
