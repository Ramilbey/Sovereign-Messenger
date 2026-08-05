# Sprint 3 — Live Acceptance Environment

Acceptance strategy §15.2 requires acceptance in Production Mode against a
live homeserver with at least two concurrent real users. This records how that
environment is stood up and what it has proved.

## Standing it up

The homeserver is a **disposable instance created outside the repository**.
`backend/` and its deployment configuration are untouched (PRD §6.1).

```bash
docker run --rm -v ~/svr-test-hs:/data \
  -e SYNAPSE_SERVER_NAME=gov.local -e SYNAPSE_REPORT_STATS=no \
  matrixdotorg/synapse:v1.100.0 generate

docker run -d --name svr-test-synapse -v ~/svr-test-hs:/data \
  -p 8008:8008 matrixdotorg/synapse:v1.100.0

docker exec svr-test-synapse register_new_matrix_user \
  -u aziz -p 'Passw0rd!aziz' -a -c /data/homeserver.yaml http://localhost:8008
docker exec svr-test-synapse register_new_matrix_user \
  -u dilshod -p 'Passw0rd!dilshod' -a -c /data/homeserver.yaml http://localhost:8008
```

The generated `homeserver.yaml` is amended for testing only: open registration,
relaxed rate limits, and `presence.enabled: true`.

## Running the acceptance suite

```bash
cd frontend/element-web/apps/web
npx vitest run --config vitest.live.config.ts     # two real users, live server
npx vitest run --config vitest.sovereign.config.ts # offline suite
```

Both users genuinely authenticate, genuinely synchronise, and drive the real
Sovereign service layer. Nothing is stubbed below the service boundary.

## What it has proved

| Criterion | Measured | Budget | Result |
|---|---|---|---|
| **AC-1** typing indicator seen by the second user, named, then cleared | 101ms | PERF-6 ≤ 1s | pass |
| **AC-2** presence observed; manual change reflected | 0ms | PERF-7 ≤ 5s | pass |
| **§14.5** message delivered to the second user without refresh | 99ms | PERF-4 ≤ 1s | pass |
| **NAV-2 / FR-44** real name, topic, member count, last-message preview | — | — | pass |
| **FR-45 / COM-4** both participants with real membership | — | — | pass |

## What it found

**A P0 defect that every offline test had passed.**

`MatrixTimelineService.getTimeline` read the room's pending events inside the
same `try/catch` as the timeline itself. The platform throws on that call
unless the client was created with detached pending-event ordering, and the
throw was caught by the outer handler, which returned an empty array.

The effect: **a single configuration choice by the host silently emptied every
conversation**, and the Milestone 2 truthful-surfaces layer then did exactly
its job — reporting "Hali xabarlar yo'q" about official correspondence that
plainly existed.

Pending events are supplementary; they are now read separately and cannot take
the real timeline down with them.

This is the argument for §15.2 in one defect. Static analysis, a full
production build, and 90 offline tests all passed while every conversation in
the product would have rendered empty.
