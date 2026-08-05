# ADR-0007: Configuration-Driven Organisation Model

**Date:** 2026-08-05
**Status:** Accepted
**Sprint:** Sprint 3, Milestone 3 (Structure & Navigation)
**Requirements:** ORG-1 … ORG-8, IA-1 … IA-5, AC-14
**Risk addressed:** Readiness Review R-5

---

## Context

The organisational hierarchy was expressed in two places, neither of them data.

`GovernmentNavigation.tsx` held a hardcoded constant naming exactly one branch
— Samarqand viloyati → Ichki Ishlar → Tergov — and `organization.config.json`
held five flat strings describing that same branch a second time.

ORG-1 requires the structure to be configuration. IA-2 and ORG-3 require it to
render at arbitrary depth and breadth. AC-14 gates the milestone on a second
department being added by configuration only, with no code change. None of
these were satisfiable against a constant in a component.

The Readiness Review records this as R-5: the deployment has no authoritative
organisational data source, and no such configuration exists today.

---

## Decision

The hierarchy is a node list in `config/organisation.config.json`, read by a
Layer 3 service (`OrganisationService`) that derives everything the interface
needs from it.

Each node declares its id, its parent, its type, a display name per supported
language, an optional code, and an optional list of enabled modules.

```
Republic → Viloyat → Idora → Bo'lim → Workspace
```

The five node types of ORG-2 are the vocabulary, not the shape: the service
imposes no depth or breadth, so any valid hierarchy renders unchanged.

The configuration file is **deployment configuration, not demonstration data**.
It is authoritative in both runtime modes, and FR-1 is not engaged by it.

### Authorisation

A user sees the path from the root down to their own position, plus everything
beneath it. Sibling branches are excluded.

No authoritative source states that a member of one department may see another
(Readiness Review R-6), and absent authorisation data resolves to least
privilege everywhere else in this codebase — `MatrixUserService` defaults an
unknown role to Employee rather than Manager. Widening visibility on a guess
would be the one place the product assumed access rather than requiring it.

### Position resolution

A user's position comes from the `department` field carried on their identity
account data, matched against node id, code, or display name (AS-1). Where it
is absent or matches nothing, the configured default position applies.

A position is never inferred from unrelated data. The identity field carries an
internal reference rather than a display name, so it is resolved through the
model before anything is shown to a user (NFR-8).

### Failure

Configuration defects — duplicate ids, unknown parents, parent cycles,
unreachable nodes, a missing root — are collected during construction rather
than thrown.

`useOrganisation` resolves to the `error` state established in Milestone 2, so
the surface offers retry (ES-5). The alternative, an empty sidebar, reads to a
government employee as "you belong to nothing", which is both alarming and
false.

---

## Consequences

**Adding a department is a configuration change.** AC-14 is demonstrable
against the file. The pilot configuration ships a second Bo'lim (Jinoyat
qidiruv) with a narrower module list, so both breadth and per-node module
enablement are exercised by data rather than asserted in prose.

**Module scoping follows the node.** ORG-6 and IA-12 are satisfied by the
node's `modules` array: membership and order are both configuration. Role
filtering still applies first — a module the user may not hold is never
offered, whatever a node declares.

**Two representations collapse into one.** `useOrganization` keeps its existing
shape for the application frame and derives it from the model, so the frame's
labels are produced rather than restated.

**The format is a Sprint 3 artefact.** When an authoritative organisational
data source exists, it replaces the file behind `OrganisationService` without
the interface changing: the service is the seam.

---

## Alternatives considered

**Derive the hierarchy from Matrix spaces.** Rejected: PRD §6.3 places changes
to how rooms or spaces are represented in the Matrix layer outside Sprint 3,
and §6.1 protects Matrix protocol behaviour.

**Keep the flat record and add depth later.** Rejected: AC-14 is a Milestone 3
gate, and navigation built over a fixed branch cannot be validated against it.

**Show the whole hierarchy and restrict on selection.** Rejected: IA-4 requires
a user to see only branches they have access to. Rendering an unauthorised
department's name discloses the structure of the state to someone with no claim
to it, which SUX-10 forbids for resources.
