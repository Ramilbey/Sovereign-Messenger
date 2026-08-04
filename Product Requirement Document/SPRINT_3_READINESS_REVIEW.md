# Sovereign Messenger — Sprint 3 Implementation Readiness Review

| Field | Value |
|---|---|
| **Document** | SPRINT_3_READINESS_REVIEW.md |
| **Version** | 1.0 |
| **Status** | Pre-implementation planning |
| **Specification** | `SPRINT_3_PRODUCT_REQUIREMENTS.md` v1.1 |
| **Governing Document** | `PROJECT_BLUEPRINT_V2.md` |
| **Audience** | Engineering Lead · Design Lead · QA Lead · Product Management |

> This document plans **how and in what order** Sprint 3 will be built. It does not add, remove, or reinterpret any requirement. Where this document and the PRD differ, the PRD prevails; where the PRD and the Blueprint differ, the Blueprint prevails.

---

## 1. Development Phases

Sprint 3 is delivered in five phases. Each phase produces a demonstrable increment and leaves the application in a shippable state.

| Phase | Name | Purpose | Deliverables |
|---|---|---|---|
| **P0** | Foundation | Design system, tokens, component library shell, state primitives. No user-visible feature change. | D-1, D-2, D-25, D-26 |
| **P1** | Truthful Surfaces | Production Mode data integrity, all four states on every surface, error catalogue, security experience. | D-15, D-23, D-24 |
| **P2** | Structure | Information architecture, navigation, conversation list, organisation model, breadcrumbs, responsive frame. | D-3, D-4, D-13, D-16 |
| **P3** | Real-Time Capabilities *(Blueprint §9 mandate)* | Typing, presence, read receipts, file upload/download. | D-6, D-7, D-8, D-9 |
| **P4** | Discovery & Polish | Search, notifications, profiles, accessibility conformance, performance validation. | D-10, D-11, D-12, D-17, D-18, D-19, D-27 |

**Rationale for ordering.** P0 must precede all UI work or components will be rebuilt twice. P1 precedes P2 because navigation built over fabricated data cannot be validated. P3 is placed after structure because typing, presence, and receipts all attach to the conversation surfaces that P2 defines. P4 depends on everything preceding it.

---

## 2. Feature Dependency Graph

```
P0  Design tokens ──┬─► Component library ──┬─► All UI work
                    └─► Icon set ───────────┘

P1  Production data integrity ──┬─► Empty/unavailable states ──► Module surfaces
                                ├─► Error catalogue ──► Security experience
                                └─► Connection state ──► Queued messages

P2  Organisation model (config-driven) ──┬─► Sidebar / hierarchy ──► Breadcrumbs
                                          └─► Module scoping
    Conversation list ──┬─► Unread counts (P4 notifications)
                        ├─► Conversation header
                        └─► Responsive frame ──► All breakpoints

P3  Conversation surface (P2) ──┬─► Typing indicator
                                ├─► Read receipts ──► Directive acknowledgement
                                └─► Composer ──► File attach ──► Upload progress
                                                              └─► File card / image viewer
    Member surfaces (P2) ──► Presence ──► Staff panel

P4  Search ──► Search results ──► Message deep-link (needs P2 conversation routing)
    Notifications ──► Unread model (P2) + mentions ──► Notification centre
    Profiles ──► Presence (P3) + role display (P1)
    Accessibility & performance ──► everything
```

**Critical path:** `Design tokens → Component library → Conversation surface → File upload → Acceptance`
File upload (D-9) has the longest chain of prerequisites and the highest number of states; it should start as early in P3 as its dependencies allow.

---

## 3. Recommended Implementation Order

