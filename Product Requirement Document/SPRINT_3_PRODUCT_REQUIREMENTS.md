# Sovereign Messenger — Sprint 3 Product Requirements Document

| Field | Value |
|---|---|
| **Document** | SPRINT_3_PRODUCT_REQUIREMENTS.md |
| **Version** | 1.1 |
| **Status** | Official Development Specification |
| **Sprint** | Sprint 3 — Product Quality & Government Experience |
| **Governing Document** | `PROJECT_BLUEPRINT_V2.md` (Architectural Constitution) |
| **Audience** | Software Engineers · UI/UX Designers · Product Managers · QA Engineers · Government Stakeholders |
| **Language of Product** | O'zbek tili (primary), Russian (secondary) |
| **Deployment Context** | Government of the Republic of Uzbekistan — internal, sovereign, air-gapped network |

> **Precedence.** Where this document and `PROJECT_BLUEPRINT_V2.md` differ, the Blueprint prevails. This PRD specifies product behaviour within the Sprint 3 boundary defined by Blueprint §9. It does not alter the roadmap, sprint boundaries, or architecture.

---

## 1. Vision

Sovereign Messenger is the official internal communication platform of the Government of the Republic of Uzbekistan. It gives every state employee — from a field investigator in Samarqand to a ministry director in Tashkent — a single, secure, sovereign place to communicate and coordinate official work.

The platform is built on sovereign infrastructure that the state fully controls, and presents that infrastructure through an interface that requires no technical training. A government employee who has used a consumer messenger must be productive on the first day, without instruction.

Sprint 3 advances the platform from *technically functional* to *professionally credible*. After Sprint 3, Sovereign Messenger should be recognisable as an official government system — in appearance, in behaviour, and in the confidence it inspires in the people whose work depends on it.

---

## 2. Sprint Objective

**Transform Sovereign Messenger from a technically functional Matrix client into a professional government collaboration platform, while preserving all existing backend architecture, Matrix integrations, protocols, authentication, and messaging functionality.**

Sprint 3 is a **product quality sprint**. Its output is measured in the daily experience of a government employee, not in new infrastructure.

Sprint 3 delivers the four real-time communication capabilities assigned to it by Blueprint §9 — **typing indicators, presence, read receipts, and file upload/download** — and delivers the interface, information architecture, and interaction quality required for those capabilities to be usable in a government setting.

**Sprint 3 changes what the user sees and does. It does not change how the system connects, authenticates, encrypts, or synchronises.**

---

## 3. Business Goals

| ID | Goal | Success Indicator |
|---|---|---|
| **BG-1** | Establish institutional credibility | Platform is accepted by ministry stakeholders as an official state system suitable for pilot deployment |
| **BG-2** | Enable pilot deployment in Samarqand Tergov | The pilot department can conduct real daily work on the platform without workarounds |
| **BG-3** | Eliminate the need for unauthorised consumer messengers | Employees no longer require external applications for official communication |
| **BG-4** | Minimise training cost | A new employee reaches productive use with no formal training and no manual |
| **BG-5** | Prepare the platform for multi-department expansion | The organisation model supports departments beyond the pilot without redevelopment |
| **BG-6** | Demonstrate sovereign technology capability | The platform is presentable to national leadership as evidence of domestic digital capability |

---

## 4. Product Goals

| ID | Goal |
|---|---|
| **PG-1** | Every element a user sees in Production Mode reflects authoritative data from the sovereign homeserver, or clearly communicates that information is unavailable (Blueprint §3.2) |
| **PG-2** | A user can find any conversation, person, or message within seconds |
| **PG-3** | A user always knows who is present, who is writing, and who has read official communications |
| **PG-4** | A user can exchange official documents as naturally as messages |
| **PG-5** | A user always knows their position in the organisational hierarchy and the classification of the space they are in |
| **PG-6** | The interface is consistent, professional, and unmistakably a government system |
| **PG-7** | The platform is operable by employees with visual, motor, or situational impairments |
| **PG-8** | The platform performs acceptably on the modest hardware typical of government offices |

---

## 5. Scope

Sprint 3 comprises the following workstreams. All are **in scope** and required for sprint completion.

### 5.1 Blueprint §9 Sprint 3 Capabilities (Mandatory)
| Workstream | Description |
|---|---|
| **S-1** | Typing indicators |
| **S-2** | Presence (online / offline / away / busy) |
| **S-3** | Read receipts |
| **S-4** | File upload and download experience |

### 5.2 Product Quality Workstreams
| Workstream | Description |
|---|---|
| **S-5** | Government UI redesign and professional design system |
| **S-6** | Government branding and visual identity |
| **S-7** | Information architecture restructuring |
| **S-8** | Navigation redesign |
| **S-9** | Conversation experience improvements |
| **S-10** | Channel experience improvements |
| **S-11** | Organisation hierarchy presentation |
| **S-12** | Search |
| **S-13** | User profiles |
| **S-14** | In-application notifications |
| **S-15** | Responsive design |
| **S-16** | Accessibility |
| **S-17** | Production polish and Production Mode data integrity |

---

## 6. Out of Scope

The following are explicitly **excluded** from Sprint 3. Any work touching these areas requires written approval and a Blueprint amendment.

### 6.1 Protected Systems — Must Not Be Modified
- Matrix protocol behaviour
- Synapse server, configuration, or deployment
- Authentication and login flow
- Encryption implementation (key management, verification, cryptographic behaviour)
- Matrix SDK architecture
- Matrix Client Bridge architecture (Blueprint §6)
- Existing backend APIs
- Existing production integrations
- Service Layer topology (Blueprint §4)
- Single Matrix Client Principle (Blueprint §5)
- Demo Mode and its providers (Blueprint ADR-004) — must remain fully operational

### 6.2 Deferred to Later Sprints (Blueprint §9)
| Item | Assigned Sprint |
|---|---|
| End-to-End Encryption implementation | Sprint 4 |
| Push Notifications (Sygnal / UnifiedPush) | Sprint 4 |
| Audit Trail Logs | Sprint 4 |
| Voice and Video Calls | Sprint 5 |
| Government Workflow Engine | Sprint 5 |
| Document Approval Engine | Sprint 5 |

### 6.3 Clarification of Boundary Cases
| Topic | In Sprint 3 | Not in Sprint 3 |
|---|---|---|
| **Notifications** | In-application notification experience: unread counts, badges, mute settings, notification centre | Push notification infrastructure and delivery (Sprint 4) |
| **Encryption** | Presentation of encryption status and of messages that cannot be displayed | Any change to cryptographic behaviour or key handling (Sprint 4) |
| **Government workflow** | Presentation and interaction patterns for official communication, including acknowledgement visibility | Workflow engine, approval chains, state machines (Sprint 5) |
| **Organisation hierarchy** | Configuration-driven hierarchy model and its presentation at arbitrary depth | Changes to how rooms or spaces are represented in the Matrix layer |
| **Roles** | Correct display and enforcement of role-based interface rules | Role provisioning tooling (see §8.9 Assumptions) |

---

## 7. User Personas

### Persona 1 — Aziz Rahimov, Investigator (Xodim)
| Attribute | Detail |
|---|---|
| **Age / Tenure** | 29 · 4 years in service |
| **Unit** | Samarqand viloyati → Ichki Ishlar → Tergov |
| **Device** | Shared desktop, 1366×768, older hardware; occasionally a mobile device in the field |
| **Technical skill** | Confident with consumer messengers; no technical training |
| **Primary tasks** | Read directives from leadership; coordinate with colleagues on active cases; send and receive case documents and photographs |
| **Frustrations** | Missing an important directive; not knowing whether a colleague has seen an urgent message; losing a document in a long conversation |
| **Sprint 3 needs** | Clear unread indicators · reliable search · effortless file exchange · knowing who is available |

### Persona 2 — Dilshod Qodirov, Department Head (Rahbar)
| Attribute | Detail |
|---|---|
| **Age / Tenure** | 44 · 19 years in service |
| **Unit** | Head of Tergov, Samarqand |
| **Device** | Office desktop; mobile device outside the office |
| **Technical skill** | Moderate; values speed and clarity over features |
| **Primary tasks** | Issue official directives to the department; confirm that directives have been received; monitor department activity; coordinate with other departments |
| **Frustrations** | No confirmation that subordinates have read an order; no overview of who is available; unprofessional-looking tools when presenting to superiors |
| **Sprint 3 needs** | Read receipts on official channels · departmental presence overview · authoritative, professional interface |

### Persona 3 — Nodira Yusupova, National Administrator (Milliy Administrator)
| Attribute | Detail |
|---|---|
| **Age / Tenure** | 38 · central ministry ICT |
| **Scope** | All departments nationally |
| **Technical skill** | High |
| **Primary tasks** | Configure organisational structure; oversee platform consistency across departments; support departmental onboarding |
| **Frustrations** | Structure that must be changed by developers rather than configured; inconsistent presentation between departments |
| **Sprint 3 needs** | Configuration-driven organisation hierarchy · consistent design system · full module visibility |

### Secondary Context — Duty Officer (Navbatchi)
Any Xodim may serve a duty shift. During a shift they monitor official channels continuously and must be alerted to urgent communications without watching the screen. Sprint 3 must serve this pattern through in-application notification behaviour.

---

## 8. Functional Requirements

### 8.1 Production Mode Data Integrity
Per Blueprint §3.2, demo datasets are not used in the Production Mode working process.

