# Sprint 3 Milestone 3 — Acceptance Evidence

| Field | Value |
|---|---|
| **Milestone** | M3 — Structured Product (Readiness Review phase P2) |
| **Date** | 2026-08-05 |
| **Definition of Done** | Readiness Review §18: AC-14, AC-17 pass · second department added by configuration only · conversation list replaces the selection control · breadcrumbs navigable at every level · all three breakpoints functional · AC-29 passes · regression checklist passes |

Acceptance strategy §15.3 requires every criterion to produce a recorded
artefact. This document is the record. Everything in it is reproducible:

```bash
cd frontend/element-web/apps/web && npx vitest run --config vitest.sovereign.config.ts
```

---

## 1. Summary

| Gate | Result |
|---|---|
| Sovereign acceptance and regression suite | **81 passed / 81** |
| TypeScript, Sovereign scope | **0 errors** (vendored Element tree: 2034, pre-existing, unchanged) |
| Production webpack build | **succeeds** — `pnpm --filter element-web build`, 1m 55s |
| Milestone 3 code present in the shipped bundle | **verified** |
| Protected systems modified | **none** |

Suite composition:

| File | Tests | Covers |
|---|---|---|
| `organisation.test.ts` | 10 | AC-14, ORG-1 – ORG-8, IA-1 – IA-5, ES-5 |
| `conversations.test.ts` | 14 | NAV-2, NAV-3, IA-6 – IA-8, NT-1, NT-2, NT-6, FR-44, FR-45, COM-2, COM-4, PERF-10, EDGE-1, EDGE-6 |
| `timeline.test.ts` | 16 | FR-32 – FR-37, COM-5, COM-8, EDGE-2, EDGE-15, ST-38, ST-40 |
| `surfaces.test.tsx` | 25 | Rendered behaviour: FR-32, FR-35 – FR-37, FR-43, FR-45, NAV-5, IA-6, IA-8, COM-3, A11Y-1, A11Y-5, ES-2, ES-4, PERF-9 |
| `regression.test.tsx` | 16 | Readiness Review §14 checklist, AC-17, AC-25, AC-29, UI-18, UI-19, NAV-10, ST-23 |

### Suite integrity

A test suite that cannot fail is not evidence. Two defects found during review
were deliberately reintroduced and the suite was re-run:

| Defect reinstated | Result |
|---|---|
| Permission notice announced on the fallback→known transition | `× says nothing when the room's answer merely arrives` |
| Timeline render window removed | `× puts a bounded number of messages in the document` |

Both were caught; both mutations were then reverted and the suite returned to
81/81.

---

## 2. Milestone 3 Definition of Done

### AC-14 — a second department, by configuration only

`Jinoyat qidiruv` exists **only** in `organisation.config.json`. No source file
names it.

| Evidence | Result |
|---|---|
| Resolves by display name | `resolvePosition("Jinoyat qidiruv") → jinoyat_qidiruv_workspace` |
| Resolves by organisational code | `resolvePosition("SAM-IIB-JQ") → jinoyat_qidiruv_workspace` |
| Renders at full depth | `uz > samarqand > sam_iib > jinoyat_qidiruv > jinoyat_qidiruv_workspace` |
| Carries its own module set (ORG-6, IA-12) | 12 modules against Tergov's 17; the five investigation modules are absent |
| Present in the built bundle | `jinoyat_qidiruv` found in 2 bundle files |

Depth and breadth are not special-cased: a synthetic 20-level hierarchy renders
with a 20-entry path (ORG-3, IA-2).

### AC-17 — three breakpoints

| Viewport | Breakpoint | Conversation column | Dominant? |
|---|---|---|---|
| 768px (standard minimum) | standard | 412px | ✅ |
| 1279px (standard maximum) | standard | 923px | ✅ |
| 1280px (wide minimum) | wide | 460px | ✅ |
| **1366×768 (NFR-2 minimum workstation)** | wide | 546px | ✅ |
| 1366 + work module open | wide | 513px | ✅ |
| 1920px | wide | 1100px | ✅ |

Boundary resolution is asserted in `regression.test.tsx` at 767/768/1280/1366.

Two defects were found here during review and fixed:

- **At 768px the frame overflowed the viewport** — sidebar (240px) plus
  conversation list (300px) left the conversation column at **−52px**. The
  sidebar is now an icon rail across the standard range.
- **On the 1366×768 minimum workstation the conversation was the narrowest
  column** (266px against 300px for the list). UI-14 permits **one** supporting
  panel at wide; opening either now closes the other.

### AC-29 — a permission change without a reload

| Scenario | Expected | Result |
|---|---|---|
| Posting rights withdrawn mid-session | composer replaced, one neutral sentence, no reload | ✅ `postingRevoked` reported, `canPost` false |
| Room's answer merely arrives after the role fallback | **no** change announced | ✅ `change` is null |
| Composed text during the change | preserved | ✅ drafts are held per conversation, independent of the composer |

