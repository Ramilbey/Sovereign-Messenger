# Sprint 3 — What Remains

| Field | Value |
|---|---|
| **Date** | 2026-08-08 |
| **Companion to** | [sprint-3-acceptance.md](sprint-3-acceptance.md) |

Three lists. The first is requirements Sprint 3 specified and did not deliver.
The second is Engineering's debt: things that work, that are honest about what
they are, and that a later sprint should improve. The third is Product's, and
is not debt at all — it is work Engineering cannot do, because the decision
behind it belongs elsewhere.

---

## 1. Unmet Sprint 3 requirements — Engineering

Found by the freeze audit. None of these is gated by an acceptance criterion,
which is why the sprint reached AC-1 – AC-36 without them; each is nonetheless
a requirement the PRD states as *shall*, and none is delivered.

| # | Requirement | State |
|---|---|---|
| **UR-1** | **FR-47** — a user shall be able to mark a conversation as a favourite | **Read-only.** A favourite is read from the platform's tag and sorts above every other grouping (IA-8). Nothing sets or clears the tag, so a favourite can only be made in another client |
| **UR-2** | **FR-48** — pinned messages viewable through an affordance in the conversation header | **Not delivered.** Recorded in `ConversationHeader.tsx` when the header was built: a control that opens nothing would misrepresent an unavailable capability as an available one. Retrieval of pinned events was never built |
| **UR-3** | **NAV-6** — a recent-items list of recently visited conversations and modules | **Not delivered.** Search offers recent *searches* (SR-11); navigation offers no recent items |
| **UR-4** | **NAV-7** — browser back and forward behave predictably without losing context | **Not delivered.** The frame holds navigation in component state and touches no history API, so the browser's controls leave the application rather than moving within it |
| **UR-5** | **NAV-8** — every conversation, module, and message addressable by a stable internal link | **Not delivered.** Search opens a conversation positioned at a message (SR-5), which is the behaviour a link would produce, but nothing is addressable and nothing can be shared. Depends on UR-4: both need a routing model the frame does not have |
| **UR-6** | **NAV-9** — shortcuts for search, conversation switching, next unread, composer focus, closing panels, and a discoverable reference | **Partial.** Search is bound to Ctrl/Cmd-K from anywhere, and Escape closes every overlay. The other four are absent, as is the reference |
| **UR-7** | **NAV-10** — switching conversations preserves the scroll position and the draft of the conversation being left | **Partial.** Drafts are preserved per conversation and asserted in the regression suite. Scroll position is not: entering a conversation places the reader at the newest message or at the unread boundary (FR-37), never where they were when they left |

UR-4 and UR-5 are one piece of work — a routing model for the frame — and it
is the largest single item outstanding. It should be settled before the UI
redesign rather than after, because where navigation state lives determines
what the redesign can address.

---

## 2. Technical debt — Engineering

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
| **TD-11** | `dev.sh` edits the committed nginx configuration in place and relies on an EXIT trap to undo it | `dev.sh`, `nginx/default.conf` | A kill, a crash, or a reboot skips the trap, and every subsequent run appends another set of upgrade headers. Found at the freeze: the file was committed in dev mode with `proxy_http_version` three times over, which nginx refuses to start on — the deployment's proxy had been in a restart loop. Fixed by restoring the file; the mechanism that caused it stands. A dev-mode overlay file, or a generated config the repository does not track, would remove the failure mode |

---

## 3. Product-owned work

### 3.1 Decisions the Readiness Review recorded as blocking

| # | Decision | State |
|---|---|---|
| **PO-1** | Read receipt semantics for directive acknowledgement (R-2) | **Open.** `sovereignPolicy.ts` carries `read-position` as a provisional default and the interface states which reading produced any figure it shows. `explicit` is selectable in configuration but not implementable until Product defines the acknowledgement action — GW-2 asks only that the issuer can *view* acknowledgement, which is what is built |
| **PO-2** | Search scope over encrypted conversations (R-4) | **Open.** The interface states that a result set is knowably incomplete rather than letting a user believe nothing else matched (SR-10). Which conversations the deployment's server can index is a Product and Architecture answer |
| **PO-3** | File size limit and permitted types (R-10) | **Open.** 25 MB and a document-and-image allow-list are provisional, held in `sovereignPolicy.ts` so confirming them is a configuration change, not a code change |
| **PO-4** | A controlled means of setting role data for acceptance (R-6) | **Open.** Every user resolves to the least-privileged role, so Manager-only behaviour cannot be demonstrated in an acceptance run. Provisioning tooling remains out of scope (FUT-15) |

### 3.2 Decisions Sprint 3 surfaced

| # | Decision | Why Engineering cannot make it |
|---|---|---|
| **PO-5** | What designates a message **urgent**, and who may do it (FR-53, NT-9) | The interface elevates an urgent official message and lets it through a silenced conversation, reading the designation from a field the deployment declares. Nothing *applies* the designation: which officers may mark a directive urgent, and under what circumstances, is departmental procedure |
| **PO-6** | What designates a message a **directive** (CMP-25, GW-1) | Same shape as PO-5. The acknowledgement summary already works on any message; the formal directive block needs a definition of what makes a message formal |
| **PO-7** | Which conversations belong to which organisational node | Needed to close TD-1. The organisation configuration format is a Sprint 3 artefact and can carry it; what it should say is a Product answer |
| **PO-8** | Whether an audible alert is permitted on a government workstation, and for whom | NT-7 is delivered and off by default. A duty officer (§7, Navbatchi) wants it; whether an open-plan investigation office may enable it is policy |

### 3.3 Sprint 3 deliverables assigned to Product

| ID | Deliverable | State |
|---|---|---|
| **D-20** | Uzbek and Russian localisation | **Uzbek complete and centralised** — every user-facing string lives in a copy table under `config/`, and no string is hardcoded in a component (NFR-4). **Russian is outstanding**: the organisation model carries Russian names, the interface copy does not. The tables are the translation unit |
| **D-21** | Pilot user guide (Uzbek) | Not started |
| **D-22** | Stakeholder demonstration | Not delivered |
| **D-1 / D-2** | Design system approval, branding guidelines | The token library and component inventory are implemented and documented. Design Lead approval and the State Emblem asset (UI-8) are outstanding — the emblem's region is reserved and renders only when the deployment supplies the asset, because an improvised substitute would misrepresent state identity |

### 3.4 QA sign-off outstanding

| Deliverable | What is done | What is outstanding |
|---|---|---|
| **D-17** accessibility conformance | Keyboard operation, landmarks, non-colour carriers, focus contract, reduced motion, selectable high-contrast theme, image text alternatives | An automated WCAG 2.1 AA scan and a manual screen-reader pass (TD-9). Three Level A/AA defects were found and fixed in this pass |
| **D-18** performance validation | Client-side targets measured and recorded; live delivery, typing, and presence measured against a real server | PERF-1, PERF-3, PERF-9, and PERF-11 on the minimum specification workstation against the deployment |
| **D-19** regression validation | The §14 checklist runs in the suite on every change | Sign-off |
| **D-27** edge case validation | All eighteen EDGE conditions exercised | Sign-off |

---

*Sovereign Messenger — Sprint 3 outstanding work · governed by
`PROJECT_BLUEPRINT_V2.md`*