| ID | Requirement | Priority |
|---|---|---|
| **FR-1** | In Production Mode, every workspace module shall present data originating from the sovereign homeserver, or an explicit unavailable state. Demo datasets shall not be presented in Production Mode. | Must |
| **FR-2** | Where a module has no authoritative data source available in the current sprint, it shall present a defined "not yet available" state naming the module and its planned availability. It shall not present substitute content. | Must |
| **FR-3** | Every list surface shall implement four distinct states: loading, populated, empty, and error. | Must |
| **FR-4** | An empty result shall never be replaced by fallback content from another source. | Must |
| **FR-5** | Demo Mode shall continue to present complete demonstration datasets, unchanged in behaviour (Blueprint ADR-004). | Must |

### 8.2 Typing Indicators (Blueprint §9 · S-1)
| ID | Requirement | Priority |
|---|---|---|
| **FR-6** | The conversation view shall indicate when one or more other participants are composing a message. | Must |
| **FR-7** | The indicator shall name the participant when one person is typing, and summarise when multiple people are typing (e.g. "3 kishi yozmoqda"). | Must |
| **FR-8** | The indicator shall appear within 1 second of the participant beginning to type and disappear within 5 seconds of them stopping. | Must |
| **FR-9** | The indicator shall occupy reserved layout space so that its appearance does not shift the message timeline. | Must |
| **FR-10** | The user's own typing activity shall be communicated to other participants in conversations where they may post. | Must |
| **FR-11** | Typing activity shall not be communicated in channels where the user does not have permission to post. | Must |

### 8.3 Presence (Blueprint §9 · S-2)
| ID | Requirement | Priority |
|---|---|---|
| **FR-12** | The platform shall display the availability of each user as one of: Online, Away, Busy, Offline. | Must |
| **FR-13** | Presence shall be displayed consistently wherever a person appears: conversation header, member lists, profiles, search results, right panel. | Must |
| **FR-14** | Offline users shall display a last-seen indication where available. | Should |
| **FR-15** | A user shall be able to set their availability manually, and manual selection shall override automatic detection until cleared. | Should |
| **FR-16** | Presence shall be represented by both colour and shape or label, never colour alone (see §20). | Must |
| **FR-17** | The departmental staff panel shall present real colleagues with real presence, ordered by availability then by name. | Must |

### 8.4 Read Receipts (Blueprint §9 · S-3)
| ID | Requirement | Priority |
|---|---|---|
| **FR-18** | For direct conversations and groups, each sent message shall display a delivery and read state: sending, sent, delivered, read. | Must |
| **FR-19** | In official channels, the sender shall be able to view how many recipients and which recipients have read a given message. | Must |
| **FR-20** | The read state of a directive shall be presentable as a summary suitable for a department head: total recipients, number who have read, list of those who have not. | Must |
| **FR-21** | Read receipts shall be sent when a message becomes visible in the viewport and the application window has focus. | Must |
| **FR-22** | Failure to send a message shall be clearly and persistently indicated, with an explicit retry action. | Must |

### 8.5 File Upload and Download (Blueprint §9 · S-4)
| ID | Requirement | Priority |
|---|---|---|
| **FR-23** | A user shall be able to attach one or more files to a message via file picker, drag-and-drop, or clipboard paste. | Must |
| **FR-24** | Before sending, the user shall see the filename, file size, and type of each attachment, and be able to remove any attachment. | Must |
| **FR-25** | Upload progress shall be displayed per file, with the ability to cancel an in-progress upload. | Must |
| **FR-26** | Images shall be presented as inline previews in the conversation; other files shall be presented as document cards showing filename, size, type, sender, and time. | Must |
| **FR-27** | A user shall be able to download any file they can see, and open images in a full-size viewer. | Must |
| **FR-28** | The platform shall enforce a maximum file size and communicate it before upload begins. Rejection shall state the reason and the limit. | Must |
| **FR-29** | Unsupported or disallowed file types shall be rejected with a clear explanation. | Must |
| **FR-30** | Failed uploads shall be recoverable through an explicit retry action without re-selecting the file. | Must |
| **FR-31** | The Documents module shall present files shared within the current department, filterable by type, sender, and date. | Should |

### 8.6 Conversation Experience (S-9)
| ID | Requirement | Priority |
|---|---|---|
| **FR-32** | Consecutive messages from the same sender within a short interval shall be visually grouped, with the sender shown once. | Must |
| **FR-33** | Date separators shall divide the timeline by day, using relative labels where appropriate ("Bugun", "Kecha"). | Must |
| **FR-34** | Each message shall display the sender's actual name and organisational role. | Must |
| **FR-35** | A message that cannot be displayed shall be presented as a distinct interface state, visually separate from message content, explaining that the message is unavailable and why. | Must |
| **FR-36** | The timeline shall load earlier messages as the user scrolls upward, preserving scroll position. | Must |
| **FR-37** | A persistent "new messages" divider shall mark the boundary between read and unread messages on entering a conversation. | Must |
| **FR-38** | A user shall be able to reply to a specific message, with the quoted message shown above the reply and navigable on click. | Should |
| **FR-39** | The composer shall support multi-line input, with a defined send action and a defined newline action. | Must |
| **FR-40** | The composer shall retain unsent draft text per conversation when the user navigates away and returns. | Should |
| **FR-41** | A user shall be able to copy message text, and to copy a link to a specific message. | Should |

### 8.7 Channel Experience (S-10)
| ID | Requirement | Priority |
|---|---|---|
| **FR-42** | Official channels and working groups shall be visually and structurally distinguishable at every point in the interface. | Must |
| **FR-43** | In an announcement channel, a user without posting permission shall see a clear, non-punitive explanation in place of the composer. | Must |
| **FR-44** | Each conversation shall present a header showing name, type, participant count, and topic where defined. | Must |
| **FR-45** | A user shall be able to view the full participant list of any conversation they belong to, with roles and presence. | Must |
| **FR-46** | A user shall be able to mute a conversation, and muted conversations shall be visually distinct and excluded from notification counts. | Must |
| **FR-47** | A user shall be able to mark a conversation as a favourite, and favourites shall be accessible as a distinct grouping. | Must |
| **FR-48** | Pinned messages shall be viewable per conversation via a dedicated affordance in the conversation header. | Must |

### 8.8 Notifications — In-Application (S-14)
| ID | Requirement | Priority |
|---|---|---|
| **FR-49** | Each conversation shall display an unread message count, and unread counts shall aggregate to the organisational and module levels. | Must |
| **FR-50** | Direct mentions of the user shall be visually distinguished from ordinary unread messages at every level. | Must |
| **FR-51** | The platform shall provide a notification centre listing recent mentions, direct messages, and official channel activity, each navigable to its source. | Must |
| **FR-52** | Notification preferences shall be settable per conversation: all messages, mentions only, or none. | Must |
| **FR-53** | Messages designated urgent in official channels shall be visually elevated and shall bypass conversation-level muting. | Should |
| **FR-54** | Unread state shall persist correctly across sessions and devices. | Must |

### 8.9 Assumptions and Dependencies
| ID | Statement |
|---|---|
| **AS-1** | Organisational role for each user is available to the application from the existing identity data source. Provisioning tooling for assigning roles is not delivered in Sprint 3; where role data is absent, the interface shall apply the least-privileged role. |
| **AS-2** | Message search relies on the search capability already provided by the existing homeserver deployment. Sprint 3 consumes this capability; it does not modify it. |
| **AS-3** | Presence, typing, and read receipt data are available through existing platform integrations. Sprint 3 presents this data; it does not alter its transport. |
| **AS-4** | The pilot deployment is Samarqand viloyati → Ichki Ishlar → Tergov. The organisation model must not assume this is the only branch. |

### 8.10 Security Experience Requirements

These requirements specify **only how the interface communicates security-relevant situations to the user**. They introduce no change to authentication, encryption, Matrix protocol behaviour, Synapse, or any backend system (§6.1). The underlying conditions already exist; Sprint 3 defines their presentation.

| ID | Requirement | Priority |
|---|---|---|
| **SUX-1** | Security situations shall be communicated in plain Uzbek describing the situation and the user's next action. Protocol names, error codes, internal identifiers, and technical vocabulary shall not be shown. | Must |
| **SUX-2** | **Session expired** — The interface shall present a clear notice that the working session has ended and shall offer a single action to sign in again. Unsent composed text shall be preserved and restored after re-entry (UX-9). | Must |
| **SUX-3** | **Authentication required** — Where an action cannot proceed because the session is no longer valid, the interface shall state this before the action is attempted, not after silent failure. | Must |
| **SUX-4** | **Another device signed in** — When the account is used on an additional device, the interface shall present a non-blocking informational notice identifying the device type and time, with a link to the session list (PR-8). | Should |
| **SUX-5** | **Connection lost** — Loss of connectivity shall be indicated by a persistent, non-blocking banner. The interface shall remain readable, previously loaded content shall remain visible, and recovery shall occur automatically without user action. | Must |
| **SUX-6** | Messages composed while disconnected shall be queued, shown in a pending state, and sent automatically on reconnection. The user shall be able to cancel a queued message. | Must |
| **SUX-7** | **Homeserver unavailable** — Server unavailability shall be presented distinctly from local connectivity loss, so the user understands whether the problem is their network or the system. | Must |
| **SUX-8** | Reconnection shall be confirmed briefly and unobtrusively, and the banner shall clear automatically. | Must |
| **SUX-9** | **Permission changed during session** — A change to the user's posting rights shall take effect in the interface without requiring a reload, and shall be explained in one neutral sentence at the point of effect. | Must |
| **SUX-10** | **Access denied** — Where a user is not authorised for a resource, the interface shall state that access is not available, without disclosing the existence, name, or content of the protected resource. | Must |
| **SUX-11** | **Upload blocked** — A rejected upload shall state the reason and the applicable limit before or immediately upon rejection, and shall not consume the user's attachment selection (FR-28, FR-29). | Must |
| **SUX-12** | **Message unavailable** — A message that cannot be displayed shall be rendered in the defined interface state established by FR-35, stating in plain language that the message cannot be shown and why, without cryptographic terminology. | Must |
| **SUX-13** | **Rate limited** — Where the system temporarily declines further requests, the interface shall explain that the action was performed too frequently and indicate when it may be retried. | Must |
| **SUX-14** | Security notices requiring user action shall remain accessible until resolved and shall not be dismissible into invisibility. Informational notices shall be dismissible. | Must |
| **SUX-15** | No security situation shall cause loss of composed text, scroll position, or the user's current organisational context. | Must |
| **SUX-16** | The interface shall display the current connection state at all times in a consistent location. | Must |