The second row is the defect review found: the least-privilege fallback
resolving to real rights is the ordinary first-load path, and announcing it as
a change is a misstatement about a user's authority.

### Conversation list replaces the selection control

`<select>` occurrences in `ChatArea.tsx`: **0**. The list is a column of the
application frame, grouped favourites-first then by type, ordered by recent
activity or name, filterable by type, with a distinct filtered-empty state that
offers the way back.

### Breadcrumbs navigable at every level

Every level renders as a control; activating an intermediate level navigates to
it (`onSelectNode("samarqand")`). A path deeper than the visible limit collapses
its middle behind one control.

---

## 3. Requirements completed in this closing pass

| Requirement | Delivered | Evidence |
|---|---|---|
| **FR-36** timeline pagination | Backward paging with scroll-position preservation | 5 tests: page size bounded ≤40, reaches start and stops, concurrent requests collapsed, requests on reaching top, progress shown |
| **EDGE-2 / PERF-9** virtualisation | 150-message render window over the loaded model | 3,000 messages → fewer than 300 bubbles in the document, newest visible |
| **FR-37 / CMP-27** unread divider | Boundary captured on entry, drawn above the first unread | 3 tests: drawn, absent when all read, not opened by the reader's own message |
| **FR-45 / CMP-12** member list | Real room membership, joined→invited→departed then by name | 7 tests including EDGE-6 departed participants and COM-2 read-only marking |
| **RightPanel** M3 scope | Presents the open conversation's real participants | Replaces the fabricated staff list |

---

## 4. Regression checklist (Readiness Review §14)

| # | Check | Method | Result |
|---|---|---|---|
| 1 | Sign-in succeeds | Not exercised — see §5 | ⚠️ |
| 2 | Session restore on reload | Not exercised — see §5 | ⚠️ |
| 3 | Message send succeeds | Automated: send routes to the named conversation | ✅ |
| 4 | Message receive succeeds | Automated: room messages reach a timeline subscriber | ✅ |
| 5 | Two-user realtime delivery | Not exercised — see §5 | ⚠️ |
| 6 | Conversation switching preserves state | Automated: per-conversation drafts held and restored | ✅ |
| 7 | Demo Mode operational | Static: no Demo Mode file modified since Sprint 3 entry | ✅ |
| 8 | One client, one sync loop | Automated: services are singletons; neither creates a client nor starts sync | ✅ |
| 9 | No protected system modified | Static: 0 files under bridge, peg, session, bootstrap, Synapse, nginx | ✅ |
| 10 | No fixture data in Production Mode | Static + automated: production paths resolve to real data or the unavailable state | ✅ |
| 11 | No layer boundary violation | Static: 0 runtime service imports added to components | ✅ |
| 12 | No platform SDK import in UI or hooks | Static: SDK confined to `services/` and `bridge/` | ✅ |

---

## 5. What has **not** been executed, and why

Acceptance strategy §15.2 requires Production Mode, against the live
homeserver, on minimum specification hardware, with at least two concurrent
real users. **That environment does not exist in this workspace.** No
homeserver is reachable and no browser session is available.

The following therefore remain outstanding and are **not** claimed as passed:

| Item | Requirement | Why it cannot be run here |
|---|---|---|
| Sign-in and session restore | §14.1, §14.2 | Needs a live homeserver and a browser |
| Two-user realtime delivery | §14.5 | Needs two authenticated sessions |
| Two-role validation as Xodim and Rahbar | §15.4 | Blocked on Readiness Review decision #4 — a means of setting role data — which remains unresolved |
| Visual confirmation at three breakpoints | AC-17 | Widths are asserted arithmetically and by unit test; no screenshots |
| Performance on minimum specification hardware | §15.2 | Measurements here are from the development machine |

What has been done in their place: the logic beneath each is exercised against
a controlled stand-in for the synchronised client, and the whole application
compiles into a deployable production bundle. That is strong evidence of
correctness; it is **not** the environmental acceptance the PRD defines, and
should not be recorded as such.

**These five items require a pilot environment and a QA pass before Sprint 3
acceptance (§15.5).** They are environmental, not outstanding development work.

---

## 6. Known limitations carried forward

Recorded so the boundary is explicit.

| Item | Status |
|---|---|
| Sender role for other participants (FR-34) | No source exists; blocked on role provisioning (R-6, FUT-15) |
| Presence in the member list and staff panel (FR-13, FR-17) | Presence capability is D-7, delivered in Milestone 4 |
| State Emblem (UI-8) | Region reserved; no approved asset exists (branding deliverable D-2) |
| Global search (NAV-4, SR-1 – SR-11) | Assigned to P4 / Milestone 5 |
| Unread aggregation to module and organisation level (NT-1) | Per-conversation counts delivered; aggregation is P4 / Milestone 5 |
| Density control at the compact breakpoint | The panel hosting it is not present at compact; the preference persists from wider layouts |
| Demo-Mode-only module views | Retain emoji and literal colour — Readiness Review §7: *no redesign in Sprint 3* |
