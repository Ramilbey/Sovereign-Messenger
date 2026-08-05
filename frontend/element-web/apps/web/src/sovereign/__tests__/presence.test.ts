/*
 * Sovereign Messenger — Sprint 3, Milestone 4 acceptance
 * presence.test.ts — D-7: FR-12 … FR-17, ST-6 … ST-10
 */

import { describe, it, expect, beforeEach } from "vitest";

import { MatrixPresenceService } from "../services/MatrixPresenceService";
import { PRESENCE_COPY } from "../config/presenceCopy";

function withUsers(users: Record<string, unknown>) {
    const client = {
        getUserId: () => "@me:gov.uz",
        getUser: (id: string) => users[id] ?? null,
        setPresence: async () => undefined,
        on: () => undefined,
        removeListener: () => undefined,
    };
    const service = MatrixPresenceService.getInstance();
    (service as unknown as { clientService: unknown }).clientService = { getClient: () => client };
    (service as unknown as { manual: unknown }).manual = null;
    return service;
}

beforeEach(() => {
    (MatrixPresenceService.getInstance() as unknown as { manual: unknown }).manual = null;
});

describe("FR-12 — the four availability states", () => {
    it("maps the platform's vocabulary to the product's", () => {
        const service = withUsers({
            "@on:gov": { presence: "online", currentlyActive: true, lastActiveAgo: 1000 },
            "@away:gov": { presence: "unavailable", lastActiveAgo: 600000 },
            "@busy:gov": { presence: "busy", lastActiveAgo: 0 },
            "@off:gov": { presence: "offline", lastActiveAgo: 86400000 },
        });

        expect(service.getPresence("@on:gov").state).toBe("online");
        expect(service.getPresence("@away:gov").state).toBe("away");
        expect(service.getPresence("@busy:gov").state).toBe("busy");
        expect(service.getPresence("@off:gov").state).toBe("offline");
    });

    it("derives away from an online user who is not currently active (ST-7)", () => {
        const service = withUsers({
            "@idle:gov": { presence: "online", currentlyActive: false, lastActiveAgo: 900000 },
        });
        expect(service.getPresence("@idle:gov").state).toBe("away");
    });
});

describe("R-3 / FR-1 — a person the deployment reports nothing for", () => {
    it("reads as unknown, never as offline", () => {
        const service = withUsers({});
        const presence = service.getPresence("@nobody:gov");

        // Presence may be disabled or throttled server-side. Reporting
        // "offline" would assert something about a colleague that no source
        // supports.
        expect(presence.state).toBe("unknown");
        expect(presence.state).not.toBe("offline");
    });

    it("gives unknown its own label, distinct from offline", () => {
        expect(PRESENCE_COPY.state.unknown).not.toBe(PRESENCE_COPY.state.offline);
    });
});

describe("FR-14 — last seen", () => {
    it("resolves the platform's relative report to an absolute moment", () => {
        const service = withUsers({
            "@off:gov": { presence: "offline", lastActiveAgo: 3_600_000 },
        });

        const presence = service.getPresence("@off:gov");
        expect(presence.lastActiveAt).toBeGreaterThan(0);
        expect(Date.now() - presence.lastActiveAt!).toBeGreaterThanOrEqual(3_600_000);
    });

    it("reports null rather than a guess when nothing has been seen", () => {
        const service = withUsers({ "@x:gov": { presence: "offline", lastActiveAgo: 0 } });
        expect(service.getPresence("@x:gov").lastActiveAt).toBeNull();
    });
});

describe("FR-15 / ST-8 — manual availability overrides automatic detection", () => {
    it("holds the manual selection for the signed-in user until cleared", async () => {
        const service = withUsers({
            "@me:gov.uz": { presence: "online", currentlyActive: true, lastActiveAgo: 10 },
        });

        await service.setManualPresence("busy");
        expect(service.getPresence("@me:gov.uz").state).toBe("busy");

        await service.setManualPresence(null);
        expect(service.getPresence("@me:gov.uz").state).toBe("online");
    });

    it("does not apply one person's manual selection to anybody else", async () => {
        const service = withUsers({
            "@me:gov.uz": { presence: "online", currentlyActive: true, lastActiveAgo: 10 },
            "@other:gov": { presence: "online", currentlyActive: true, lastActiveAgo: 10 },
        });

        await service.setManualPresence("busy");
        expect(service.getPresence("@other:gov").state).toBe("online");
    });
});

describe("FR-16 / A11Y-5 / ST-10 — no state rests on colour", () => {
    it("gives every state a distinct text label", () => {
        const labels = Object.values(PRESENCE_COPY.state);
        expect(new Set(labels).size).toBe(labels.length);
        labels.forEach((label) => expect(label.length).toBeGreaterThan(0));
    });
});