### 8.11 Empty and Unavailable State Specification

This section specifies the four states required by **FR-3** for each surface, and distinguishes *empty* (the surface works, there is nothing to show) from *unavailable* (the surface has no authoritative data source in this sprint, per FR-2).

| ID | Requirement | Priority |
|---|---|---|
| **ES-1** | Every surface listed in the table below shall implement all four states: loading, empty, unavailable, error. | Must |
| **ES-2** | *Empty* and *unavailable* shall be visually and textually distinct. Empty means "nothing here yet"; unavailable means "this is not part of the current release". | Must |
| **ES-3** | No state shall be satisfied by presenting demonstration data in Production Mode (FR-1). | Must |
| **ES-4** | Every empty state shall offer the most relevant next action where one exists. | Must |
| **ES-5** | Every error state shall offer an explicit retry action (Appendix B). | Must |
| **ES-6** | Loading states shall reserve the final layout dimensions to prevent content shift (UX-13). | Must |
| **ES-7** | All state copy shall be provided in Uzbek and Russian (NFR-3). | Must |

**Required state copy — Uzbek (primary).** Russian equivalents to be supplied during localisation (D-20).

| Surface | Loading | Empty | Unavailable | Error |
|---|---|---|---|---|
| **Conversation list** | Yuklanmoqda… | Suhbatlar yo'q | — | Suhbatlarni yuklab bo'lmadi |
| **Channels** | Yuklanmoqda… | Kanallar yo'q | — | Kanallarni yuklab bo'lmadi |
| **Groups** | Yuklanmoqda… | Guruhlar yo'q | — | Guruhlarni yuklab bo'lmadi |
| **Direct chats** | Yuklanmoqda… | Shaxsiy suhbatlar yo'q | — | Suhbatlarni yuklab bo'lmadi |
| **Message timeline** | Xabarlar yuklanmoqda… | Hali xabarlar yo'q | — | Xabarlarni yuklab bo'lmadi |
| **Search** | Qidirilmoqda… | Natija topilmadi | — | Qidiruvni yakunlab bo'lmadi |
| **People / Members** | Yuklanmoqda… | Xodimlar yo'q | — | Xodimlar ro'yxatini yuklab bo'lmadi |
| **Documents** | Yuklanmoqda… | Hujjatlar yo'q | — | Hujjatlarni yuklab bo'lmadi |
| **Notifications** | Yuklanmoqda… | Bildirishnomalar yo'q | — | Bildirishnomalarni yuklab bo'lmadi |
| **Departments / Organisation** | Yuklanmoqda… | Bo'limlar yo'q | — | Tuzilmani yuklab bo'lmadi |
| **Pinned messages** | Yuklanmoqda… | Mahkamlangan xabarlar yo'q | — | Yuklab bo'lmadi |
| **Favourites** | Yuklanmoqda… | Sevimlilar yo'q | — | Yuklab bo'lmadi |
| **Files in conversation** | Yuklanmoqda… | Fayllar yo'q | — | Fayllarni yuklab bo'lmadi |
| **Profile** | Yuklanmoqda… | — | — | Profilni yuklab bo'lmadi |
| **Tasks, Calendar, Dashboard, Cases, Suspects, Evidence, Records, Court materials** | — | — | Ushbu bo'lim keyingi bosqichda taqdim etiladi | — |

### 8.12 Edge Case Behaviour Specification

Defines expected product behaviour in unusual but foreseeable conditions. These are behavioural requirements for the interface; they require no architectural change.

| ID | Condition | Required behaviour | Priority |
|---|---|---|---|
| **EDGE-1** | Very large conversation list (5,000+) | List shall remain responsive through progressive rendering; search and filter shall remain usable; scroll shall not degrade (PERF-10). | Must |
| **EDGE-2** | Very long message history (100,000+) | Timeline shall load in segments; memory shall remain bounded (PERF-9); jumping to a message shall not require loading all intervening history. | Must |
| **EDGE-3** | Very slow network | All asynchronous surfaces shall show progress; no operation shall appear frozen; operations exceeding 3 s shall be cancellable (UX-6). | Must |
| **EDGE-4** | Very large images | Images shall be presented at bounded display size with progressive or placeholder loading; full resolution shall load only on explicit open. | Must |
| **EDGE-5** | Duplicate notifications | The same message shall never produce more than one unread increment or notification entry, regardless of delivery path. | Must |
| **EDGE-6** | Deleted or deactivated user | Historical messages shall remain readable and attributed; the person shall be shown in an inactive treatment; direct conversation shall become read-only with an explanation. | Must |
| **EDGE-7** | Removed or inaccessible conversation | The conversation shall be removed from active lists with a single explanatory notice; the user shall not be left on a broken screen. | Must |
| **EDGE-8** | Deleted or unavailable attachment | The file card shall persist showing the original filename with an unavailable state; download shall be disabled with an explanation. | Must |
| **EDGE-9** | Multiple browser tabs | Unread counts, read state, and drafts shall remain consistent across tabs; a message read in one tab shall not remain unread in another. | Must |
| **EDGE-10** | Multiple devices | Read state and notification state shall reconcile across devices without duplicate or lost notifications (NT-8). | Must |
| **EDGE-11** | Offline then reconnect | Queued messages shall send in original order; missed messages shall be retrieved; the unread divider shall be positioned correctly (SUX-6, FR-37). | Must |
| **EDGE-12** | Temporary server outage | The interface shall remain usable in a read-only capacity with previously loaded content; recovery shall be automatic (SUX-7, SUX-8). | Must |
| **EDGE-13** | Permission change during active session | Composer availability and module visibility shall update without reload; any in-progress composition shall be preserved and the user informed (SUX-9). | Must |
| **EDGE-14** | Organisational reassignment during session | The user's context shall update to their new position with a clear notice; they shall not retain visibility of their former department's data. | Must |
| **EDGE-15** | Clock skew between client and server | Message ordering shall follow server ordering, not local time; displayed times shall remain monotonic within a conversation (COM-8). | Should |
| **EDGE-16** | Extremely long single message or filename | Content shall wrap or truncate with a means to view in full; layout shall not break. | Must |
| **EDGE-17** | Rapid conversation switching | Only the most recently requested conversation shall render; superseded requests shall not overwrite the visible timeline. | Must |
| **EDGE-18** | Simultaneous uploads | Multiple concurrent uploads shall each show independent progress and be independently cancellable (FR-25). | Must |

---

## 9. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| **NFR-1** | The platform shall operate correctly in the browsers approved for government workstations. | Chrome/Chromium and Firefox, current and previous major version |
| **NFR-2** | The platform shall operate on the minimum government workstation specification. | 4 GB RAM, dual-core, 1366×768 |
| **NFR-3** | The interface shall be fully available in Uzbek. Russian shall be selectable. | 100% string coverage, no untranslated strings |
| **NFR-4** | No text shall be hardcoded in the interface; all user-facing text shall be localisable. | Verified by review |
| **NFR-5** | The platform shall function on an air-gapped network with no external requests of any kind. | Zero external network requests |
| **NFR-6** | The platform shall degrade gracefully when the homeserver is unreachable, indicating connection state and recovering automatically. | Verified by test |
| **NFR-7** | All interface behaviour shall be consistent between Demo Mode and Production Mode; only the data source differs. | Verified by review |
| **NFR-8** | The platform shall not display technical error text, internal identifiers, or protocol terminology to end users. | Verified by review |
| **NFR-9** | Visual design shall be defined by a single design token system; no ad-hoc styling values. | Verified by review |
| **NFR-10** | The platform shall retain full functionality at 200% browser zoom. | Verified by test |

---

## 10. UX Requirements

