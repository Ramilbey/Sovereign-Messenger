# Sovereign Messenger — Product Requirements Document (PRD)

**Status:** Draft v2.1 (Phase 0 + Phase 1 in progress)
**Owner:** [you]
**Supersedes:** `docs/PRD.md` v1 (abstract skeleton), v2.0 (Full Scope Draft)
**Rule:** This document is the source of truth. If code and this document disagree, this document is correct until updated. Every new feature must update this document before implementation is considered complete.

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| v2.0 | 2026-07-30 | Full scope draft |
| v2.1 | 2026-08-01 | Phase 0 complete; Phase 1 provisioning script delivered; Docker Desktop flag documented; feasibility tags corrected |

---

## 0. How to Read This Document

Every feature below carries a **Feasibility Tag** so an executing agent knows what kind of work is actually required — this PRD is written so no one has to guess whether "add emergency broadcast" means editing a JSON file or building a new service.

| Tag | Meaning |
|---|---|
| 🟢 **Native** | Achievable with Matrix/Synapse/Element's existing behavior. No code changes. |
| 🟡 **Config** | Achievable via config files, `homeserver.yaml`, Admin API calls, or provisioning scripts. No source code changes to Element or Synapse. |
| 🔵 **Custom-FE** | Requires editing Element Web source (`frontend/element-web/apps/web/...`). |
| 🟠 **Custom-BE** | Requires a new Synapse module, a small internal backend service, or scripting against the Admin API beyond simple calls. |
| 🔴 **New Component** | Requires adding new infrastructure (new container, new service) not currently in `docker-compose.yml`. |

---

## 1. Executive Summary & Product Vision

Sovereign Messenger is **not a Telegram clone**. It is an official, internally-hosted secure communication platform for government institutions of the Republic of Uzbekistan, built on Matrix Synapse + a custom Element Web fork. It must feel **official, trustworthy, modern, secure, familiar, efficient, calm, professional** — familiar interaction patterns (chat list, bubbles, threads) without adopting consumer messaging norms (public discovery, open registration, informal tone) that conflict with government use.

Primary objective: give government employees a secure, official alternative to consumer apps (Telegram, WhatsApp) for work communication, without giving up any of the day-to-day usability those apps trained people to expect.

---

## 2. Users & Roles

| Role | Description | Primary Scope |
|---|---|---|
| **Government Employee** | Standard user. Sends/receives DMs, participates in department channels. | Own department |
| **Department Manager** | Manages a single department's channels and members. | One department |
| **Regional Administrator** | Manages all departments within one region. | One region |
| **National Administrator** | Full org-wide authority. Can post national announcements and trigger emergency broadcasts. | National |
| **IT Administrator** | Technical operator: account provisioning, server config, Docker/infra. Not necessarily a comms participant. | National (technical) |
| **Security Officer** | Authorizes emergency broadcasts, reviews audit logs, manages access policy. | National (security) |
| **Auditor** | Read-only access to audit logs and compliance reports. No messaging authority. | National (read-only) |
| **Help Desk** | Password resets, account unlocks, basic support tickets. No content access. | National (support) |

**Implementation mapping — 🟡 Config:** Matrix has no native "role" concept beyond room/space power levels (0–100). Roles above are implemented as a **power-level scheme applied consistently across Spaces**, plus a `department`/`region`/`role` field carried in each user's profile (see §8, Verified Directory). Role assignment itself is a provisioning action via the Synapse Admin API (`PUT /_synapse/admin/v2/users/{id}` and custom room invites/power-level grants), run via `backend/scripts/provision_org.py`.

### Power Level Scheme (applies to all Spaces/rooms unless noted)