| # | Work item | Phase | Depends on |
|---|---|---|---|
| 1 | Design token definitions (Appendix A) | P0 | — |
| 2 | Icon set selection and integration | P0 | 1 |
| 3 | Foundation components (CMP-1 – CMP-8) | P0 | 1, 2 |
| 4 | Empty / error / loading state components (CMP-51, CMP-52, CMP-7) | P0 | 3 |
| 5 | Production Mode data integrity (FR-1 – FR-5) | P1 | 4 |
| 6 | Per-surface state copy (§8.11) | P1 | 4, 5 |
| 7 | Error catalogue implementation (Appendix B) | P1 | 4 |
| 8 | Connection state + banner (CMP-45, SUX-5 – SUX-8) | P1 | 3 |
| 9 | Security notices + session expiry (CMP-46, SUX-2, SUX-3) | P1 | 8 |
| 10 | Queued message send (SUX-6, ST-38) | P1 | 8 |
| 11 | Configuration-driven organisation model (ORG-1 – ORG-8) | P2 | 5 |
| 12 | Sidebar + hierarchy + breadcrumbs (CMP-14 – CMP-17) | P2 | 11 |
| 13 | Conversation list (CMP-19, CMP-20) | P2 | 3, 5 |
| 14 | Conversation header + member list (CMP-30, CMP-12) | P2 | 13 |
| 15 | Responsive frame, three breakpoints (UI-13 – UI-19) | P2 | 12, 13 |
| 16 | Message bubble, grouping, date separators (CMP-21 – CMP-23) | P2 | 3 |
| 17 | Composer rework, drafts, permission notice (CMP-28, CMP-29) | P2 | 16 |
| 18 | **Typing indicator** (D-6) | P3 | 17 |
| 19 | **Presence** (D-7) | P3 | 14 |
| 20 | **Read receipts** (D-8) | P3 | 16 |
| 21 | Directive block + acknowledgement summary (CMP-25, CMP-31) | P3 | 20 |
| 22 | **File attach, upload progress, cancel** (D-9 part 1) | P3 | 17 |
| 23 | **File card, image preview, viewer, download** (D-9 part 2) | P3 | 22 |
| 24 | Unread model + counts (NT-1, NT-2) | P4 | 13 |
| 25 | Notification centre + per-conversation settings (D-11) | P4 | 24 |
| 26 | Search field, panel, results, filters (D-10) | P4 | 13, 16 |
| 27 | Profiles (D-12) | P4 | 19 |
| 28 | Accessibility conformance pass (D-17) | P4 | all |
| 29 | Performance validation (D-18) | P4 | all |
| 30 | Edge case validation (D-27) | P4 | all |
| 31 | Regression validation (D-19) | P4 | all |

---

## 4. High-Risk Items

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| **R-1** | **Production data integrity turns out larger than estimated.** 16 of 17 modules currently read fixture data; FR-2 requires each to gain a defined unavailable state. | High | High | Treat FR-2 unavailable states as the default outcome for modules with no data source. Do not attempt to source real data for out-of-scope modules. |
| **R-2** | **Read receipt semantics may not match government expectation.** FR-19/FR-20 require per-recipient visibility in channels; platform read receipts are typically per-user-latest, not per-message. | High | Medium | Design spike in P0. Confirm with the pilot department what "who has read this directive" must mean before building D-8. |
| **R-3** | **Presence at scale.** FR-17 requires real presence for a whole department; presence is expensive and may be disabled or throttled server-side. | Medium | Medium | Verify presence availability in the deployment during P0. If unavailable, escalate to Product before P3 — do not substitute fabricated presence. |
| **R-4** | **Encrypted rooms interact with search.** SR-1 requires message search; server-side search cannot index encrypted content. | High | High | Confirm during P0 which conversations are searchable. Scope SR requirements to searchable content and state the limitation in the UI; do not change encryption (§6.1). |
| **R-5** | **Organisation model has no authoritative data source.** ORG-1 requires configuration-driven hierarchy; no such configuration exists today. | High | High | Define the configuration format in P0 and treat it as a Sprint 3 artefact. AC-14 (second department by configuration only) is the gate. |
| **R-6** | **Role data is absent (AS-1).** Every user resolves to least privilege, so Manager-only behaviour cannot be demonstrated. | High | High | Provide a controlled means to set role data for acceptance testing only. Provisioning tooling remains out of scope (FUT-15). |
| **R-7** | **Component library scope.** 53 components is a large P0 commitment. | Medium | High | Build P0 components on demand in dependency order, not all upfront. Only CMP-1 – CMP-8 and CMP-51/52 are true P0 blockers. |
| **R-8** | **Accessibility retrofit cost.** No current focus management, landmarks, or contrast verification. | Medium | Medium | Build accessibility into P0 components. A retrofit pass in P4 alone will not reach AA. |
| **R-9** | **Regression of Sprint 2 behaviour.** Conversation and composer rework touches verified messaging paths. | High | Medium | AC-23 – AC-26 run at the end of every phase, not only at sprint end. Automate the two-user realtime test. |
| **R-10** | **File size and type policy undefined.** FR-28/FR-29 require a limit and permitted types; neither is specified. | Medium | High | Product to supply values before P3 begins. |