| ID | Requirement |
|---|---|
| **UX-1** | The user shall always be able to answer three questions without navigating: *Where am I in the organisation? What am I looking at? What needs my attention?* |
| **UX-2** | The primary content column shall be the dominant surface. Supporting panels shall be secondary, collapsible, and shall not compete with it for width. |
| **UX-3** | The user shall be able to focus a single conversation at full width. |
| **UX-4** | Destructive or irreversible actions shall require confirmation and shall state the consequence. |
| **UX-5** | Every action shall produce visible feedback within 100 ms. |
| **UX-6** | Operations exceeding 500 ms shall present progress; operations exceeding 3 seconds shall be cancellable. |
| **UX-7** | Error messages shall state what happened, why, and what the user can do next, in plain Uzbek without technical vocabulary. |
| **UX-8** | Permissions shall be communicated by absence, not by disabled controls (Blueprint §4). Where absence would confuse, a brief explanation shall be shown. |
| **UX-9** | The user shall never lose composed text due to navigation, error, or connection loss. |
| **UX-10** | Frequent actions shall be reachable in no more than two interactions from the default view. |
| **UX-11** | The interface shall be operable entirely by keyboard. |
| **UX-12** | First use shall require no instruction: the default view shall present the user's department, its channels, and its people. |
| **UX-13** | Layout shall not shift after content loads; space shall be reserved for asynchronous content. |
| **UX-14** | Time shall be displayed in the user's local time, with relative labels for recent items and absolute values on hover or focus. |

---

## 11. UI Requirements

### 11.1 Design System (S-5)
| ID | Requirement |
|---|---|
| **UI-1** | A single documented design system shall govern all interface surfaces, defining colour, typography, spacing, elevation, border treatment, and motion. |
| **UI-2** | All colour values shall be defined as named semantic tokens. No literal colour values shall appear outside the token definitions. |
| **UI-3** | Spacing shall follow a defined scale. Arbitrary spacing values shall not be used. |
| **UI-4** | A typographic scale shall define all text roles with fixed size, weight, and line height. |
| **UI-5** | A component library shall define the standard states of every interactive element: default, hover, focus, active, disabled, loading, error. |
| **UI-6** | Both dark and light themes shall be supported, and a high-contrast theme shall be provided. |
| **UI-7** | Decorative emoji shall not be used as institutional iconography. A single professional icon set with consistent weight and grid shall be used throughout. |

### 11.2 Government Branding (S-6)
| ID | Requirement |
|---|---|
| **UI-8** | The State Emblem of the Republic of Uzbekistan shall be presented in the application header according to state usage rules, and on the authentication screen. |
| **UI-9** | The interface shall carry a consistent institutional identity: official name, department context, and state visual language. |
| **UI-10** | The visual tone shall be authoritative and restrained. Consumer-messenger conventions such as animated stickers, playful illustration, and decorative gradients shall not be used. |
| **UI-11** | A designated region of the application frame shall be reserved for the display of organisational and sensitivity context. |
| **UI-12** | Print and export output shall carry the official identity of the issuing department. |

### 11.3 Layout and Responsive Design (S-15)
| ID | Requirement |
|---|---|
| **UI-13** | The interface shall support three breakpoints: compact (below 768 px), standard (768–1279 px), and wide (1280 px and above). |
| **UI-14** | At wide, the organisational sidebar, primary content column, and one supporting panel may be displayed simultaneously. |
| **UI-15** | At standard, supporting panels shall be collapsible and overlay rather than compress the primary column. |
| **UI-16** | At compact, the interface shall present one surface at a time with explicit navigation between them. |
| **UI-17** | Interactive targets shall be no smaller than 44×44 px on touch-capable devices. |
| **UI-18** | Panel widths adjusted by the user shall persist across sessions. |
| **UI-19** | Message density shall be user-selectable between comfortable and compact. |

---

## 12. Information Architecture

The platform organises information in three planes. Every screen belongs to exactly one plane, and the user's position in each plane is always visible.

### 12.1 Plane 1 — Organisation ("Where am I")
Hierarchical: Republic → Viloyat → Idora → Bo'lim → Workspace.

| ID | Requirement |
|---|---|
| **IA-1** | The organisation hierarchy shall be defined by configuration data, not embedded in the interface. |
| **IA-2** | The hierarchy shall render correctly at arbitrary depth and breadth without interface changes. |
| **IA-3** | The user's current position in the hierarchy shall be visible at all times. |
| **IA-4** | A user shall see only the branches of the hierarchy to which they have access. |
| **IA-5** | Adding a department shall require configuration only, not development. |

### 12.2 Plane 2 — Communication ("Who am I speaking with")
| Type | Purpose | Posting |
|---|---|---|
| **Rasmiy kanal** (Official channel) | Directives, orders, announcements | Leadership only |
| **Ishchi guruh** (Working group) | Departmental collaboration | All members |
| **Shaxsiy suhbat** (Direct) | Person to person | Both participants |

| ID | Requirement |
|---|---|
| **IA-6** | The three conversation types shall be distinguishable by structure and label, not by icon alone. |
| **IA-7** | Conversations shall be grouped by type, and within type ordered by most recent activity. |
| **IA-8** | Favourites and pinned conversations shall appear above all other groupings. |

### 12.3 Plane 3 — Work ("What am I working on")
Modules presenting departmental working material.

| ID | Requirement |
|---|---|
| **IA-9** | Modules shall be scoped to the current organisational position; a user shall never see another department's material through a module. |
| **IA-10** | Modules shall be grouped as *Communication*, *Work*, and *Personal*. Application configuration shall be separated from content modules. |
| **IA-11** | Modules without an authoritative data source in the current sprint shall be presented in their defined unavailable state (FR-2), or hidden by configuration. |
| **IA-12** | Module grouping and order shall be defined by configuration. |

---

## 13. Navigation

| ID | Requirement |
|---|---|
| **NAV-1** | The organisational sidebar shall present the hierarchy and the module list for the current position, and shall be collapsible. |
| **NAV-2** | The conversation list shall replace the current selection control and shall display, per conversation: type indicator, name, last message preview, time of last activity, unread count, and muted or favourite state. |
| **NAV-3** | The conversation list shall be filterable by type and sortable by recent activity or name. |
| **NAV-4** | A global search entry point shall be present in the application header and reachable by keyboard shortcut from anywhere. |
| **NAV-5** | Breadcrumbs shall show the full organisational path to the current context and shall be navigable at each level. |
| **NAV-6** | The interface shall provide a recent-items list of the most recently visited conversations and modules. |
| **NAV-7** | Browser navigation controls (back and forward) shall behave predictably and shall not lose user context. |
| **NAV-8** | Every conversation, module, and message shall be addressable by a stable internal link that can be shared with another authorised user. |
| **NAV-9** | A defined set of keyboard shortcuts shall cover search, conversation switching, next unread, composer focus, and closing panels. A discoverable shortcut reference shall be available. |
| **NAV-10** | Switching conversations shall preserve the scroll position and draft of the conversation being left. |

---

## 14. Government Workflow

Sprint 3 delivers the **presentation and interaction patterns** that official government communication requires. The workflow engine, approval chains, and case lifecycle management are assigned to Sprint 5 (Blueprint §9) and are not delivered here.

### 14.1 Official Directive Pattern
| ID | Requirement |
|---|---|
| **GW-1** | Official channels shall present a formal message treatment distinct from conversational messages: issuing department, issuing officer and role, date of issue. |
| **GW-2** | The issuer of a directive shall be able to view its acknowledgement state: how many recipients have read it, and which recipients have not. |
| **GW-3** | Acknowledgement state shall be presentable as a summary suitable for reporting to leadership. |
| **GW-4** | Directives shall be pinnable and shall remain accessible independently of timeline position. |

### 14.2 Departmental Awareness
| ID | Requirement |
|---|---|
| **GW-5** | A department head shall be able to see, in one place, the current availability of their department's staff. |
| **GW-6** | The departmental view shall indicate the duty officer where that assignment is expressed in the underlying data. |

### 14.3 Official Document Exchange
| ID | Requirement |
|---|---|
| **GW-7** | Documents shared in official channels shall display issuing context: sender, role, department, and date. |
| **GW-8** | The Documents module shall present departmental documents in a formal list suitable for official reference, with filtering by type, sender, and date. |
| **GW-9** | Document presentation shall accommodate a sensitivity marking supplied by the underlying data, where present. Definition and enforcement of a classification scheme is out of scope for Sprint 3. |

### 14.4 Hierarchy Awareness
| ID | Requirement |
|---|---|
| **GW-10** | A person's organisational role shall be displayed wherever they appear. |
| **GW-11** | Role shall be presented using official designations, not system terminology. |

---

## 15. Communication Model

| ID | Requirement |
|---|---|
| **COM-1** | The platform shall support three conversation types as defined in §12.2, with distinct interface treatments. |
| **COM-2** | Posting permission shall be enforced consistently: a user who may not post shall not be presented with a composer in any surface. |
| **COM-3** | Where a user may not post, the interface shall explain the rule in a single neutral sentence. |
| **COM-4** | Conversation membership shall be visible to all participants, showing name, role, and presence. |
| **COM-5** | Message states shall be defined and consistently represented across all conversation types: sending, sent, delivered, read, failed. |
| **COM-6** | Messages that cannot be displayed shall be rendered as a defined interface state, never as message text (FR-35). |
| **COM-7** | The composer shall communicate the current conversation and posting permission at all times. |
| **COM-8** | Message ordering shall be stable and consistent; a message shall not change position after being displayed. |

---

## 16. Organization Model

