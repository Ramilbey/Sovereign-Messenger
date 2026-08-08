# Sprint 3 — Acceptance Evidence

| Field | Value |
|---|---|
| **Sprint** | Sprint 3 — Product Realisation |
| **Milestone** | M5 — Sprint 3 Complete (Readiness Review phase P4) |
| **Date** | 2026-08-08 |
| **Specification** | `SPRINT_3_PRODUCT_REQUIREMENTS.md` v1.1 |
| **Plan** | `SPRINT_3_READINESS_REVIEW.md` v1.0 |

Acceptance strategy §15.3 requires every criterion to produce a recorded
artefact. This document is the record. Everything in it is reproducible:

```bash
cd frontend/element-web/apps/web && npx vitest run --config vitest.sovereign.config.ts
```

```bash
cd frontend/element-web/apps/web && npx vitest run --config vitest.live.config.ts
```

The live suite needs the disposable homeserver described in
[sprint-3-acceptance-environment.md](sprint-3-acceptance-environment.md).

---

## 1. Summary

| Gate | Result |
|---|---|
| Sovereign offline acceptance and regression suite | **175 passed / 175** |
| Live two-user suite, real homeserver, two authenticated sessions | **32 passed / 32** |
| TypeScript, Sovereign scope | **0 errors** (vendored Element tree unchanged) |
| Production webpack build | **succeeds** — `pnpm --filter element-web build` |
| Protected systems modified | **none** |

### Offline suite composition

| File | Tests | Covers |
|---|---|---|
| `organisation.test.ts` | 10 | AC-14, ORG-1 – ORG-8, IA-1 – IA-5, ES-5 |
| `conversations.test.ts` | 14 | NAV-2, NAV-3, IA-6 – IA-8, NT-1, NT-2, NT-5, FR-44, FR-45, COM-2, PERF-10, EDGE-1 |
| `timeline.test.ts` | 16 | FR-32 – FR-37, COM-5, COM-8, EDGE-2, EDGE-15, ST-38, ST-40 |
| `surfaces.test.tsx` | 25 | Rendered behaviour of the structure surfaces; A11Y-1, A11Y-5, ES-2, ES-4, PERF-9 |
| `presence.test.ts` | 9 | FR-12 – FR-17, ST-6 – ST-10 |
| `attachments.test.tsx` | 18 | FR-23 – FR-30, EDGE-4, EDGE-8, EDGE-16 |
| `search.test.tsx` | 13 | SR-1 – SR-11, ST-28 – ST-32 |
| `notifications.test.tsx` | 21 | AC-11, AC-12, AC-33, FR-49 – FR-54, NT-1 – NT-9, EDGE-5 |
| `profiles.test.tsx` | 12 | AC-15, PR-1 – PR-9, AS-1 |
| `accessibility.test.tsx` | 9 | AC-20, A11Y-1, A11Y-3, A11Y-5, A11Y-6, A11Y-8, A11Y-12 |
| `edge-cases.test.tsx` | 6 | EDGE-7, EDGE-9 – EDGE-12, EDGE-17, EDGE-18 |
| `performance.test.tsx` | 6 | AC-21 (client-side), AC-34, PERF-2, PERF-5, PERF-8 – PERF-10 |
| `regression.test.tsx` | 16 | Readiness Review §14 checklist, AC-17, AC-25, AC-29 |

### Live suite composition

| File | Tests | Covers |
|---|---|---|
| `realtime.test.ts` | 6 | AC-1, AC-2, PERF-4, PERF-6, PERF-7 |
| `receipts.test.ts` | 6 | AC-3, AC-4, FR-18 – FR-21, GW-2, GW-3 |
| `files.test.ts` | 10 | AC-7, FR-23 – FR-31 |
| `attachment-flow.test.ts` | 3 | AC-5, AC-6 |
| `notifications.test.ts` | 7 | AC-11, AC-12, AC-15, NT-1 – NT-5, NT-8, PR-1 – PR-3 |

---

## 2. Acceptance criteria

### 22.1 Blueprint §9 capabilities — measured live, two real users

| ID | Criterion | Evidence |
|---|---|---|
| **AC-1** | Named typing indicator within 1 s, clears within 5 s | 101 ms — `realtime.test.ts` |
| **AC-2** | Availability shown correctly; manual change reflected within 5 s | 0 ms — `realtime.test.ts` |
| **AC-3** | Sender observes state progress to read | 1 ms — `receipts.test.ts` |
| **AC-4** | Department head sees who has and has not read a directive | `receipts.test.ts`, by name |
| **AC-5** | Attach by drag-and-drop, observe progress, cancel | `attachment-flow.test.ts`, `attachments.test.tsx` |
| **AC-6** | Recipient previews an image, sees a card for a document, downloads | HTTP 200, 3072 bytes — `attachment-flow.test.ts` |
| **AC-7** | Oversized file refused before upload, limit stated | `files.test.ts` |

