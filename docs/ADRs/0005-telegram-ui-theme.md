# ADR-0005: Telegram Web Z/K as the UI Design System

**Date:** 2026-07-31
**Status:** Accepted

---

## Context

Element Web's default design uses a blue/white/light-grey color scheme that looks like generic enterprise software. Government staff who use modern messaging apps daily (especially Telegram, which is ubiquitous in Uzbekistan) would find the default Element UI unfamiliar and harder to adopt.

---

## Problem

The default Element Web visual design:
- Does not feel familiar to Uzbekistan government staff
- Uses a light theme by default (hard to read for long periods)
- Does not convey the premium, serious aesthetic appropriate for a government tool

---

## Decision

Style Sovereign Messenger to closely resemble **Telegram Web (Z/K dark theme)**.

Telegram is extremely familiar to Uzbekistan government staff — it is the dominant messaging app in the country. A Telegram-like visual experience dramatically reduces the learning curve.

**Design choices:**

| Element | Value | Reasoning |
|---------|-------|-----------|
| Sidebar bg | `#17212b` | Telegram's exact sidebar color |
| Canvas bg | `#0e1621` | Telegram's exact chat area color |
| Incoming bubble | `#182533` | Telegram received message |
| Outgoing bubble | `#2b5278` | Telegram sent message |
| Accent | `#5288c1` | Telegram's blue |
| Avatars | `border-radius: 50%` | Circular like Telegram |

**Implementation:**
All overrides in a single file: `res/css/_sovereign.pcss`. This overrides both the new Compound Design System CSS variables (`--cpd-color-*`) and the legacy Element theme variables (`--accent`, `--roomlist-*`, etc.).

**Why not change React components?**
CSS overrides are far less invasive than modifying React component JSX. If we update Element Web to a newer version in the future, CSS overrides are easy to reapply. Component-level changes would create large merge conflicts.

---

## Advantages

- Familiar UX for Uzbekistan government staff (Telegram users)
- Dark theme reduces eye strain for all-day use
- Implemented entirely in CSS — no React component changes
- Easily maintained: one file, clearly organized
- Upgradeable: CSS overrides survive Element Web updates

## Disadvantages

- CSS class names in Element Web can change between versions — some overrides may break on upgrade
- Compound Design System (`--cpd-*`) variables and legacy variables coexist, requiring double overrides

---

## Related Documents

- [Element Web Customization](../Frontend/element-customization.md)
- [Theming](../Frontend/theming.md)