| ID | Requirement |
|---|---|
| **ORG-1** | The organisational structure shall be expressed as configuration data describing nodes, their parent relationships, their type, and their display name in each supported language. |
| **ORG-2** | Node types shall include at minimum: Republic, Viloyat, Idora, Bo'lim, Workspace. |
| **ORG-3** | The interface shall render any valid hierarchy without modification, including hierarchies deeper or broader than the pilot. |
| **ORG-4** | Each user shall be associated with a position in the hierarchy, and that position shall determine their default context on sign-in. |
| **ORG-5** | A user shall be able to navigate only to hierarchy nodes for which they are authorised. |
| **ORG-6** | Each node shall be able to declare which modules are enabled for it. |
| **ORG-7** | The organisational display name, code, and identity of the current node shall be visible in the interface frame. |
| **ORG-8** | The model shall support a second department being added during Sprint 3 acceptance testing as a configuration-only exercise. |

---

## 17. Search

| ID | Requirement |
|---|---|
| **SR-1** | A single global search shall cover conversations, people, messages, and files. |
| **SR-2** | Search shall be reachable from any screen by keyboard shortcut and by a persistent header control. |
| **SR-3** | Results shall be grouped by category, with the most relevant category presented first. |
| **SR-4** | Each result shall display sufficient context to be identified without opening it: for a message, the conversation, sender, date, and matched text; for a person, their role and department. |
| **SR-5** | Selecting a message result shall open its conversation positioned at that message, with the message highlighted. |
| **SR-6** | Search shall support filtering by conversation, by sender, by date range, and by content type. |
| **SR-7** | Search shall support both Uzbek Latin and Cyrillic input, and shall be case- and diacritic-insensitive. |
| **SR-8** | Search shall present results progressively; the user shall not wait for all categories before seeing any result. |
| **SR-9** | Search shall never return content the user is not authorised to view. |
| **SR-10** | An empty result shall be clearly distinguished from a failed search, and shall offer refinement suggestions. |
| **SR-11** | Recent searches shall be offered when the search field is focused and empty. |

---

## 18. Notifications

Sprint 3 delivers the **in-application** notification experience. Push notification infrastructure is assigned to Sprint 4 (Blueprint §9).

| ID | Requirement |
|---|---|
| **NT-1** | Unread counts shall be displayed at conversation, module, and organisational level, and shall aggregate upward accurately. |
| **NT-2** | Mentions of the user shall be visually distinct from ordinary unread messages at every level. |
| **NT-3** | A notification centre shall list recent mentions, direct messages, and official channel activity in reverse chronological order, each navigable to its source. |
| **NT-4** | The notification centre shall support marking individual items and all items as read. |
| **NT-5** | Per-conversation notification level shall be settable to all messages, mentions only, or none. |
| **NT-6** | Muted conversations shall be excluded from unread counts but shall remain visible in the conversation list in a muted treatment. |
| **NT-7** | An optional audible alert shall be provided for mentions and direct messages, disabled by default and configurable by the user. |
| **NT-8** | Unread state shall be reconciled across sessions and devices without duplicate or lost notifications. |
| **NT-9** | An urgent designation in official channels shall elevate a message visually and shall override conversation-level muting. |
| **NT-10** | Notification presentation shall not obstruct the composer or the message currently being read. |

---

## 19. Profiles

| ID | Requirement |
|---|---|
| **PR-1** | Every user shall have a profile displaying: full name, official role, department, organisational position, presence, and last-seen where applicable. |
| **PR-2** | A profile shall be openable from any surface where a person appears. |
| **PR-3** | A profile shall offer direct actions: start a direct conversation, view shared conversations, view shared files. |
| **PR-4** | A user shall be able to view and edit their own profile within the limits defined by policy: display name, avatar, status message, and manual availability. |
| **PR-5** | Fields governed by the organisation — official role, department, position — shall be presented as read-only. |
| **PR-6** | Avatars shall be displayed consistently at defined sizes, with a deterministic initials-based fallback where no image exists. |
| **PR-7** | The current user's identity, role, and department shall be visible in the application frame at all times. |
| **PR-8** | A user shall be able to view their active sessions and devices in a read-only list. Session management actions are out of scope for Sprint 3. |
| **PR-9** | Profile presentation shall be identical wherever a profile is opened. |

---

## 20. Accessibility

Target standard: **WCAG 2.1 Level AA**.

| ID | Requirement |
|---|---|
| **A11Y-1** | All functionality shall be operable by keyboard alone, with no keyboard traps. |
| **A11Y-2** | Focus shall be visible at all times, with an indicator meeting contrast requirements. |
| **A11Y-3** | Focus order shall follow visual order; opening a panel or dialog shall move focus into it and restore focus on close. |
| **A11Y-4** | Text shall meet a minimum contrast ratio of 4.5:1; large text and meaningful non-text elements shall meet 3:1. |
| **A11Y-5** | Information shall never be conveyed by colour alone. Presence, message state, and urgency shall each carry a shape, icon, or text label. |
| **A11Y-6** | All interface regions shall be identified by landmarks, and all controls shall have accessible names. |
| **A11Y-7** | New messages and notifications shall be announced to assistive technology without interrupting the user's current task. |
| **A11Y-8** | All non-text content shall have a text alternative; users shall be able to provide a description when sending an image. |
| **A11Y-9** | The interface shall remain fully functional at 200% zoom without loss of content or horizontal scrolling of the page body. |
| **A11Y-10** | Motion shall respect the operating system reduced-motion preference. |
| **A11Y-11** | Form and validation errors shall be programmatically associated with their field and announced. |
| **A11Y-12** | A high-contrast theme shall be selectable independently of the light and dark themes. |

---

## 21. Performance

Measured on the minimum government workstation specification (NFR-2), on the internal network.

| ID | Requirement | Target |
|---|---|---|
| **PERF-1** | Application load to interactive | ≤ 3 s |
| **PERF-2** | Conversation switch to rendered timeline | ≤ 300 ms |
| **PERF-3** | Message appears in sender's timeline after send action | ≤ 150 ms |
| **PERF-4** | Message appears for other participants | ≤ 1 s |
| **PERF-5** | First search result displayed | ≤ 500 ms |
| **PERF-6** | Typing indicator appears | ≤ 1 s |
| **PERF-7** | Presence change reflected | ≤ 5 s |
| **PERF-8** | Scrolling a 1,000-message timeline | Sustained 60 fps, no blank regions |
| **PERF-9** | Memory after 8 hours continuous use | No unbounded growth; ≤ 1 GB |
| **PERF-10** | Conversation list with 200 conversations | Renders and filters without perceptible delay |
| **PERF-11** | Upload of a 25 MB file | Progress updates at least twice per second; interface remains responsive |

---

## 22. Acceptance Criteria

Sprint 3 is complete when all criteria below are demonstrated in **Production Mode**, against the live homeserver, on the minimum specification workstation, with at least two concurrent real users.

### 22.1 Blueprint §9 Capabilities
| ID | Criterion |
|---|---|
| **AC-1** | User A types; User B sees a named typing indicator within 1 s; the indicator clears within 5 s of A stopping. |
| **AC-2** | User A's availability is shown correctly to User B in the conversation header, member list, profile, and staff panel; a manual change by A is reflected for B within 5 s. |
| **AC-3** | User A sends a message; A observes the state progress to read once B has viewed it. |
| **AC-4** | A department head opens a directive and sees a list of who has and has not read it. |
| **AC-5** | User A attaches a file by drag-and-drop, observes progress, and cancels an upload successfully. |
| **AC-6** | User B receives the file, sees an inline preview for an image and a document card for a non-image, and downloads it successfully. |
| **AC-7** | A file exceeding the limit is rejected before upload with a message stating the limit. |

### 22.2 Product Quality
| ID | Criterion |
|---|---|
| **AC-8** | No demonstration data appears anywhere in Production Mode. Every module presents authoritative data or its defined unavailable state. |
| **AC-9** | Every list surface demonstrates all four states: loading, populated, empty, error. |
| **AC-10** | Global search returns conversations, people, messages, and files; selecting a message result opens the conversation at that message. |
| **AC-11** | Unread counts are accurate at conversation, module, and organisation level, and survive sign-out and sign-in. |
| **AC-12** | Mentions are visually distinguished from ordinary unread messages at every level. |
| **AC-13** | An announcement channel presents no composer to a user without posting permission, and states the rule in one sentence. |
| **AC-14** | A second department is added by configuration only, with no code change, and renders correctly. |
| **AC-15** | Opening any person's profile from any surface produces identical presentation and available actions. |
| **AC-16** | No literal colour value exists outside the design token definitions; no decorative emoji is used as institutional iconography. |
| **AC-17** | The interface is fully operable at compact, standard, and wide breakpoints. |
| **AC-18** | A message that cannot be displayed appears as a distinct interface state, never as message text. |

### 22.3 Accessibility and Performance
| ID | Criterion |
|---|---|
| **AC-19** | An audit against WCAG 2.1 AA reports no Level A or Level AA failures. |
| **AC-20** | Every task in §22.1 is completable by keyboard alone. |
| **AC-21** | All performance targets in §21 are met and recorded. |
| **AC-22** | The interface remains fully functional at 200% zoom. |

### 22.4 Regression
| ID | Criterion |
|---|---|
| **AC-23** | Sign-in, session restore, message send, message receive, real-time delivery, and room switching all continue to function as they did on entry to Sprint 3. |
| **AC-24** | Demo Mode operates fully, unchanged in behaviour (Blueprint ADR-004). |
| **AC-25** | Exactly one Matrix client instance and one synchronisation loop remain in operation (Blueprint §5). |
| **AC-26** | No protected system listed in §6.1 has been modified. |