### 22.2 Product quality

| ID | Criterion | Evidence |
|---|---|---|
| **AC-8** | No demonstration data in Production Mode | `surfaces.test.tsx`, `regression.test.tsx`; every fixture-backed provider returns `unavailable` |
| **AC-9** | Every list surface demonstrates loading, populated, empty, error | `ModuleStateBoundary`; asserted per surface |
| **AC-10** | Search returns conversations, people, messages, files; a message result opens at the message | `search.test.tsx` |
| **AC-11** | Unread accurate at conversation, module, organisation level; survives sign-out | `notifications.test.tsx`; live: unread observed in 110 ms. Counts are the server's own, so a new session reads the same figures |
| **AC-12** | Mentions visually distinguished at every level | `notifications.test.tsx`; live: mention observed in 112 ms |
| **AC-13** | Announcement channel presents no composer, states the rule in one sentence | `regression.test.tsx`, `PermissionNotice` |
| **AC-14** | A second department by configuration only | `organisation.test.ts` — `Jinoyat qidiruv` exists only in configuration |
| **AC-15** | Any person's profile is identical wherever it is opened | `profiles.test.tsx`; one `ProfilePanel`, opened through one context |
| **AC-16** | No literal colour outside token definitions; no decorative emoji as institutional iconography | `grep` over `src/sovereign/**/*.css` and `*.tsx`: **0** literal colours outside `tokens.css`, **0** emoji in any rendered surface |
| **AC-17** | Operable at compact, standard, and wide | `regression.test.tsx`, boundaries at 767/768/1280/1366 |
| **AC-18** | An undisplayable message is a distinct interface state | `timeline.test.ts`, `UnavailableMessage` |

### 22.3 Accessibility and performance

| ID | Criterion | Result |
|---|---|---|
| **AC-19** | WCAG 2.1 AA audit reports no A or AA failure | **Partial** — the properties the product owns in code are asserted in `accessibility.test.tsx`, and the three defects found in this pass are fixed (see §3). An automated axe scan and the manual screen-reader pass are **outstanding**; see §5 |
| **AC-20** | Every §22.1 task completable by keyboard alone | Roving tab index in the hierarchy, one dialog contract across every overlay, every control reachable — `accessibility.test.tsx` |
| **AC-21** | All §21 performance targets met and recorded | **Partial** — client-side targets measured below; PERF-1, PERF-3, PERF-9, PERF-11 need the deployment on the minimum workstation, see §5 |
| **AC-22** | Fully functional at 200% zoom | The frame is grid-based with `overflow: hidden` and no page-body horizontal scroll; at 200% on the 1366 px minimum workstation the viewport resolves to the compact breakpoint, which presents one surface at a time (UI-16) |

Measured performance:

| Target | Budget | Measured |
|---|---|---|
| PERF-2 conversation switch to rendered timeline | 300 ms | 164 ms for a 100,000-message timeline |
| PERF-4 message reaches the other participant | 1 s | 101 ms, live |
| PERF-5 first search result | 500 ms | 241 ms over 2,000 conversations |
| PERF-6 typing indicator appears | 1 s | 101 ms, live |
| PERF-7 presence change reflected | 5 s | 0 ms, live |
| PERF-8 / PERF-9 100,000-message timeline | bounded, no blank regions | under 300 rendered nodes; newest end on screen |
| PERF-10 conversation list | no perceptible delay | 5,000 conversations mapped in 492 ms, rendered in 496 ms |
| NT-1 unread aggregation over 5,000 | — | under 16 ms (one frame) |

### 22.4 Regression

| ID | Criterion | Evidence |
|---|---|---|
| **AC-23** | Sign-in, restore, send, receive, real-time delivery, room switching unchanged | `regression.test.tsx` + live suite; no authentication or session code touched |
| **AC-24** | Demo Mode fully operational, unchanged | `SovereignDemoApp` untouched. `DemoLogin` has one changed line — the provider it reads began returning a state envelope (M2), and the call site had to unwrap it; the data it shows and the behaviour it has are identical. Every new capability presents its unavailable state in Demo Mode rather than altering it |
| **AC-25** | One client instance, one sync loop | `regression.test.tsx`; every service reads `MatrixClientService`, none creates a client |
| **AC-26** | No protected system modified | `git diff f18a55c..HEAD --stat` touches no file under §6.1 |

### 22.5 Security experience, states, and edge cases