---

## 5. Estimated Complexity

Relative scale (S = small, M = medium, L = large, XL = extra large). No calendar estimates — sequencing only.

| Work area | Complexity | Notes |
|---|---|---|
| Design tokens and theming | **L** | Three themes, full token coverage, replaces existing ad-hoc styling |
| Component library | **XL** | 53 components with full state coverage |
| Production data integrity | **L** | Touches every module and provider |
| Empty/error/loading states | **M** | Mechanical once components exist |
| Security experience | **M** | Mostly presentation over existing conditions |
| Organisation model | **L** | New configuration format plus recursive rendering |
| Navigation and conversation list | **L** | Replaces the current selection control entirely |
| Responsive frame | **L** | Three breakpoints across all surfaces |
| Typing indicator | **S** | Platform capability exists |
| Presence | **M** | Display is simple; scale and availability are the risk |
| Read receipts | **L** | Directive acknowledgement is the complex part (R-2) |
| File upload/download | **XL** | Most states of any feature; many failure paths |
| Search | **L** | Depends on searchable-content resolution (R-4) |
| Notifications | **L** | Cross-tab and cross-device reconciliation is subtle |
| Profiles | **M** | Straightforward once presence exists |
| Accessibility | **L** | Cheap if built in, expensive if retrofitted |
| Edge cases | **M** | Mostly validation, some virtualisation work |

**Overall assessment: XL.** Sprint 3 is larger than Sprint 2. If capacity is constrained, the recommended reduction is to defer P4 search (D-10) rather than compromise P1 or P3.

---

## 6. Components Requiring Redesign

| Current component | Required change | Driver |
|---|---|---|
| `ChatArea` | Split responsibilities: header, timeline, composer become separate components. Remove the selection control and inline styling. | NAV-2, UI-2, CMP-30 |
| `MessageComposer` | Multi-line, drafts, permission state, attachment entry, queued state. | FR-39, FR-40, CMP-28 |
| `MessageTimeline` | Grouping, unread divider, pagination, reserved layout, virtualisation. | FR-32, FR-37, EDGE-2 |
| `MessageBubble` | Real sender role, full state set, urgent and unavailable treatments. | FR-34, COM-5, CMP-21 |
| `TypingIndicator` | Connect to real typing data; single and multiple forms; reserved space. | FR-6 – FR-9 |
| `Sidebar` | Render configuration-driven hierarchy at arbitrary depth; collapsible. | ORG-3, CMP-14 |
| `GovernmentNavigation` | Remove the single hardcoded branch; consume organisation configuration. | ORG-1, AC-14 |
| `RightPanel` | Real colleagues with real presence; ordering rules; states. | FR-17, ES-1 |
| `Topbar` | Becomes the application header: emblem, search entry, connection state, user. | UI-8, NAV-4, SUX-16 |
| `WorkspaceArea` | Module host with scoping and unavailable states. | IA-9, IA-11 |
| `SovereignLayout` | Responsive three-breakpoint frame; primary column dominance. | UX-2, UI-13 – UI-16 |
| `ChannelsView` / `GroupsView` | Adopt conversation list components and real state handling. | CMP-19, ES-1 |
| `MembersView` | Real members, presence, profile entry. | FR-45, PR-2 |
| `DocumentsView` | Real files from conversations, filtering. | FR-31 |
| `ModulePlaceholderView` | Becomes the formal unavailable state per FR-2. | FR-2, CMP-51 |

## 7. Components That Can Be Reused Unchanged

