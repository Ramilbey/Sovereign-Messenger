# Sprint 3 — What Remains

| Field | Value |
|---|---|
| **Date** | 2026-08-08 |
| **Companion to** | [sprint-3-acceptance.md](sprint-3-acceptance.md) |

Two lists. The first is Engineering's, and is debt: things that work, that are
honest about what they are, and that a later sprint should improve. The second
is Product's, and is not debt at all — it is work Engineering cannot do,
because the decision behind it belongs elsewhere.

---

## 1. Technical debt — Engineering

| # | Item | Where | Why it stands, and what it costs |
|---|---|---|---|
| **TD-1** | Organisational unread is attributed to the user's own position and rolled up its ancestry | `SovereignLayout`, `GovernmentNavigation` | No configuration maps a conversation to an organisational node, so there is nothing to attribute a conversation to a *sibling* department with. The figures are accurate for the conversations that exist — everything the user holds is inside their own branch — but a deployment where one user reads across two departments would want the mapping. Depends on PO-6 |
| **TD-2** | The notification feed is built by scanning each conversation's recent events | `MatrixNotificationService.getFeed` | The platform can maintain a notification timeline, but only where the client is configured to; configuring it means changing `MatrixClientPeg`, which §6.1 forbids. The scan is bounded to 30 events per conversation and runs only while the centre is open |
| **TD-3** | The notification level is re-read per room while the conversation list is mapped | `MatrixRoomService.transformRoom` | It walks the account's override rules for each room: negligible at the rule counts a deployment carries, but it is O(rooms × rules) and the 5,000-conversation mapping is already the slowest read in the product (492 ms) |
| **TD-4** | Spacing, radius, and size literals remain in the Demo Mode module views | `components/views/ModuleViews.css` | AC-16 governs colour, and the colours are tokenised. These surfaces are Demo Mode presentation, retained unchanged by Readiness Review §7; a full pass belongs with whatever sprint gives them real data |
| **TD-5** | The module views use ad-hoc markup rather than design system components | `components/views/*.tsx` | Same reason as TD-4. They present the unavailable state in Production Mode, so no user of the real product sees them |
| **TD-6** | `useSovereignData` holds the demonstration fixtures and the production providers in one module | `providers/useSovereignData.ts` | Readiness Review §11 anticipated splitting it by domain. The production paths are all truthful (FR-1, FR-2), so the split is tidiness rather than correctness — but the file is now the largest in the provider layer |
| **TD-7** | Avatar upload reports no progress and cannot be cancelled | `ProfilePanel.chooseAvatar` | It uses the same transfer as any attachment, but the profile shows none of the state the composer does. An avatar is small; on a slow connection (EDGE-3) it would still look frozen |
| **TD-8** | EDGE-10 (multiple devices) is asserted through server-held state, not by driving two devices | `edge-cases.test.tsx`, live suite | Read state, unread counts, and notification levels are all server state, which is *why* they reconcile — but the test demonstrates the property rather than the scenario. Two sessions of the same account would demonstrate the scenario |
| **TD-9** | No automated accessibility scan runs in the pipeline | — | The properties the product owns are asserted in `accessibility.test.tsx`, but an axe scan would catch contrast and ARIA regressions that assertions written by hand will not. Needed to close AC-19 |
| **TD-10** | The vendored Element tree reports type errors unless its workspace packages are built first | `apps/web/tsconfig.json` | Pre-existing, unchanged, and the reason the Sovereign suite has a project of its own. Sovereign scope is clean; the noise makes a whole-tree typecheck useless as a gate |

---

## 2. Product-owned work

### 2.1 Decisions the Readiness Review recorded as blocking

| # | Decision | State |
|---|---|---|
| **PO-1** | Read receipt semantics for directive acknowledgement (R-2) | **Open.** `sovereignPolicy.ts` carries `read-position` as a provisional default and the interface states which reading produced any figure it shows. `explicit` is selectable in configuration but not implementable until Product defines the acknowledgement action — GW-2 asks only that the issuer can *view* acknowledgement, which is what is built |
| **PO-2** | Search scope over encrypted conversations (R-4) | **Open.** The interface states that a result set is knowably incomplete rather than letting a user believe nothing else matched (SR-10). Which conversations the deployment's server can index is a Product and Architecture answer |
| **PO-3** | File size limit and permitted types (R-10) | **Open.** 25 MB and a document-and-image allow-list are provisional, held in `sovereignPolicy.ts` so confirming them is a configuration change, not a code change |
| **PO-4** | A controlled means of setting role data for acceptance (R-6) | **Open.** Every user resolves to the least-privileged role, so Manager-only behaviour cannot be demonstrated in an acceptance run. Provisioning tooling remains out of scope (FUT-15) |

### 2.2 Decisions Sprint 3 surfaced

| # | Decision | Why Engineering cannot make it |
|---|---|---|
| **PO-5** | What designates a message **urgent**, and who may do it (FR-53, NT-9) | The interface elevates an urgent official message and lets it through a silenced conversation, reading the designation from a field the deployment declares. Nothing *applies* the designation: which officers may mark a directive urgent, and under what circumstances, is departmental procedure |
| **PO-6** | What designates a message a **directive** (CMP-25, GW-1) | Same shape as PO-5. The acknowledgement summary already works on any message; the formal directive block needs a definition of what makes a message formal |
| **PO-7** | Which conversations belong to which organisational node | Needed to close TD-1. The organisation configuration format is a Sprint 3 artefact and can carry it; what it should say is a Product answer |
| **PO-8** | Whether an audible alert is permitted on a government workstation, and for whom | NT-7 is delivered and off by default. A duty officer (§7, Navbatchi) wants it; whether an open-plan investigation office may enable it is policy |

### 2.3 Sprint 3 deliverables assigned to Product

| ID | Deliverable | State |
|---|---|---|
| **D-20** | Uzbek and Russian localisation | **Uzbek complete and centralised** — every user-facing string lives in a copy table under `config/`, and no string is hardcoded in a component (NFR-4). **Russian is outstanding**: the organisation model carries Russian names, the interface copy does not. The tables are the translation unit |
| **D-21** | Pilot user guide (Uzbek) | Not started |
| **D-22** | Stakeholder demonstration | Not delivered |
| **D-1 / D-2** | Design system approval, branding guidelines | The token library and component inventory are implemented and documented. Design Lead approval and the State Emblem asset (UI-8) are outstanding — the emblem's region is reserved and renders only when the deployment supplies the asset, because an improvised substitute would misrepresent state identity |

### 2.4 QA sign-off outstanding

| Deliverable | What is done | What is outstanding |
|---|---|---|
| **D-17** accessibility conformance | Keyboard operation, landmarks, non-colour carriers, focus contract, reduced motion, selectable high-contrast theme, image text alternatives | An automated WCAG 2.1 AA scan and a manual screen-reader pass (TD-9). Three Level A/AA defects were found and fixed in this pass |
| **D-18** performance validation | Client-side targets measured and recorded; live delivery, typing, and presence measured against a real server | PERF-1, PERF-3, PERF-9, and PERF-11 on the minimum specification workstation against the deployment |
| **D-19** regression validation | The §14 checklist runs in the suite on every change | Sign-off |
| **D-27** edge case validation | All eighteen EDGE conditions exercised | Sign-off |

---

*Sovereign Messenger — Sprint 3 outstanding work · governed by
`PROJECT_BLUEPRINT_V2.md`*