### 22.5 Security Experience, States, and Edge Cases
| ID | Criterion |
|---|---|
| **AC-27** | Disconnecting the network produces a persistent non-blocking banner; previously loaded content remains readable; a message composed while disconnected is queued and sends automatically on reconnection, in order. |
| **AC-28** | An expired session presents a plain-language notice with a single sign-in action, and composed text is restored after re-entry. |
| **AC-29** | A permission change applied during an active session updates composer availability without a reload, and preserves in-progress composition. |
| **AC-30** | Every surface listed in §8.11 demonstrates all four of its defined states with the specified Uzbek copy. |
| **AC-31** | *Empty* and *unavailable* states are visually and textually distinct on every surface where both apply. |
| **AC-32** | Every error in Appendix B is reproducible on demand and presents the specified copy and next action. No user-facing string contains protocol terminology, an error code, or an internal identifier. |
| **AC-33** | A message read in one browser tab is not shown as unread in another; the same message never produces more than one unread increment. |
| **AC-34** | A conversation list of 5,000 entries and a timeline of 100,000 messages both remain within the targets of §21. |
| **AC-35** | Every component in Appendix C exists in the component library with all its defined states documented and reviewable. |
| **AC-36** | Every state transition in Appendix D is demonstrable in the running application. |

---

## 23. Sprint Deliverables

| # | Deliverable | Owner | Definition of Done |
|---|---|---|---|
| **D-1** | Design system specification and component library | Design | Tokens, components, and all states documented and approved |
| **D-2** | Government branding guidelines | Design | Emblem usage, identity, tone approved by stakeholders |
| **D-3** | Information architecture specification | Product / Design | Three planes and module grouping approved |
| **D-4** | Navigation and interaction specification | Design | Conversation list, breadcrumbs, shortcuts specified |
| **D-5** | High-fidelity designs, all breakpoints | Design | Compact, standard, wide for every screen |
| **D-6** | Typing indicator capability | Engineering | AC-1 |
| **D-7** | Presence capability | Engineering | AC-2 |
| **D-8** | Read receipt capability | Engineering | AC-3, AC-4 |
| **D-9** | File upload and download experience | Engineering | AC-5, AC-6, AC-7 |
| **D-10** | Global search | Engineering | AC-10 |
| **D-11** | In-application notification system | Engineering | AC-11, AC-12 |
| **D-12** | User profiles | Engineering | AC-15 |
| **D-13** | Configuration-driven organisation model | Engineering | AC-14 |
| **D-14** | Conversation and channel experience improvements | Engineering | AC-13, AC-18 |
| **D-15** | Production Mode data integrity | Engineering | AC-8, AC-9 |
| **D-16** | Responsive implementation | Engineering | AC-17 |
| **D-17** | Accessibility conformance | Engineering / QA | AC-19, AC-20, AC-22 |
| **D-18** | Performance validation report | QA | AC-21 |
| **D-19** | Regression validation report | QA | AC-23 – AC-26 |
| **D-20** | Uzbek and Russian localisation | Product | NFR-3, NFR-4 |
| **D-21** | Pilot user guide (Uzbek) | Product | Reviewed by a pilot department representative |
| **D-22** | Stakeholder demonstration | Product | Delivered to ministry stakeholders |
| **D-23** | Security experience implementation | Engineering | AC-27, AC-28, AC-29 |
| **D-24** | Empty, unavailable, and error state implementation | Engineering / Design | AC-30, AC-31, AC-32 |
| **D-25** | Design token library (Appendix A) | Design | All token categories defined for dark, light, and high-contrast themes |
| **D-26** | Component library (Appendix C) | Design / Engineering | AC-35 |
| **D-27** | Edge case validation report | QA | AC-33, AC-34, and all EDGE requirements exercised |

---

## 24. Future Recommendations (Out of Scope)

The following are recorded for roadmap consideration. **None are authorised for Sprint 3.** Each requires assignment to a sprint and, where it affects architecture, a Blueprint amendment.

### 24.1 For Sprint 4 Consideration (Blueprint §9: E2EE · Push Notifications · Audit Trail)
| ID | Recommendation | Rationale |
|---|---|---|
| **FUT-1** | Define the platform's encryption and record-retention model as a governance decision before implementation begins. Encrypted history and central archival obligations interact and should be reconciled deliberately. | Determines Sprint 4 design |
| **FUT-2** | Provide key backup and recovery so that a user issued a replacement device retains access to prior conversations. | Continuity of official records |
| **FUT-3** | Design the device verification experience for government users, including the path for a user who cannot complete verification. | Onboarding of new devices |
| **FUT-4** | Extend the Sprint 3 notification model to push delivery via the sovereign notification gateway. | Duty officer coverage outside the office |
| **FUT-5** | Include acknowledgement of official directives within the audit trail. | Accountability reporting |
| **FUT-6** | Provide user-initiated session and device revocation, building on the read-only view delivered as PR-8. | Account security |

### 24.2 For Sprint 5 Consideration (Blueprint §9: Calls · Workflow Engine · Document Approvals)
| ID | Recommendation |
|---|---|
| **FUT-7** | Model a case as a single object joining its conversation, participants, documents, and tasks, rather than as separate list views. |
| **FUT-8** | Implement case lifecycle states with defined permitted transitions. |
| **FUT-9** | Implement assignment, reassignment, and delegation of responsibility during absence. |
| **FUT-10** | Implement document approval progression with recorded approver identity. |
| **FUT-11** | Implement evidence custody recording. |
| **FUT-12** | Implement emergency broadcast with mandatory acknowledgement. |

### 24.3 For Future Roadmap Consideration
| ID | Recommendation |
|---|---|
| **FUT-13** | Define and enforce a data classification scheme with visual marking and handling rules. The Sprint 3 interface reserves a region for this (UI-11) and can display a marking supplied by data (GW-9). |
| **FUT-14** | Refine the role model to separate organisational rank, per-case function, and system administration responsibilities. |
| **FUT-15** | Deliver role provisioning tooling for National Administrators (see AS-1). |
| **FUT-16** | Enable federation with the Prosecutor's Office and the courts for authorised inter-agency communication. |
| **FUT-17** | Deliver native mobile clients for field personnel. |
| **FUT-18** | Define retention and archival policy in line with state records law. |
| **FUT-19** | Define authorised access procedures for the correspondence of absent or suspended personnel. |
| **FUT-20** | Deliver a departmental analytics dashboard once authoritative operational data is available. |

---

# Appendix A — Design Token Specification

Detailed specification of the design system required by **UI-1 – UI-7**. This appendix defines *what tokens must exist and what they mean*. Values are to be finalised by the Design Lead during D-1 and shall not be duplicated or overridden anywhere else.

### A.1 Principles
| ID | Requirement |
|---|---|
| **TOK-1** | Every visual property shall be expressed as a named semantic token. Literal values shall not appear outside the token definitions (UI-2). |
| **TOK-2** | Tokens shall be named by purpose, not by appearance (e.g. *surface-elevated*, not *dark-grey-2*). |
| **TOK-3** | Every token shall be defined for all supported themes: dark, light, high-contrast (UI-6). |
| **TOK-4** | Any value not expressible as a token shall be treated as a design system gap and resolved by extending the system. |

### A.2 Typography Scale
| Token | Role | Specifies |
|---|---|---|
| `type-display` | Screen titles | Size, weight, line height, letter spacing |
| `type-heading-1/2/3` | Section and panel headings | Size, weight, line height |
| `type-body` | Message text, primary content | Size, weight, line height |
| `type-body-strong` | Emphasis within body | Weight variant |
| `type-label` | Field labels, list metadata | Size, weight, transform |
| `type-caption` | Timestamps, counts, helper text | Size, weight |
| `type-mono` | Reference codes, identifiers | Family, size |

Requirements: a single family for Latin and Cyrillic with full Uzbek diacritic coverage; minimum body size 14 px; line height sufficient for extended reading; no more than seven roles.

### A.3 Spacing Scale
| Token | Purpose |
|---|---|
| `space-0` … `space-7` | A fixed geometric scale (base unit 4 px recommended) governing padding, margin, and gap |

Requirements: all spacing drawn from the scale (UI-3); component internal padding, list row rhythm, and panel gutters each mapped to named steps.

### A.4 Colour Tokens
| Category | Tokens | Purpose |
|---|---|---|
| **Surface** | `surface-base`, `surface-raised`, `surface-overlay`, `surface-sunken` | Backgrounds by elevation |
| **Content** | `content-primary`, `content-secondary`, `content-tertiary`, `content-disabled`, `content-inverse` | Text and icon colour |
| **Border** | `border-subtle`, `border-default`, `border-strong`, `border-focus` | Separation and definition |
| **Brand** | `brand-primary`, `brand-emphasis` | State identity, primary actions |
| **Interactive** | `action-primary`, `action-secondary`, `action-danger` (rest / hover / active / disabled) | Controls |

### A.5 Semantic and State Colours
| Token | Meaning |
|---|---|
| `status-success` | Completion, delivered, read |
| `status-warning` | Degraded condition, attention needed |
| `status-danger` | Failure, destructive action |
| `status-info` | Neutral information |
| `status-urgent` | Urgent official communication (FR-53) |
| `presence-online` / `presence-away` / `presence-busy` / `presence-offline` | Availability (FR-12) |
| `unread-indicator` / `mention-indicator` | Unread and mention distinction (NT-2) |

**TOK-5** — Every semantic and state token shall be paired with a non-colour carrier — icon, shape, or text label — so no meaning depends on colour alone (A11Y-5).