| Component | Justification |
|---|---|
| `DateSeparator` | Behaviour matches FR-33; may need token restyling only |
| `PolicyModal` | Not in Sprint 3 scope; no requirement affects it |
| `DemoLogin` | Demo Mode only; ADR-004 requires it remain untouched |
| `SovereignDemoApp` | Demo Mode entry point; must continue to function (AC-24) |
| `workspaceModules` configuration | Structure is sound; gains grouping and enablement fields (IA-10, IA-12) |
| `CasesView`, `SuspectsView`, `EvidenceView`, `ReportsView`, `CourtMaterialsView`, `TasksView`, `CalendarView`, `DashboardView` | Retained for Demo Mode. In Production Mode they present the unavailable state (FR-2). No redesign in Sprint 3. |

---

## 8. Platform Capabilities Required

Sprint 3 **consumes existing platform capabilities**. It introduces no new integration and modifies no protected system (§6.1).

| Capability | Used for | Status |
|---|---|---|
| Typing notification | D-6 | Available; already used by the host platform |
| Presence | D-7 | **Verify availability and throttling in P0 (R-3)** |
| Read markers and receipts | D-8 | Available; semantics to be confirmed (R-2) |
| Media upload and download | D-9 | Available |
| Server-side search | D-10 | **Verify scope over encrypted content in P0 (R-4)** |
| Room membership and profile data | D-12, FR-45 | Available |
| Room tags | FR-47 Favourites | Available |
| Pinned events | FR-48 Pinned messages | Available |
| Room topic and metadata | FR-44 | Available |
| Notification counts and push rules | D-11 unread model | Available |
| Account data | Role display (AS-1) | Available; provisioning out of scope |

## 9. Events the Interface Must Observe

Behavioural requirement only — no change to how events are transported or to the bridge (§6.1).

| Event class | Drives |
|---|---|
| Timeline events | Message display, ordering, unread boundary |
| Message decryption completion | Message becoming displayable (FR-35, ST-40) |
| Typing notifications | CMP-26 |
| Presence changes | CMP-9, FR-13 |
| Read markers / receipts | CMP-31, FR-18 – FR-20 |
| Room membership changes | Member lists, EDGE-6 |
| Room state changes | Conversation header, permission changes (SUX-9, EDGE-13) |
| Room account data | Favourites, notification settings, drafts scope |
| Connection / sync state | CMP-45, SUX-5 – SUX-8 |
| Local echo updates | Message state progression (COM-5) |

---

## 10. Services That Will Change

All changes are **additive within the existing Service Layer** (Blueprint §4). No service is removed, no layer boundary is crossed, and the bridge is untouched.

| Service | Change | Blueprint compliance |
|---|---|---|
| `MatrixRoomService` | Expose room metadata required by conversation list and header: topic, member count, tags, notification level | Layer 3, unchanged position |
| `MatrixTimelineService` | Pagination support; grouping metadata; unavailable-message representation | Layer 3 |
| `MatrixMessageService` | Attachment sending; message state progression; queued send | Layer 3 |
| `MatrixUserService` | Extend to profile data and presence for display | Layer 3 |
| **New:** presence service | Presence retrieval and observation | New Layer 3 service, same pattern |
| **New:** typing service | Typing notification send and observe | New Layer 3 service |
| **New:** receipt service | Read marker send; acknowledgement summary | New Layer 3 service |
| **New:** file service | Upload, progress, cancel, download | New Layer 3 service |
| **New:** search service | Query, filter, result mapping | New Layer 3 service |
| **New:** notification service | Unread model, mentions, per-conversation settings | New Layer 3 service |
| **New:** organisation service | Organisation configuration retrieval and scoping | New Layer 3 service |
| `MatrixClientService`, `MatrixClientBridge`, `SessionService`, `BootstrapCoordinator`, `SessionBootstrapService` | **No change** | Protected (§6.1) |

## 11. Hooks That Will Change

| Hook | Change |
|---|---|
| `useMessages` | Message state, pagination, queued send, attachment send |
| `useSovereignData` | Split by domain; Production Mode integrity; remove fixture returns from production paths |
| **New** | `useConversations`, `usePresence`, `useTyping`, `useReceipts`, `useUpload`, `useSearch`, `useNotifications`, `useOrganisation`, `useProfile`, `useConnectionState` |

Hooks must not import platform SDK modules directly (Blueprint §8, Rule 2).

## 12. UI Components That Will Change

Summarised in §6 and §7. In total: **15 components redesigned**, **6 retained unchanged**, **53 components specified in Appendix C** of which approximately **38 are new**.

---

## 13. Test Strategy

