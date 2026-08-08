# Information Architecture and Navigation

**Sprint 3 deliverables D-3 (information architecture) and D-4 (navigation and
interaction).** Written at Milestone 3; §5 and the header notes were brought up
to date at the Sprint 3 freeze.

This document records what the code does and why. Where it and
`SPRINT_3_PRODUCT_REQUIREMENTS.md` differ, the PRD prevails.

---

## 1. Three planes

Every screen belongs to exactly one plane, and the user's position in each is
visible without navigating (UX-1).

| Plane | Question | Surface |
|---|---|---|
| **Organisation** | Where am I? | Sidebar hierarchy, header breadcrumbs |
| **Communication** | Who am I speaking with? | Conversation list, conversation |
| **Work** | What am I working on? | Module list, workspace |

### Plane 1 — Organisation

`Republic → Viloyat → Idora → Bo'lim → Workspace`, defined by
`config/organisation.config.json` and read by `OrganisationService`
(see [ADR-0007](../ADRs/0007-configuration-driven-organisation-model.md)).

- **CMP-14** `GovernmentNavigation` renders the tree at whatever depth the
  configuration declares (IA-2, ORG-3).
- **CMP-15** `HierarchyNode` is one level. Indentation is computed from depth,
  so no depth is authored anywhere.
- **CMP-17** `Breadcrumb` shows the full path and is navigable at every level
  (NAV-5). A path deeper than four levels collapses its middle behind one
  control rather than wrapping the frame.
- A user sees the path to their own position and everything beneath it. Sibling
  branches are not rendered (IA-4, ORG-5).

### Plane 2 — Communication

Three types, distinguished by structure and label rather than icon (IA-6):

| Type | Uzbek | Posting |
|---|---|---|
| Official channel | Rasmiy kanal | Leadership only |
| Working group | Ishchi guruh | All members |
| Direct | Shaxsiy suhbat | Both participants |

A room resolves to a type by whether it has a published address (channel), is
small and unaddressed (direct), or neither (group). Direct conversations were
previously folded into working groups, which made the third type
unrepresentable.

### Plane 3 — Work

Modules are scoped to the current node (IA-9). A node's `modules` array decides
both membership and order (ORG-6, IA-12); role filtering applies first, so a
module the user may not hold is never offered whatever a node declares
(Blueprint §4). Modules with no authoritative source present the unavailable
state established in Milestone 2 (FR-2, IA-11).

---

## 2. Navigation

### Conversation list (NAV-2, NAV-3, CMP-19, CMP-20)

Replaces the selection control that previously sat inside the chat header.
Conversation navigation is a column of the frame, reachable from anywhere in
the working area.

Per conversation: type indicator, name, last message preview, time of last
activity, unread count, and muted, favourite, or draft state. Every state
carries an icon or text label as well as colour (A11Y-5).

**Grouping** — favourites first (IA-8), then channels, groups, and direct
conversations (IA-7).

**Ordering** — most recent activity, or name. A conversation with no known
activity sorts last, so an absent timestamp never outranks a real one.

**Filtering** — by type. Filtering to a type with no matches is its own state,
distinct from having no conversations at all, and offers the action that clears
the filter (ES-2, ES-4).

**Unread** — read from the count the server carried on synchronisation, never
computed locally, which would drift between tabs and devices (NT-8). Muted
conversations stay listed but are counted out (NT-6); mentions stay distinct
even when muted (NT-2). The model that aggregates to module and organisation
level was delivered with the notification system in Milestone 5: the same
arithmetic over the same conversations produces the conversation, module, and
organisational totals, so no two levels can disagree.

### Application header (CMP-18)

Left to right: institutional identity and organisational code (UI-9, ORG-7),
breadcrumbs (NAV-5), connection state (SUX-16), and the current user's name,
official role, and department (PR-7).

**Global search (NAV-4)** and the **notification centre (NT-3)** were reserved
here at Milestone 3 and are now filled: the header carries both entry points,
Ctrl/Cmd-K reaches search from anywhere, and the notification control carries
the organisation-level unread total.

One region remains reserved rather than filled:

- **State Emblem (UI-8)** — a controlled state symbol supplied by deployment
  configuration. Its region is held open and rendered only when the approved
  asset exists; an improvised substitute would misrepresent state identity.
  Sourcing it is branding deliverable D-2.

### Conversation surface

`ChatArea` is a composition root with no presentation of its own:

| Component | Responsibility |
|---|---|
| **CMP-30** `ConversationHeader` | Name, type, participant count, topic (FR-44) |
| `MessageTimeline` | Grouping, day separators, ordering, backward pagination and a bounded render window (FR-36, EDGE-2) |
| **CMP-21** `MessageBubble` | One message and its delivery state |
| **CMP-23** `UnavailableMessage` | A message that cannot be displayed (FR-35) |
| **CMP-27** `UnreadDivider` | The read boundary captured on entry (FR-37) |
| **CMP-12** `MemberListItem` | A participant, with membership and posting rights (FR-45) |
| **CMP-26** `TypingIndicator` | Reserved space; data arrives in Milestone 4 |
| **CMP-28** `MessageComposer` | Multi-line entry, drafts (FR-39, FR-40) |
| **CMP-29** `PermissionNotice` | One neutral sentence where posting is not permitted |

Posting rights are read from the room's own power levels and re-read as room
state changes, so a change mid-session takes effect without a reload and is
explained where it happens, with composed text preserved (SUX-9, EDGE-13,
AC-29). Where rights cannot be read, the role-derived answer applies — an
unloaded room never silently removes the composer.

---

## 3. Responsive frame (UI-13 … UI-19)

| Breakpoint | Width | Behaviour |
|---|---|---|
| **Wide** | ≥ 1280px | Sidebar, conversation list, conversation, workspace, and one supporting panel together (UI-14) |
| **Standard** | 768–1279px | Workspace and panel overlay the frame rather than compressing the conversation column (UI-15, UX-2) |
| **Compact** | < 768px | One surface at a time, with an explicit switcher (UI-16) |

The boundaries live in `hooks/useBreakpoint.ts` and are mirrored by the media
queries in `SovereignLayout.css`. The difference between breakpoints is
structural, not cosmetic — at compact the frame renders a different set of
surfaces — so the decision belongs in the frame rather than in a stylesheet.

Sidebar collapse, panel visibility, and message density persist across sessions
(UI-18, UI-19). Preferences are not cleared on sign-out, unlike drafts: how a
workstation is laid out belongs to the workstation, not to the person signed
in.

---

## 4. Keyboard operation

| Surface | Keys |
|---|---|
| Hierarchy tree | Arrow keys to move; Right and Left to expand and collapse or step to child and parent; Home and End; Enter or Space to select |
| Composer | Enter sends; Shift+Enter inserts a newline (FR-39), both stated in the interface |
| All surfaces | One visible focus treatment, never removed (A11Y-2, TOK-14) |

The tree is a single tab stop with roving tabindex, so it is never a keyboard
trap and tabbing past it takes one press (A11Y-1). Focus moves only in response
to a key press, never on re-render, so arriving data cannot take focus from
where the user is.

Of the NAV-9 shortcut set, search (Ctrl/Cmd-K) and closing a panel (Escape) are
bound. Conversation switching, next unread, composer focus, and the
discoverable reference are not, and are recorded as UR-6 in
[sprint-3-outstanding.md](../Development/sprint-3-outstanding.md).

---

## 5. What this document deferred, and where it stands

This section was written at Milestone 3 as a forward list. It is kept as a
record of what was promised and what arrived, because a deferral list that is
never settled is how a gap becomes permanent.

| Item | Requirement | Promised | State at Sprint 3 close |
|---|---|---|---|
| Global search and its shortcut | NAV-4, SR-1 … SR-11 | M5 | **Delivered** |
| Unread aggregation to module and organisation level | NT-1, NT-2, ST-21 | M5 | **Delivered** |
| Notification centre and per-conversation settings | NT-3 … NT-7 | M5 | **Delivered** |
| Presence in the member list and staff panel | FR-13, FR-17 | M4 | **Delivered** |
| Typing data behind the reserved indicator | FR-6 … FR-8 | M4 | **Delivered** |
| Read receipts behind the delivered and read states | FR-18 … FR-21 | M4 | **Delivered** |
| Full keyboard shortcut set | NAV-9 | M5 | **Partial** — search and Escape only (UR-6) |
| Recent items list | NAV-6 | M5 | **Not delivered** (UR-3) |
| Stable deep links to conversations and messages | NAV-8 | M5 | **Not delivered** (UR-5) |
| Pinned messages affordance in the header | FR-48 | M4 | **Not delivered** (UR-2) |
| Sender role for other participants | FR-34 | Blocked on role provisioning (R-6, FUT-15) | Still blocked |

The four undelivered items are recorded as UR-2, UR-3, UR-5, and UR-6 in
[sprint-3-outstanding.md](../Development/sprint-3-outstanding.md).
| State Emblem asset | UI-8 | D-2 (Design) |