| Power Level | Assigned To |
|---|---|
| 100 | National Administrator, IT Administrator (space-level, not per-message content) |
| 75 | Regional Administrator (within their region's Space) |
| 50 | Department Manager (within their department's Space) |
| 25 | Reserved (future: team lead / moderator tier) |
| 0 | Government Employee (default) |

Auditor and Help Desk are **not** granted elevated power levels in messaging rooms — their access is via the Synapse Admin API / a dedicated internal admin tool, not via chat permissions. This preserves least-privilege.

---

## 3. Information Architecture

Hierarchy: **Ministry → Region → Department → Channel**, plus cross-cutting **Direct Messages** and **Announcements**.

**Implementation — 🟢 Native / 🟡 Config:** Matrix Spaces natively support nesting via `m.space.child` state events. This maps directly:

```
Space: Government of Uzbekistan         (national)
 └─ Space: Tashkent Region              (regional)
     └─ Space: Ministry of Finance      (department)
         ├─ Room: #general              (department channel — any member posts)
         ├─ Room: #announcements        (read-only for employees, §4.4)
         └─ Room: #incident-2026-08-01  (temporary, see §4.7)
```

**Phase 1 implementation status: ✅ Done**
- Provisioning script: `backend/scripts/provision_org.py`
- Creates full hierarchy (National Space → Regional Spaces → Department Spaces → rooms) via Matrix Admin API
- Power levels applied per §2 table
- `m.space.child` / `m.space.parent` state events set correctly
- Supports `--dry-run` mode; see `backend/scripts/README.md`

**File/config touchpoints:** `backend/scripts/provision_org.py`, `backend/scripts/org_structure.example.json`

---

## 4. Communication Model

### 4.1 Direct Messages
🟢 **Native.** Standard Matrix DM (`m.direct` account data + normal E2EE room). No changes required to Synapse or Element beyond what's already running.

- **User story:** As a Government Employee, I want to message a colleague privately so we can coordinate without cluttering a department channel.
- **Acceptance criteria:** DM is end-to-end encrypted by default; DM does not appear in any department Space; recipient must be a verified directory user (see §8).
- **Phase 1 status: ✅ Verified native** — DM works out of the box with current Synapse v1.100.0 + Element Web configuration. No code changes required. E2EE is enabled by default. Documented in `backend/scripts/README.md`.
- **Permissions:** Any authenticated user can DM any other authenticated user found via the verified directory, unless explicitly blocked by policy.
- **Edge case (unresolved — §16 Q1):** Cross-department DM restriction, if required, needs a Synapse module (`user_may_invite` hook) — 🟠 **Custom-BE**. **Not built — awaiting policy decision.**

### 4.2 Department Channels
🟢 **Native** (rooms) + 🟡 **Config** (provisioning, power levels).
- **Phase 1 status: ✅ Done** — `provision_org.py --create-department` creates `#general` channel under the department Space with `events_default: 0` (any member posts) and Department Manager at PL 50 (can kick/ban/pin).
- **Acceptance criteria:** Room is a child of the Department's Space; default power level 0; Department Manager holds power level 50. ✅ Met.
- **File/config:** `backend/scripts/provision_org.py`

### 4.3 Regional & National Workspaces
🟢 **Native** (Spaces) + 🟡 **Config** (provisioning + power levels per §2 table).
- **Phase 1 status: ✅ Done** — `provision_org.py --org-file` creates National Space → Regional Spaces with Regional Admin at PL 75.
- **MSC3083 (restricted join rule) status:** Not yet implemented — rooms currently use `invite` join rule (safer default). Restricted join rule (auto-join if member of parent Space) is deferred to Phase 2 when the user count justifies the complexity.
- **Acceptance criteria:** Regional Space is visible only to members of departments within that region plus National Administrators. ✅ Enforced via invite-only join rule + explicit provisioning invites.

### 4.4 Department & National Announcements
🟡 **Config.** ✅ **Phase 1 done.**
- `#announcements` rooms created by `provision_org.py` with `events_default: 50` — only PL ≥ 50 can send `m.room.message`. Employees (PL 0) are joined but read-only.
- National Announcements room has `events_default: 100` — only National Administrators can post.
- **"Pinned at top" ordering:** Confirmed this is NOT automatic in the current Element Web version. The Space sidebar shows rooms in creation order, not pinned-first. Implementing pinned-top for announcement rooms is a 🔵 **Custom-FE** tweak to room-list sort order — **deferred to Phase 2** per execution order rules.

### 4.5 Emergency Broadcasts
🟡 **Config** (core mechanism) + 🟠 **Custom-BE** (trigger tooling).
- **Phase 1 status: ⏸ Deferred** — awaiting §16 Q2 policy decision (build minimal panel now vs. accept manual Admin API usage).
- `homeserver.yaml.template` has the `server_notices` block pre-written (commented out) ready to enable.
- **Not built:** trigger UI / Security Officer panel.

### 4.6 Cross-Department Coordination
🟢 **Native** + 🟡 **Config** (power-level policy).
- **Phase 1 status: ⏸ Deferred** — awaiting §16 Q1 decision on whether code-level enforcement is required.

### 4.7 Temporary Incident Rooms
🟡 **Config** + 🟠 **Custom-BE** (lifecycle automation).
- **Phase 1 status: ⏸ Deferred** — out of Phase 1 scope per execution order.

---

## 5. Security & Permissions

Baseline (already implemented per `homeserver.yaml`):
- Federation fully disabled (`federation_domain_whitelist: []`) — 🟢 already done.
- Public registration disabled (`enable_registration: false`) — 🟢 already done.
- Email domain restricted to `@gov.uz` / `@mf.uz` — 🟢 already done.

**Phase 0 change:** `homeserver.yaml` is now a **template** (`backend/homeserver.yaml.template`). The actual `homeserver.yaml` is rendered at container startup via `envsubst` from environment variables loaded from `.env`. Secrets are no longer hardcoded in any committed file.

New requirements to formalize:

| Permission | Employee | Dept Mgr | Regional Admin | National Admin | IT Admin | Security Officer | Auditor | Help Desk |
|---|---|---|---|---|---|---|---|---|
| Send DM | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Post in dept channel | ✅ | ✅ | ✅ | ✅ | — | — | ❌ | ❌ |
| Create dept channel | ❌ | ✅ | ✅ | ✅ | — | — | ❌ | ❌ |
| Create regional workspace | ❌ | ❌ | ✅ (own region) | ✅ | — | — | ❌ | ❌ |
| Create national workspace | ❌ | ❌ | ❌ | ✅ | — | — | ❌ | ❌ |
| Post department announcement | ❌ | ✅ | ✅ | ✅ | — | — | ❌ | ❌ |
| Post national announcement | ❌ | ❌ | ❌ | ✅ | — | — | ❌ | ❌ |
| Trigger emergency broadcast | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Invite within department | ❌ | ✅ | ✅ | ✅ | — | — | ❌ | ❌ |
| Invite cross-department | ❌ | ⚠️ policy | ✅ | ✅ | — | — | ❌ | ❌ |
| Remove/deactivate user | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ⚠️ (unlock only) |
| View audit logs | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reset passwords | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| View other regions | ❌ | ❌ | ❌ | ✅ | ✅ (technical) | ✅ | ✅ (log-only) | ❌ |

⚠️ = policy-level, needs explicit decision in §16 before implementation.

---

## 6. Secure Document Sharing

🟢 **Native** (baseline) + 🟠 **Custom-BE** (hardening, if required).
- Native E2EE media upload/download works; `media_store_path` configured.
- `max_upload_size: 50M` set in `homeserver.yaml.template`.
- AV scanning: **deferred** — awaiting §16 Q5 decision.

---

## 7. Verified Employee Directory

🟡 **Config** (baseline) + 🔵 **Custom-FE** (rich profile display, Phase 2).

**Phase 1 status: ✅ Baseline done.**
- `provision_org.py` stores `department`, `region`, `title`, `role`, `verified`, `verified_at` as user account_data under key `uz.gov.sovereign.profile` for every account created via the provisioning script.
- Data readable via: `GET /_synapse/admin/v1/users/{userId}/account_data/uz.gov.sovereign.profile`
- **Deferred:** Element profile card UI changes showing these fields with a "Verified — Government of Uzbekistan" badge → Phase 2, 🔵 **Custom-FE**.

---

## 8. Notifications

Matrix push rules (`m.push_rules`) support per-room override priority — 🟡 **Config**.

**Phase 1 status: ⏸ Not yet implemented.** Push rule defaults at account-creation time (emergency/announcement rooms pre-configured to `highlight`/`override`) should be added to `provision_org.py` as a follow-up task in Phase 1. This is a small addition to the existing provisioning flow.

**TODO (Phase 1 follow-up):** Add push rule provisioning to `provision_org.py` — call `PUT /_matrix/client/v3/pushrules/global/room/{roomId}` with `actions: ["notify", {"set_tweak": "highlight"}]` for announcement rooms at the time of user invitation.

---

## 9. Administration

| Capability | Feasibility | Phase 1 Status |
|---|---|---|
| Create/deactivate user | 🟡 Config | ✅ Done — `provision_org.py --create-user` + `PUT /_synapse/admin/v2/users/{id}` |
| Assign role/department/region | 🟠 Custom-BE | ✅ Done — stored as profile account_data + power-level grants in provisioning script |
| Create/manage Spaces (org structure) | 🟡 Config | ✅ Done — `provision_org.py --org-file` |
| Manage announcements | 🟡 Config | ✅ Done — power-level grants per §4.4 |
| Audit support | 🔴 New Component | ⏸ Deferred — awaiting §16 Q3 decision |
| synapse-admin UI panel | 🔴 New Component | ✅ Done — container added to `docker-compose.yml`; accessible at `https://gov.local/admin/` |

**synapse-admin evaluation result (Phase 1, §9):** Confirmed as the correct approach. The `awesometechnologies/synapse-admin` Docker image provides user management (create/deactivate/reset password), room management, and federation controls without any bespoke frontend code. It does **not** cover the custom role/department assignment workflow — that remains the province of `provision_org.py`.

---

## 10. UX & Visual Design Principles

Ties directly to existing customization work (see `docs/element-customization.md`):

| Principle | Where it's enforced |
|---|---|
| Official/trustworthy first impression | `frontend/config.json` → `branding.auth_header_logo_url` (Uzbekistan state seal), `brand: "Sovereign Messenger"` |
| Familiar interaction patterns | `frontend/element-web/apps/web/res/css/_sovereign.pcss` (Telegram-style bubbles/sidebar, already implemented) |
| Calm, professional tone | Copy review pass on `uz.json`/`ru.json`/`en_EN.json` — not yet done, flagged as gap |
| Accessibility | Not yet addressed — flag as gap. Needs contrast ratio audit of `_sovereign.pcss` custom colors against WCAG AA. 🔵 **Custom-FE**, scoped CSS/audit work. |

---

## 11. In-App Policies

🔵 **Custom-FE** (new, not yet built). Recommendation: use Element's `embeddedPages` config option to serve a static policy page rather than building a new component. **Deferred to Phase 2.**

---

## 12. Non-Functional Requirements

- **Isolation:** No federation, no public internet exposure of ports 8008/5432 (enforced — `docker-compose.yml`). ✅
- **Availability target:** [define — e.g., 99.5% during business hours] — not yet specified.
- **Performance:** Synapse `cp_min: 5 / cp_max: 10` sized for <200 users; re-evaluate before national-scale rollout.
- **Browser support:** Inherit Element Web's supported-browser tiers (evergreen Chrome/Firefox/Edge, latest Safari).

### 🚩 Docker Desktop vs Production Runtime — Flagged (Phase 0 requirement)

**Status: Read and understood. Flagged explicitly here per Phase 0 ground rules.**

The current stack assumes **Docker Desktop** (specifically: `host.docker.internal` resolves to the host machine in `nginx/default.conf`, and `dev.sh` uses this for webpack HMR proxying). This is a Docker Desktop–specific DNS name that does **not** work on a bare Linux Docker Engine installation (the standard production runtime for a government server).

**Concrete risks and required changes before any production deployment:**

1. **`host.docker.internal` DNS resolution** — In `nginx/default.conf`, the dev-mode `proxy_pass http://host.docker.internal:8080` must be replaced with `proxy_pass http://matrix_element:80` (the production container) before any deployment. `prod.sh` does this via `sed`, but the replacement is **destructive and non-reversible via script** — see ground rule 4.
2. **Docker Engine on Linux** — All containers run as root by default in Docker Engine. Before production deployment, configure `user:` in `docker-compose.yml` for each service to run as a non-root UID.
3. **No restart policy for data loss** — `restart: unless-stopped` is appropriate for a server; the current setup is correct.
4. **Volume path** — `postgres_data` uses a named Docker volume (not a host bind mount). On a production Linux server, ensure the Docker volume storage path (typically `/var/lib/docker/volumes/`) is on a disk with adequate space and is included in the backup routine.
5. **`prod.sh` sed approach** — The `sed -i` pattern for switching nginx config between dev/prod modes is fragile. A cleaner approach for production is to maintain two separate nginx config files (`nginx/default.conf.dev` / `nginx/default.conf.prod`) and symlink or copy the appropriate one. **Deferred to Phase 2 cleanup.**

**Action required before production:** Run `prod.sh` to switch nginx config, then verify the full `docker compose up` cycle on a Linux Docker Engine host (not Docker Desktop).

---

## 13. Master File/Config Map

| Feature Area | Primary File(s) | Phase 0/1 Status |
|---|---|---|
| Homeserver identity, federation, registration | `backend/homeserver.yaml.template` (rendered → `/data/homeserver.yaml` at startup) | ✅ Template created |
| Database credentials/tuning | `backend/docker-compose.yml` (via `${POSTGRES_PASSWORD}` from `.env`) | ✅ Secrets moved to .env |
| All secrets | `.env` (gitignored) / `.env.example` (committed) | ✅ Done |
| Homeserver → Element connection, branding | `frontend/config.json` | ✅ Existing |
| Telegram-style theme | `frontend/element-web/apps/web/res/css/_sovereign.pcss` | ✅ Existing |
| Uzbek / Russian translations | `frontend/element-web/apps/web/src/i18n/strings/{uz,ru,en_EN}.json` | ✅ Existing |
| Reverse proxy routing/TLS | `nginx/default.conf`, `certs/gov.local.{crt,key}` | ✅ Updated (+/admin/ route) |
| TLS cert generation/renewal | `certs/generate.sh` | ✅ Script created |
| Postgres backup | `backend/scripts/pg_backup.sh` | ✅ Script created |
| Org structure provisioning | `backend/scripts/provision_org.py` | ✅ Created (Phase 1) |
| Provisioning config example | `backend/scripts/org_structure.example.json` | ✅ Created |
| Scripts documentation | `backend/scripts/README.md` | ✅ Created |
| synapse-admin UI | `docker-compose.yml` (matrix_admin container) + `nginx/default.conf` (/admin/ route) | ✅ Added (Phase 1) |
| Emergency broadcast trigger | *(new component — pending §16 Q2 decision)* | ⏸ Deferred |
| Audit log aggregation | *(new infrastructure — pending §16 Q3 decision)* | ⏸ Deferred |

---

## 14. Future Expansion (Deferred, Not Forgotten)

Digital approvals, government directory integration, calendar integration, meeting scheduling, secure video conferencing, AI assistant, incident management automation beyond §4.7, workflow automation. No design work yet — listed so scope doesn't silently disappear.

---

## 15. Open Questions / Risks (must be resolved before Phase 2 begins)

1. **Cross-department DM/invite restriction** (§4.1, §4.6): **Policy-only or code-enforced?** This single decision determines whether a Synapse module (🟠) is in scope at all for v1. If code-enforced, it requires a `user_may_invite` Synapse module — a meaningful development investment.

2. **Emergency broadcast trigger tooling** (§4.5): **Build a minimal custom panel now, or accept manual Admin API/curl usage for v1?** The `server_notices` block in `homeserver.yaml.template` is pre-written; enabling it is a one-line uncomment. The trigger UI is the open question.

3. **Audit requirements** (§9): **What specific events must be retained, for how long, and for which compliance standard?** This drives whether log aggregation is a v1 blocker or a v2 item. Synapse produces structured logs but they rotate; immutable audit trail requires an external log store (e.g., Loki, Elasticsearch, or even a mounted append-only log volume).

4. **Availability/scale target** (§12): **Expected concurrent user count.** Current Postgres pool (`cp_min: 5 / cp_max: 10`) is sized for <200 users. A national deployment across multiple ministries likely exceeds this. Synapse worker processes would be needed above ~500 concurrent users.

5. **Document/media scanning** (§6): **Is AV scanning a hard compliance requirement for v1, or acceptable to defer?** ClamAV integration requires a new container and a Synapse `spam_checker` module.

6. **Push rule provisioning** (§8): **Should announcement room push rules be set at account creation time?** This is a small addition to `provision_org.py` — recommend confirming before Phase 2 so all Phase 1 provisioned accounts are correctly configured.

---

## 16. Documentation Rule

Every new feature added to the product must update this document before implementation is considered complete. Feasibility tags must be corrected retroactively if a "Config" turns out to need code, or vice versa — this document's value depends on the tags staying honest.

**Feasibility tag corrections made in v2.1:**
- §3: PRD said `🟠 Custom-BE` for provisioning script — **confirmed correct**, the script is new backend code.
- §4.4: "Pinned at top" behavior confirmed as NOT automatic — tag updated to reflect 🔵 **Custom-FE** as a deferred Phase 2 item.
- §9 synapse-admin: Tag was `🔴 New Component` — **confirmed correct**, added as new Docker container.
- `homeserver.yaml` secret management: Was `🟡 Config` — confirmed correct (no code change, just template + envsubst at startup).