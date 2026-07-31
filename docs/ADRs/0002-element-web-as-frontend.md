# ADR-0002: Element Web as the Frontend Client

**Date:** 2026-07-30
**Status:** Accepted

---

## Context

We need a browser-based UI for users to interact with the Matrix homeserver. The interface must be customizable for Uzbekistan government branding, support Uzbek and Russian languages, and look professional.

---

## Decision

Use **Element Web** as the frontend, modified in source.

**Why:**
- It is the official reference client for Matrix — the most complete and best-tested
- Full source code is available and modifiable (Apache 2.0 license)
- Supports all Matrix features: E2E encryption, threads, file uploads, reactions, voice/video calls
- Built with React + TypeScript — well-understood, large ecosystem
- Has an existing i18n (internationalization) system ready to add Uzbek translations
- Can be built with webpack and deployed as static files — no server-side runtime needed

**Alternatives rejected:**
- **Cinny** (lighter Matrix client): lacks some features (threads, E2E key management UI)
- **FluffyChat**: mobile-first, not ideal for desktop government use
- **Building from scratch**: prohibitively complex and time-consuming

---

## Related Documents

- [Element Web Customization](../Frontend/element-customization.md)
- [ADR-0005: Telegram UI Theme](./0005-telegram-ui-theme.md)