### A.6 Elevation and Shadow
| Token | Purpose |
|---|---|
| `elevation-0` … `elevation-3` | Flat surfaces through to dialogs and menus |
| `shadow-subtle`, `shadow-default`, `shadow-overlay` | Depth cues paired with elevation |

**TOK-6** — Elevation shall convey hierarchy, not decoration. High-contrast theme shall substitute borders for shadow.

### A.7 Radius and Borders
| Token | Purpose |
|---|---|
| `radius-none`, `radius-sm`, `radius-md`, `radius-lg`, `radius-full` | Corner treatment for inputs, cards, bubbles, avatars |
| `border-width-thin`, `border-width-thick` | Standard and emphasis borders |

**TOK-7** — Message bubbles, cards, and avatars shall each use one consistent radius token.

### A.8 Motion and Animation
| Token | Purpose |
|---|---|
| `duration-instant` (≤100 ms) | State feedback (UX-5) |
| `duration-short` (150–200 ms) | Hover, focus, small transitions |
| `duration-medium` (250–300 ms) | Panel open/close, overlays |
| `easing-standard`, `easing-decelerate`, `easing-accelerate` | Motion curves |

**TOK-8** — Motion shall be functional — communicating origin, direction, or state change. Decorative animation shall not be used.
**TOK-9** — All motion shall be disabled when the system reduced-motion preference is set (A11Y-10).

### A.9 Iconography
| ID | Requirement |
|---|---|
| **TOK-10** | A single icon set with consistent grid, stroke weight, and optical size shall be used throughout (UI-7). |
| **TOK-11** | Icons shall be provided at defined sizes (16, 20, 24 px) and shall inherit content colour tokens. |
| **TOK-12** | Every icon conveying meaning shall have a text alternative (A11Y-6, A11Y-8). |
| **TOK-13** | Emoji shall not be used as interface iconography. |

### A.10 Focus and Interaction States
| ID | Requirement |
|---|---|
| **TOK-14** | A single `focus-ring` token shall define focus appearance across all interactive elements, meeting contrast requirements (A11Y-2). |
| **TOK-15** | Focus indication shall never be removed without an equivalent replacement. |
| **TOK-16** | Every interactive component shall define all states named in UI-5: default, hover, focus, active, disabled, loading, error. |

---

# Appendix B — Error Catalogue

Complete catalogue of user-visible errors. All copy is specified in Uzbek per **NFR-3** and **UX-7**; no protocol terminology, error codes, or internal identifiers appear in any user-facing string (**SUX-1**, **NFR-8**). Russian equivalents are produced during localisation (D-20).

| ID | Error | When it occurs | What the user sees | What the user can do |
|---|---|---|---|---|
| **ERR-1** | Message send failed | A composed message could not be delivered | "Xabar yuborilmadi" on the message, in a failed state | Retry, or delete the message (FR-22) |
| **ERR-2** | Upload failed | File transfer did not complete | "Faylni yuklab bo'lmadi" on the attachment card | Retry without re-selecting the file (FR-30) |
| **ERR-3** | Download failed | A file could not be retrieved | "Faylni yuklab olishda xatolik" | Retry the download |
| **ERR-4** | Unsupported file type | Selected file type is not permitted | "Bu turdagi fayllarni yuborib bo'lmaydi" with the permitted types | Choose a different file (FR-29) |
| **ERR-5** | File too large | File exceeds the configured limit | "Fayl juda katta. Ruxsat etilgan hajm: {limit}" | Choose a smaller file or split it (FR-28) |
| **ERR-6** | Storage full | Local storage cannot accept more data | "Qurilmada joy yetarli emas" | Free space, then retry |
| **ERR-7** | Search timed out | Search did not return within the time budget | "Qidiruvni yakunlab bo'lmadi" | Retry, or narrow the query with filters |
| **ERR-8** | Permission denied | The user is not authorised for the action | "Sizda bu amalni bajarish huquqi yo'q" | No action; explanation only (SUX-10) |
| **ERR-9** | Access denied | The user is not authorised for the resource | "Ushbu bo'limga ruxsat yo'q" — no detail disclosed | Return to the previous screen (SUX-10) |
| **ERR-10** | Connection lost | Network connectivity to the system is unavailable | Persistent banner: "Ulanish yo'qoldi. Qayta ulanmoqda…" | Wait; recovery is automatic (SUX-5) |
| **ERR-11** | Homeserver unavailable | The system is reachable but not responding | "Server bilan aloqa yo'q" | Wait; contact support if persistent (SUX-7) |
| **ERR-12** | Rate limited | Too many actions performed in a short period | "Juda tez-tez urinildi. Biroz kuting" with retry timing | Wait for the stated interval (SUX-13) |
| **ERR-13** | Session expired | The working session is no longer valid | "Sessiya muddati tugadi" with a sign-in action | Sign in again; drafts are preserved (SUX-2) |
| **ERR-14** | Message unavailable | A message cannot be displayed | Defined interface state: "Xabarni ko'rsatib bo'lmadi" | No action; explanation only (FR-35, SUX-12) |
| **ERR-15** | Attachment unavailable | A file referenced in a message no longer exists | "Fayl mavjud emas" on the file card | No action (EDGE-8) |
| **ERR-16** | Conversation unavailable | The conversation can no longer be accessed | "Suhbat mavjud emas" and removal from active lists | Return to the conversation list (EDGE-7) |
| **ERR-17** | Content failed to load | A list or panel could not be populated | Surface-specific error copy per §8.11 | Retry (ES-5) |
| **ERR-18** | Action failed | A general operation did not complete | "Amalni bajarib bo'lmadi" | Retry |

**ERR-19** — No error shall be presented without at least one of: a retry action, a navigation action, or an explicit statement that no action is available.
**ERR-20** — Errors shall not be presented as message content, and shall not obscure the composer or the message being read (NT-10).

---

# Appendix C — Component Inventory

Complete inventory of components required for Sprint 3. Every component shall define all applicable states from **UI-5** and **TOK-16**.

### C.1 Foundation
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-1** | Button | Primary, secondary, danger, ghost actions | Default, hover, focus, active, disabled, loading | Consistent action affordance; never conveys state by colour alone |
| **CMP-2** | Icon Button | Compact icon-only action | As CMP-1 | Requires accessible name (A11Y-6) |
| **CMP-3** | Input Field | Single-line text entry | Default, focus, filled, error, disabled | Associates label, hint, and validation message (A11Y-11) |
| **CMP-4** | Avatar | Person or conversation identity | Image, initials fallback, sizes | Deterministic fallback (PR-6) |
| **CMP-5** | Badge | Count or status marker | Count, dot, mention, muted | Non-colour carrier required (A11Y-5) |
| **CMP-6** | Tooltip | Supplementary label | Hidden, visible | Keyboard reachable; never sole carrier of meaning |
| **CMP-7** | Spinner / Skeleton | Loading indication | Indeterminate, skeleton | Reserves final dimensions (ES-6) |
| **CMP-8** | Divider | Visual separation | Default, labelled | Includes date separators (FR-33) |

### C.2 Identity and Presence
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-9** | Presence Badge | Availability indicator | Online, away, busy, offline, unknown | Shape + colour + label (FR-16) |
| **CMP-10** | Profile Card | Compact person summary | Loading, ready, error, inactive user | Name, role, department, presence, actions (PR-1, PR-3) |
| **CMP-11** | Profile Panel | Full profile surface | Loading, ready, editable, read-only, error | Identical presentation from every entry point (PR-9) |
| **CMP-12** | Member List Item | Person within a conversation | Default, hover, selected, inactive | Name, role, presence (FR-45) |
| **CMP-13** | Role Chip | Official designation | Default | Displays official role, not system terminology (GW-11) |

### C.3 Navigation
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-14** | Organisation Sidebar | Hierarchy and module navigation | Expanded, collapsed, loading, error | Renders arbitrary depth (IA-2, ORG-3) |
| **CMP-15** | Hierarchy Node | One organisational level | Collapsed, expanded, active, restricted | Shows only authorised branches (IA-4) |
| **CMP-16** | Module List Item | Entry to a work module | Default, active, unavailable, unread | Reflects unavailable state (IA-11) |
| **CMP-17** | Breadcrumb | Organisational path | Default, truncated | Navigable at each level (NAV-5) |
| **CMP-18** | Application Header | Identity, search, user, connection | Default, offline | Hosts emblem, search, connection state (UI-8, SUX-16) |
| **CMP-19** | Conversation Item | One conversation in the list | Default, hover, active, unread, mention, muted, favourite, draft | Type, name, preview, time, unread count (NAV-2) |
| **CMP-20** | Conversation List | Grouped conversation navigation | Loading, populated, empty, error, filtered | Grouping and ordering (IA-7, IA-8) |

