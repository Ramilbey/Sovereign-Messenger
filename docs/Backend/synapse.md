# Matrix Synapse Homeserver

## Purpose

Synapse is the server-side engine for the entire messaging system. It implements the Matrix protocol — receiving, storing, and distributing messages between clients.

---

## What Is the Matrix Protocol?

Matrix is an **open standard** for real-time communication. Think of it like email:

- Email has servers (SMTP/IMAP) and clients (Outlook, Gmail)
- Matrix has servers (Synapse) and clients (Element, Telegram-compatible clients)
- Just like email servers can talk to each other (federation), Matrix servers can too — but we have disabled federation for security

Matrix defines a standard API that any client can implement. We chose Element Web as our client, but in theory any Matrix client would work against our Synapse server.

---

## Configuration File

**Location:** `backend/synapse-data/homeserver.yaml`

Full annotated configuration:

```yaml
# The name of this server. This becomes the domain portion of Matrix IDs.
# Users will have IDs like @username:gov.local
# This cannot be changed after the first user is created without a complex migration.
server_name: "gov.local"
pid_file: /data/homeserver.pid

# How Synapse listens for connections
listeners:
  - port: 8008          # Port number (internal Docker network only)
    tls: false          # No TLS here — Nginx handles TLS termination
    type: http
    x_forwarded: true   # Trust X-Forwarded-For headers from Nginx
    resources:
      - names: [client] # Expose only the client API (not federation)
        compress: false
```

**Why `tls: false` on Synapse?**
Synapse does not need to handle TLS because Nginx already does it. This is called "TLS termination at the proxy." Nginx decrypts HTTPS, then forwards plain HTTP to Synapse on the internal Docker network. Since Nginx and Synapse are on the same isolated Docker network, this internal plain HTTP communication is acceptable.

```yaml
# Database connection
database:
  name: psycopg2       # PostgreSQL driver
  args:
    user: synapse_user
    password: SecretGovernmentPassword123!
    database: synapse
    host: "postgres"   # Docker container name — resolves to matrix_postgres
    port: 5432
    cp_min: 5          # Minimum connection pool size
    cp_max: 10         # Maximum connection pool size
```

**Why `host: "postgres"` not an IP address?**
Docker Compose creates DNS entries for each container using the service name defined in `docker-compose.yml`. The Synapse service is called `synapse` and PostgreSQL is called `postgres`. Inside the Docker network, `postgres` resolves to the PostgreSQL container's IP automatically.

```yaml
log_config: "/data/gov.local.log.config"
media_store_path: "/data/media_store"
signing_key_path: "/data/gov.local.signing.key"
suppress_key_server_warning: true
```

**`signing_key_path`** — Synapse uses this cryptographic key to sign all events it creates. This proves events came from this server and have not been tampered with. This key is generated once on first startup and must never be changed or lost. If lost, the server's identity changes and federation with other servers (if ever enabled) would break.

```yaml
# Registration Security Controls
enable_registration: false                    # Public self-registration is OFF
enable_registration_without_verification: false
registration_shared_secret: "SecretGovernmentRegistrationSecret123!"
```

**Why is registration disabled?**
This is a government internal server. We do not want random internet users registering. Accounts are created manually by the administrator using `register_new_matrix_user`.

**What is `registration_shared_secret`?**
This secret is used when the admin creates new users via the CLI tool. The tool must provide this secret to prove it has authorization:
```bash
docker exec -it matrix_synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  https://localhost:8008
```

```yaml
# Email domain restriction
allowed_local_3pids:
  - medium: email
    pattern: '.*@(gov\.uz|mf\.uz)'
```

This restricts which email addresses can be linked to accounts (when email verification is used). Only addresses ending in `@gov.uz` or `@mf.uz` are permitted. This is a defense-in-depth measure alongside the disabled public registration.

```yaml
# Federation Security — Total Isolation
federation_domain_whitelist: []         # Empty list = no federation allowed
allow_public_rooms_over_federation: false
```

**What is federation?**
Matrix was designed to be federated — like email, servers can talk to each other. A user on `gov.local` could send a message to a user on `matrix.org`.

**Why did we disable it?**
This is a classified government communication system. Federation would mean messages could potentially reach external servers. Setting `federation_domain_whitelist: []` (empty) means Synapse will refuse to federate with any external server. The system is completely isolated.

```yaml
report_stats: false   # Do not send usage statistics to matrix.org
```

---

## User Management

### Creating a New User

```bash
docker exec -it matrix_synapse register_new_matrix_user \
  -c /data/homeserver.yaml \
  https://localhost:8008
```

You will be prompted for:
- Username
- Password
- Whether the user is an admin

The resulting Matrix ID will be `@username:gov.local`.

### Making a User an Admin (via Synapse Admin API)

```bash
# First get your admin token (log in via Element and copy it from Settings → Help & About → Access Token)

curl -X PUT \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"admin": true}' \
  "https://gov.local/_synapse/admin/v1/users/@username:gov.local/admin"
```

### Listing All Users

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "https://gov.local/_synapse/admin/v2/users?limit=100"
```

---

## Data Storage

All Synapse data inside the container is mapped to `backend/synapse-data/` on your host disk:

```
backend/synapse-data/
├── homeserver.yaml          # Main configuration
├── homeserver.pid           # Process ID (Synapse writes this)
├── gov.local.log.config     # Logging configuration
├── gov.local.signing.key    # Cryptographic signing key — NEVER LOSE OR SHARE
├── gov.local.config         # Auto-generated supplemental config
└── media_store/             # All uploaded files (images, documents, etc.)
```

> ⚠️ **Back up `gov.local.signing.key`**. If this file is lost, the server's cryptographic identity is gone. In practice for a fresh install this is fine (generate a new one), but if you ever enable federation, losing the key would break federation permanently.

---

## Performance Tuning

The connection pool `cp_min: 5, cp_max: 10` means Synapse maintains 5 persistent database connections and can open up to 10 under load. For a small government deployment (< 200 users), this is sufficient.

For larger deployments, also consider:
- Increasing PostgreSQL's `max_connections`
- Adding `worker_app` configuration to run Synapse in multi-process mode

---

## Debugging Synapse

```bash
# View Synapse logs in real time
cd backend && docker compose logs -f synapse

# Check if Synapse is healthy
curl http://localhost:8008/_matrix/client/v3/versions

# Shell into Synapse container
./backend/connect_synapse.sh
```

---

## What Breaks If Synapse Stops

- Users cannot log in
- Messages cannot be sent or received
- Element Web shows "Cannot reach homeserver"
- All API calls from the browser fail with network errors

PostgreSQL continues running — all data is preserved.

---

## Related Documents

- [PostgreSQL](./postgresql.md)
- [System Overview](../Architecture/system-overview.md)
- [Docker Containers](../Docker/containers.md)
- [Nginx Proxy](../Nginx/proxy.md)
- [ADR-0001: Matrix Synapse as Backend](../ADRs/0001-matrix-synapse-as-backend.md)
