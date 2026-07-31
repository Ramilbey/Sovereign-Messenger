# Glossary

Terms used throughout the Sovereign Messenger documentation. If you encounter a term in any doc that you do not understand, look here first.

---

## ADR (Architecture Decision Record)

A short document that captures a significant engineering decision: what the problem was, what options were considered, what was decided, and why. ADRs are stored in `docs/ADRs/` and are never deleted — even if a decision is later reversed, the old ADR is marked "Superseded" and a new one explains the change.

---

## Compound Design System (`--cpd-*`)

Element Web's newer internal design system. It uses CSS custom properties (variables) prefixed with `--cpd-`. Examples: `--cpd-color-bg-canvas-default`, `--cpd-color-text-primary`. Our `_sovereign.pcss` must override both these and the older `--accent`-style variables because different parts of the UI use different systems.

---

## Docker Compose

A tool for defining and running multi-container Docker applications. `backend/docker-compose.yml` defines all 4 containers (postgres, synapse, element, nginx) and their network relationships in one file.

---

## Docker Desktop (vs Docker Engine)

- **Docker Engine**: a system-level daemon (`dockerd`), started as a system service
- **Docker Desktop**: a GUI application that includes Docker Engine in a user-space VM; started as a user service via `systemctl --user start docker-desktop`

This project uses **Docker Desktop for Linux**. The Docker CLI context is `desktop-linux`.

---

## E2E Encryption (End-to-End Encryption)

Messages are encrypted on the sender's device and can only be decrypted by the intended recipient's device. The server (Synapse) stores the messages in encrypted form and cannot read them. Matrix uses the **MegOlm** protocol (based on the Signal Double Ratchet algorithm).

---

## Element Web

The official open-source browser-based client for the Matrix protocol. Built with React + TypeScript. We use a heavily customized version as Sovereign Messenger's user interface.

---

## Federation

In Matrix, federation means two homeservers can exchange messages — like how two email servers can send emails to each other. We have **completely disabled federation** (`federation_domain_whitelist: []` in `homeserver.yaml`) to ensure all communications stay within the government network.

---

## HMR (Hot Module Replacement)

A webpack feature that pushes code changes to the browser **without a full page reload**. When you save a CSS file in dev mode, webpack recompiles just that CSS module and sends the update to the browser via a WebSocket connection. The browser applies the new styles instantly.

---

## Homeserver

In Matrix terminology, a homeserver is the server that hosts user accounts and messages for a particular Matrix domain. Our homeserver is Synapse, and its domain is `gov.local`. Users on this server have Matrix IDs like `@username:gov.local`.

---

## `host.docker.internal`

A special DNS hostname that Docker Desktop creates. Inside a container, `host.docker.internal` resolves to the IP address of the host machine (your laptop). We use this in Nginx so the container can reach the webpack dev server running on your laptop.

---

## i18n (Internationalization)

The practice of designing software to support multiple languages. In Element Web, every text string is stored as a translation key (like `action.send`) that maps to a language file (like `uz.json`). Adding a language means creating a JSON file with the translations.

---

## Matrix

An open standard for real-time communication. Matrix defines how messages are structured, transmitted, and stored. It is federated (servers can talk to each other) and supports end-to-end encryption. The full specification is at https://spec.matrix.org.

---

## Matrix Event

In Matrix, every action (sending a message, joining a room, changing a room's name) is an "event" — a JSON object with a type, content, sender, and timestamp. Events are stored permanently in order.

---

## Nginx

A high-performance web server and reverse proxy. In this project, Nginx does two things: (1) terminates HTTPS (decrypts SSL), and (2) routes requests to the correct backend service based on the URL path.

---

## PostCSS

A CSS preprocessor tool that transforms CSS using plugins. Element Web uses PostCSS to compile `.pcss` files into standard CSS. Our `_sovereign.pcss` file is processed by PostCSS during the webpack build.

---

## PostgreSQL

A powerful open-source relational database. Synapse requires PostgreSQL for production use (SQLite is only for development/testing). All Matrix data — users, rooms, messages, device keys — is stored in PostgreSQL.

---

## Reverse Proxy

A server that receives client requests and forwards them to another server on the client's behalf. The client talks to the reverse proxy (Nginx) and does not know or care which backend server actually handled the request.

---

## Signing Key (`gov.local.signing.key`)

A cryptographic key pair that Synapse uses to sign all events it creates. This proves that an event was created by this specific server and has not been tampered with. It is generated once on first startup. **Losing this file means losing the server's cryptographic identity.**

---

## SSL / TLS

SSL (Secure Sockets Layer) and TLS (Transport Layer Security) are protocols for encrypting network connections. TLS is the modern successor to SSL, but both terms are often used interchangeably. HTTPS = HTTP over TLS.

---

## Synapse

The reference implementation of the Matrix homeserver protocol, written in Python by the Matrix.org Foundation and Element. It is the most feature-complete and widely deployed Matrix server.

---

## TLS Termination

The process of decrypting an encrypted HTTPS connection at the proxy (Nginx), then forwarding the decrypted request to the backend over plain HTTP on the internal network. This centralizes SSL certificate management at Nginx so other services (Synapse, Element) do not need to handle certificates.

---

## Volume Mount

A Docker feature that makes a directory from the host machine visible inside a container. We use two volume mounts for the element container:
1. `webapp/` → where Element's compiled files live (so the container serves them without rebuilding the image)
2. `config.json` → injected at runtime so we can change the homeserver URL without rebuilding

---

## webpack

A module bundler for JavaScript applications. It takes many source files (.tsx, .pcss, .json, images) and compiles them into a small number of optimized output files for the browser. Element Web uses webpack as its build tool.

---

## webpack-dev-server

A development server included with webpack. In addition to serving the compiled files, it watches source files for changes and uses HMR to push updates to the browser automatically. Used in Sovereign Messenger's development mode.