### C.4 Conversation
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-21** | Message Bubble | A single message | Sending, sent, delivered, read, failed, unavailable, urgent | Grouping, sender identity, state (FR-32, FR-34, COM-5) |
| **CMP-22** | Message Group | Consecutive messages, one sender | Default | Sender shown once (FR-32) |
| **CMP-23** | Unavailable Message | Message that cannot be displayed | Default | Distinct from message content (FR-35, SUX-12) |
| **CMP-24** | Reply Preview | Quoted message above a reply | Default, unavailable source | Navigates to source (FR-38) |
| **CMP-25** | Directive Block | Formal official communication | Default, pinned, urgent | Issuing department, officer, date (GW-1) |
| **CMP-26** | Typing Indicator | Who is composing | Hidden, single, multiple | Reserved space (FR-9) |
| **CMP-27** | Unread Divider | Read/unread boundary | Visible, dismissed | Persistent on entry (FR-37) |
| **CMP-28** | Composer | Message entry | Empty, composing, disabled, no-permission, queued, error | Multi-line, drafts, permission state (FR-39, FR-40, COM-7) |
| **CMP-29** | Permission Notice | Explanation in place of composer | Default | One neutral sentence (COM-3, FR-43) |
| **CMP-30** | Conversation Header | Conversation context | Loading, ready, error | Name, type, participants, topic, pinned access (FR-44, FR-48) |
| **CMP-31** | Read Receipt Summary | Who has read a message | Loading, ready, empty, error | Counts and non-readers (FR-19, FR-20) |

### C.5 Files
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-32** | Attachment Preview | Pre-send attachment review | Selected, removable, rejected | Name, size, type; removal (FR-24) |
| **CMP-33** | Upload Progress | In-flight transfer | Queued, uploading, paused, cancelled, failed, complete | Per-file progress and cancel (FR-25) |
| **CMP-34** | File Card | Non-image file in a conversation | Default, downloading, unavailable | Name, size, type, sender, time (FR-26) |
| **CMP-35** | Image Preview | Inline image | Loading, ready, error, unavailable | Bounded display size (EDGE-4) |
| **CMP-36** | Image Viewer | Full-size image | Loading, ready, error | Full resolution on explicit open (FR-27) |
| **CMP-37** | Drop Zone | Drag-and-drop target | Idle, active, rejecting | Visual target and rejection feedback (FR-23) |

### C.6 Search and Notifications
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-38** | Search Field | Query entry | Idle, focused, typing, clearing | Keyboard entry point (NAV-4) |
| **CMP-39** | Search Panel | Results surface | Idle, searching, results, empty, error | Progressive, grouped results (SR-3, SR-8) |
| **CMP-40** | Search Result Item | One result | Default, hover, selected | Sufficient identifying context (SR-4) |
| **CMP-41** | Search Filters | Result refinement | Default, applied | Conversation, sender, date, type (SR-6) |
| **CMP-42** | Notification Centre | Recent activity | Loading, populated, empty, error | Navigable entries (NT-3) |
| **CMP-43** | Notification Item | One notification | Unread, read, mention | Marking read (NT-4) |
| **CMP-44** | Notification Settings | Per-conversation level | Default | All / mentions / none (NT-5) |

### C.7 System and Overlays
| ID | Component | Purpose | Key states | Responsibilities |
|---|---|---|---|---|
| **CMP-45** | Connection Banner | Connection state | Hidden, disconnected, reconnecting, restored | Persistent, non-blocking (SUX-5, SUX-8) |
| **CMP-46** | Security Notice | Security-relevant situation | Informational, action-required | Persists until resolved when action needed (SUX-14) |
| **CMP-47** | Dialog | Focused decision | Open, closing | Focus trap and restore (A11Y-3) |
| **CMP-48** | Confirmation Dialog | Destructive action | Default, processing | States the consequence (UX-4) |
| **CMP-49** | Context Menu | Contextual actions | Closed, open | Keyboard operable |
| **CMP-50** | Toast | Transient confirmation | Entering, visible, leaving | Never sole carrier of critical information |
| **CMP-51** | Empty State | Nothing to display | Empty, unavailable | Distinguishes empty from unavailable (ES-2) |
| **CMP-52** | Error State | Surface-level failure | Default | Offers retry (ES-5) |
| **CMP-53** | Panel | Collapsible supporting surface | Expanded, collapsed, overlay | Responsive behaviour (UI-14, UI-15) |

---

# Appendix D — UI State Specifications

Behavioural specification of major interactive systems. These define **observable interface states and permitted transitions only**; they impose no implementation approach.

### D.1 Typing
States: `Idle → Typing → Stopped → Timeout`

| ID | Rule |
|---|---|
| **ST-1** | `Idle` when no participant is composing; the indicator occupies reserved space but is not visible (FR-9). |
| **ST-2** | `Typing` within 1 s of a participant beginning to compose (FR-8). |
| **ST-3** | `Stopped` on send or on clearing the composer; returns to `Idle` immediately. |
| **ST-4** | `Timeout` after 5 s without activity; returns to `Idle` (FR-8). |
| **ST-5** | No transition occurs in channels where the user cannot post (FR-11). |

### D.2 Presence
States: `Offline → Connecting → Online → Away → Busy`

| ID | Rule |
|---|---|
| **ST-6** | `Connecting` is displayed distinctly from `Online` and `Offline`. |
| **ST-7** | `Away` is derived from inactivity; `Busy` is set manually. |
| **ST-8** | Manual selection overrides automatic transitions until cleared (FR-15). |
| **ST-9** | `Offline` may display last-seen where available (FR-14). |
| **ST-10** | Every state carries shape or label in addition to colour (FR-16). |

### D.3 Upload
States: `Idle → Queued → Uploading → (Paused) → Completed | Cancelled | Failed`

| ID | Rule |
|---|---|
| **ST-11** | `Queued` when selected but not yet transferring; removable without consequence. |
| **ST-12** | `Uploading` shows determinate progress and a cancel action (FR-25). |
| **ST-13** | `Cancelled` is terminal; the file is not sent and the selection is released. |
| **ST-14** | `Failed` offers retry without re-selection (FR-30). |
| **ST-15** | `Completed` transitions the attachment into a message file card (FR-26). |
| **ST-16** | Concurrent uploads maintain independent state (EDGE-18). |

### D.4 Notification
States: `Read ↔ Unread → Mention → Muted`

| ID | Rule |
|---|---|
| **ST-17** | `Unread` increments conversation, module, and organisation counts (NT-1). |
| **ST-18** | `Mention` is a distinct state, visually separated from `Unread` at every level (NT-2). |
| **ST-19** | `Muted` suppresses counts but retains list visibility (NT-6). |
| **ST-20** | An urgent official message overrides `Muted` (NT-9, FR-53). |
| **ST-21** | Transition to `Read` propagates across tabs and devices exactly once (EDGE-5, EDGE-9, EDGE-10). |

### D.5 Conversation
States: `Loading → Ready | Empty | Error | Unavailable | Read-only`

| ID | Rule |
|---|---|
| **ST-22** | `Loading` reserves final layout dimensions (ES-6). |
| **ST-23** | `Empty` presents defined copy and, where applicable, the composer (§8.11). |
| **ST-24** | `Error` offers retry without losing the user's position (ES-5). |
| **ST-25** | `Unavailable` removes the conversation from active lists with one notice (EDGE-7). |
| **ST-26** | `Read-only` applies where posting is not permitted; the composer is replaced by a permission notice (FR-43, COM-3). |
| **ST-27** | Superseded loads never overwrite the visible timeline (EDGE-17). |

### D.6 Search
States: `Idle → Searching → Results | Empty | Error`

| ID | Rule |
|---|---|
| **ST-28** | `Idle` offers recent searches (SR-11). |
| **ST-29** | `Searching` presents results progressively; the user does not wait for all categories (SR-8). |
| **ST-30** | `Empty` is visually distinct from `Error` (SR-10). |
| **ST-31** | `Error` offers retry and query refinement (ERR-7). |
| **ST-32** | Results never include unauthorised content in any state (SR-9). |

### D.7 Connection
States: `Connected → Degraded → Disconnected → Reconnecting → Restored`

| ID | Rule |
|---|---|
| **ST-33** | Connection state is visible at all times in a consistent location (SUX-16). |
| **ST-34** | `Disconnected` keeps previously loaded content readable (SUX-5). |
| **ST-35** | `Reconnecting` is automatic and requires no user action. |
| **ST-36** | `Restored` is confirmed briefly, then clears (SUX-8). |
| **ST-37** | Server unavailability is presented distinctly from local disconnection (SUX-7). |

### D.8 Message
States: `Composing → Queued → Sending → Sent → Delivered → Read | Failed | Unavailable`

| ID | Rule |
|---|---|
| **ST-38** | `Queued` applies when composed while disconnected; sends automatically on reconnection in original order (SUX-6, EDGE-11). |
| **ST-39** | `Failed` is persistent and offers retry or delete (FR-22, ERR-1). |
| **ST-40** | `Unavailable` renders in the defined interface state, never as message text (FR-35, SUX-12). |
| **ST-41** | Message position is stable once displayed; state changes do not reorder the timeline (COM-8, EDGE-15). |

---

## Document Control

| Section | Owner | Approval Required |
|---|---|---|
| Vision, Business Goals | Product Management | Government Stakeholders |
| Functional & Non-Functional Requirements | Product Management | Engineering Lead |
| UX, UI, IA, Navigation | Design Lead | Product Management |
| Acceptance Criteria | Product Management | QA Lead |
| Out of Scope, Future Recommendations | Product Management | Architecture Board |

**Change control.** Changes to this document after approval require Product Management sign-off. Changes affecting the protected systems listed in §6.1, sprint boundaries, or the roadmap require a `PROJECT_BLUEPRINT_V2.md` amendment approved by the Architecture Board.

---

*Sovereign Messenger — Sprint 3 Product Requirements Document v1.1*
*Governed by PROJECT_BLUEPRINT_V2.md — Architectural Constitution*