| ID | Criterion | Evidence |
|---|---|---|
| **AC-27** | Disconnection banner, readable content, queued send in order | `ConnectionBanner`, `OutboxService`; order asserted in `edge-cases.test.tsx` |
| **AC-28** | Expired session notice with one sign-in action, composed text restored | `SessionLifecycleService`, `DraftService` |
| **AC-29** | Permission change without reload, composition preserved | `regression.test.tsx` |
| **AC-30** | Every §8.11 surface demonstrates four states with the specified copy | `stateCopy.ts` is the single table; `ModuleStateBoundary` is the single renderer |
| **AC-31** | Empty and unavailable visually and textually distinct | `EmptyState` variants; asserted per surface |
| **AC-32** | Every Appendix B error reproducible with the specified copy; no protocol terminology | `errorCatalogue.ts`; no user-facing string contains an identifier or code |
| **AC-33** | A message read in one tab is not unread in another; never a double increment | `notifications.test.tsx`, `edge-cases.test.tsx` — counts and read positions are server state, never a local tally |
| **AC-34** | 5,000 conversations and 100,000 messages within §21 | `performance.test.tsx` |
| **AC-35** | Every Appendix C component exists with its states documented | **Partial — 46 of 53.** See §4 |
| **AC-36** | Every Appendix D transition demonstrable | Message, upload, typing, presence, connection, and notification transitions are exercised by the suites above. The directive acknowledgement transition depends on the explicit-acknowledgement semantics Product has not chosen (§5) |

---

## 3. Defects found and fixed in this pass

| Defect | Consequence had it shipped |
|---|---|
| The offline suite included the live tests | The suite failed on every machine without a homeserver, which made the regression signal unreadable |
| The conversation list rendered every conversation | 2.2 s before anything appeared at the 5,000 AC-34 names, for a reader who wanted the first twenty |
| A removed conversation moved the reader silently | A message written into the wrong conversation |
| Ten module headers carried an emoji as institutional iconography | An emoji on screen above the Production Mode unavailable state (AC-16, TOK-13) |
| The policy modal carried a literal palette | AC-16 failure, and a surface that ignored the user's theme |
| No theme could be selected | The high-contrast theme existed in the tokens and no user could reach it (A11Y-12) |
| Images announced only their filename | A WCAG Level A failure: "IMG_2043.jpg" describes nothing (A11Y-8) |
| The working area was not a landmark | No main region to skip to (A11Y-6) |
| A profile fell back to the account identifier | An internal identifier on screen, presented as a person's name (NFR-8) |

---

## 4. Component inventory (AC-35)

**46 of 53 implemented.** The seven outstanding are recorded here rather than
built, because nothing in Sprint 3 consumes them and this codebase has
consistently refused speculative components — the reply, reaction, and
attachment props carried unused since Sprint 1 were deleted for the same
reason.

| ID | Component | Why it is not built |
|---|---|---|
| **CMP-10** | Profile Card | No surface presents a compact person summary; the member list item (CMP-12) and the full profile (CMP-11) cover every place a person appears |
| **CMP-13** | Role Chip | Roles are displayed in four surfaces through one copy table (`roleCopy.ts`). A chip component would be presentation with no distinct behaviour |
| **CMP-24** | Reply Preview | Sprint 3 specifies no reply capability; there is nothing to preview |
| **CMP-25** | Directive Block | Requires a directive designation. What marks a message a directive is a workflow decision Product owns (§5) |
| **CMP-48** | Confirmation Dialog | No destructive action exists in Sprint 3. Session termination, the obvious candidate, is out of scope (PR-8) |
| **CMP-49** | Context Menu | No surface offers contextual actions in Sprint 3 |
| **CMP-50** | Toast | Every confirmation in Sprint 3 is stated where it happened, which SUX-1 prefers and A11Y-7 makes safer than a transient overlay |

CMP-47 (Dialog) is implemented as shared behaviour (`useDialog`) rather than a
wrapper component: search, the notification centre, and the profile each have
their own layout and need only the focus contract.

---

## 5. What remains

Recorded in full in [sprint-3-outstanding.md](sprint-3-outstanding.md).

**Seven requirements Sprint 3 specified are unmet** (UR-1 – UR-7), found by the
freeze audit after this record was first written. None is gated by an
acceptance criterion, which is how the sprint reached AC-1 – AC-36 without
them, and each is a *shall* in the PRD:

| Requirement | State |
|---|---|
| FR-47 mark a conversation as a favourite | read-only; nothing sets the tag |
| FR-48 pinned messages affordance | not delivered |
| NAV-6 recent items | not delivered |
| NAV-7 browser back and forward | not delivered |
| NAV-8 stable shareable links | not delivered |
| NAV-9 keyboard shortcut set and reference | search and Escape only |
| NAV-10 scroll position preserved across a switch | drafts yes, scroll no |

NAV-7 and NAV-8 are one piece of work — a routing model the frame does not
have — and it is the largest item outstanding.

Also recorded there: ten items of Engineering debt, and the decisions and
deliverables owned by Product.

---

*Sovereign Messenger — Sprint 3 acceptance evidence · governed by
`PROJECT_BLUEPRINT_V2.md`*
