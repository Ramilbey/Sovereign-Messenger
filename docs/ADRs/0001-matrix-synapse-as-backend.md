# ADR-0001: Matrix Synapse as the Backend Homeserver

**Date:** 2026-07-30
**Status:** Accepted

---

## Context

Sovereign Messenger requires a secure, self-hosted messaging backend that can handle user accounts, encrypted messages, room management, and file uploads — all without relying on any external cloud service.

---

## Problem

Building a messaging server from scratch that handles end-to-end encryption, real-time event distribution, and persistent message storage would take years and introduce significant security risk.

---

## Options Considered

### Option A: Build a custom messaging API

A bespoke REST API server (e.g., Node.js + WebSockets).

**Why rejected:** Building secure end-to-end encryption from scratch is an extremely hard cryptographic problem. Any mistake could expose government communications. The maintenance burden would be enormous.

### Option B: Use Matrix Synapse

An open-source Matrix homeserver, written in Python, maintained by Element (the company behind Matrix).

**Why chosen:**
- Implements the Matrix protocol — an open, peer-reviewed standard
- End-to-end encryption (using Signal's Double Ratchet algorithm, adapted for Matrix as MegOlm) is built in and battle-tested
- Active open-source community; security vulnerabilities are found and patched quickly
- Fully self-hostable — zero dependency on any external service
- Federation can be completely disabled for total isolation
- Mature admin API for user management

### Option C: Use a commercial solution (e.g., Rocket.Chat, Mattermost)

**Why rejected:** These are SaaS-first products with self-hosted options that often require paid licenses for enterprise features. More importantly, they do not implement the open Matrix protocol, so there is no standard client to customize (like Element Web).

---

## Decision

Use **Matrix Synapse v1.100.0** as the homeserver.

---

## Advantages

- Security: end-to-end encryption by default, well-audited
- Isolation: federation disabled (`federation_domain_whitelist: []`)
- Open standard: Matrix Client-Server API is documented and stable
- User management: admin API and CLI tools
- File storage: built-in media repository

## Disadvantages

- Resource usage: Synapse is written in Python (Twisted async) and can use significant RAM (250MB+) on startup
- Complexity: homeserver.yaml has many configuration options
- PostgreSQL dependency: cannot use SQLite in production (requires separate database container)

## Future Considerations

- Dendrite (Matrix's Go implementation) is lighter weight and could replace Synapse if performance becomes a concern
- Synapse workers (multi-process mode) can be enabled for high user counts (> 500 concurrent users)

---

## Related Documents

- [Synapse Homeserver](../Backend/synapse.md)
- [System Overview](../Architecture/system-overview.md)