| Level | Coverage | Owner |
|---|---|---|
| **Component** | Every component in Appendix C in every state defined by UI-5 / TOK-16; visual review against the design system | Engineering + Design |
| **State machine** | Every transition in Appendix D exercised, including invalid transitions | Engineering |
| **Integration** | Each acceptance criterion AC-1 – AC-36 as a scripted scenario | QA |
| **Two-user realtime** | Automated, headless, two concurrent authenticated sessions: send, receive, typing, presence, receipts, file exchange | QA |
| **Edge case** | All EDGE-1 – EDGE-18, including synthetic 5,000-conversation and 100,000-message datasets | QA |
| **Error catalogue** | Every ERR-1 – ERR-20 reproducible on demand with specified copy | QA |
| **Accessibility** | Automated WCAG 2.1 AA scan plus manual keyboard-only and screen-reader passes | QA |
| **Performance** | All PERF-1 – PERF-11 measured on minimum specification hardware | QA |
| **Localisation** | 100% string coverage in Uzbek and Russian; no hardcoded text | Product |
| **Regression** | AC-23 – AC-26 at the end of every phase | QA |

**Test data requirement.** Synthetic datasets for EDGE-1 and EDGE-2, and a controlled means of setting role data for R-6, must exist before P4 acceptance.

## 14. Regression Checklist

Executed at the end of **every phase**, not only at sprint end.

| # | Check | Source |
|---|---|---|
| 1 | Sign-in succeeds for all roles | AC-23 |
| 2 | Session restore on reload | AC-23 |
| 3 | Message send succeeds | AC-23 |
| 4 | Message receive succeeds | AC-23 |
| 5 | Two-user realtime delivery without refresh | AC-23 |
| 6 | Conversation switching preserves state | AC-23, NAV-10 |
| 7 | Demo Mode fully operational | AC-24, ADR-004 |
| 8 | Exactly one client instance and one sync loop | AC-25, Blueprint §5 |
| 9 | No protected system modified | AC-26, §6.1 |
| 10 | No fixture data visible in Production Mode | AC-8 |
| 11 | No layer boundary violation | Blueprint §8 |
| 12 | No platform SDK import in UI or hooks | Blueprint §15 Rule 2 |

## 15. Acceptance Strategy

1. **Phase gate.** Each phase completes only when its deliverables and the §14 regression checklist pass.
2. **Environment.** All acceptance in Production Mode, against the live homeserver, on minimum specification hardware, with at least two concurrent real users.
3. **Evidence.** Every acceptance criterion produces a recorded artefact: scripted result, screenshot, or measurement. Verbal confirmation is not acceptance.
4. **Two-role validation.** Every criterion affected by permissions is validated as both Xodim and Rahbar.
5. **Sprint acceptance.** All 36 acceptance criteria pass, all 27 deliverables complete, all regression checks green.
6. **Stakeholder acceptance.** D-22 demonstration to ministry stakeholders using real pilot department data.

---

## 16. Suggested Sprint 3 Milestones

| Milestone | Contents | Demonstrable outcome |
|---|---|---|
| **M1 — Design Foundation** | P0 complete | Design system and component library reviewable; application visually unchanged |
| **M2 — Truthful Product** | P1 complete | No fabricated data in Production Mode; every surface has four honest states; disconnection and session expiry handled gracefully |
| **M3 — Structured Product** | P2 complete | New navigation and conversation list; second department added by configuration; all three breakpoints working |
| **M4 — Real-Time Product** | P3 complete | Typing, presence, read receipts, and file exchange working between two real users |
| **M5 — Sprint 3 Complete** | P4 complete | Search, notifications, profiles; accessibility, performance, edge case, and regression reports signed off |

## 17. Recommended Git Commit Plan

Following Blueprint §15 Rule 5 (small, validated steps). One logical change per commit; every commit leaves the application working.

| Milestone | Commit sequence |
|---|---|
| **M1** | `design: define token specification` → `design: add icon set` → `feat(ui): foundation components` → `feat(ui): state components` |
| **M2** | `fix(data): honour production mode in <module>` *(one commit per module)* → `feat(ui): per-surface empty and unavailable states` → `feat(ui): error catalogue presentation` → `feat(ux): connection state banner` → `feat(ux): session expiry and security notices` → `feat(messaging): queued send while disconnected` |
| **M3** | `feat(org): organisation configuration model` → `feat(nav): hierarchy sidebar` → `feat(nav): breadcrumbs` → `feat(nav): conversation list` → `refactor(chat): split ChatArea into header, timeline, composer` → `feat(ui): responsive frame` |
| **M4** | `feat(presence): presence service and indicators` → `feat(typing): typing indicator` → `feat(receipts): read receipts` → `feat(receipts): directive acknowledgement summary` → `feat(files): attachment selection and upload progress` → `feat(files): file cards, previews, download` |
| **M5** | `feat(search): search service and panel` → `feat(notifications): unread model` → `feat(notifications): notification centre` → `feat(profile): user profiles` → `fix(a11y): <area>` *(several)* → `perf: <area>` *(several)* → `docs: sprint 3 validation reports` |

**Commit rules.** No commit mixes design tokens with feature work. No commit modifies a protected system. Regression checklist §14 items 7–9 verified before any commit touching the conversation surface.

## 18. Definition of Done per Milestone

| Milestone | Definition of Done |
|---|---|
| **M1** | All token categories in Appendix A defined for three themes · CMP-1 – CMP-8, CMP-51, CMP-52 implemented with every state · no literal colour value outside token definitions (AC-16) · no decorative emoji as iconography (TOK-13) · design system documented and approved by Design Lead · regression checklist passes |
| **M2** | AC-8, AC-9, AC-30, AC-31, AC-32 pass · every surface in §8.11 demonstrates four states with specified Uzbek copy · every error in Appendix B reproducible with specified copy and next action · AC-27, AC-28 pass · no fixture data in Production Mode · regression checklist passes |
| **M3** | AC-14, AC-17 pass · second department added by configuration only, no code change · conversation list replaces the selection control · breadcrumbs navigable at every level · all three breakpoints functional · AC-29 passes · regression checklist passes |
| **M4** | AC-1 – AC-7 pass with two concurrent real users · AC-18 passes · all Appendix D transitions for typing, presence, upload, and message demonstrable (AC-36 partial) · file size and type policy enforced with specified messaging · regression checklist passes |
| **M5** | AC-10 – AC-13, AC-15, AC-19 – AC-22, AC-33 – AC-36 pass · all 36 acceptance criteria pass · all 27 deliverables complete · WCAG 2.1 AA scan reports no A or AA failures · all PERF targets measured and met · edge case and regression reports signed off · localisation complete · stakeholder demonstration delivered |

---

## Readiness Assessment

| Area | Status |
|---|---|
| Requirements specified and traceable | ✅ Ready — 488 identified requirements, 36 acceptance criteria, full ID traceability |
| Scope boundaries defined | ✅ Ready — protected systems and deferred sprints explicitly enumerated |
| Blueprint compliance | ✅ Ready — no conflict; Blueprint §9 Sprint 3 mandate fully contained in P3 |
| Implementation order defined | ✅ Ready — 31 sequenced work items with dependencies |
| Test and acceptance strategy | ✅ Ready — per-phase regression, evidence-based acceptance |
| **Open items requiring Product decision before P3** | ⚠️ **4 items — see below** |

### Decisions Required Before Implementation Begins

| # | Decision | Blocks | Owner |
|---|---|---|---|
| **1** | Read receipt semantics for directive acknowledgement (R-2) | D-8, P3 | Product + pilot department |
| **2** | Search scope over encrypted conversations (R-4) | D-10, P4 | Product + Architecture |
| **3** | File size limit and permitted file types (R-10) | D-9, P3 | Product + Security |
| **4** | Means of setting role data for acceptance testing (R-6) | Any Manager-role criterion | Product + Engineering |

Items 1 and 3 are required before **P3** begins. Item 2 is required before **P4**. Item 4 is required before any acceptance run involving a Manager.

**None of the four blocks P0, P1, or P2.** Implementation can begin immediately on the design foundation and truthful-surfaces phases while these decisions are resolved.

---

*Sovereign Messenger — Sprint 3 Implementation Readiness Review v1.0*
*Companion to SPRINT_3_PRODUCT_REQUIREMENTS.md · Governed by PROJECT_BLUEPRINT_V2.md*
