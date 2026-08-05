/*
 * Sovereign Messenger — Sprint 3, Milestone 3 acceptance
 * timeline.test.ts — FR-32, FR-33, FR-35, FR-36, FR-37, COM-5, COM-8,
 * EDGE-2, EDGE-15, ST-38, ST-40
 */

import { describe, it, expect } from "vitest";

import { MatrixTimelineService } from "../services/MatrixTimelineService";
import { MatrixMessageService } from "../services/MatrixMessageService";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";
import { formatDayLabel, formatRelativeTime } from "../config/timeCopy";

function useRooms(specs: FakeRoomSpec[]) {
    const client = createFakeClient(specs);
    const timeline = MatrixTimelineService.getInstance();
    const messages = new MatrixMessageService();
    const stub = { getClient: () => client };

    (timeline as unknown as { clientService: unknown }).clientService = stub;
    (messages as unknown as { clientService: unknown }).clientService = stub;
    (messages as unknown as { timelineService: unknown }).timelineService = timeline;

    return { client, timeline, messages };
}

const page = (from: number, count: number) =>
    Array.from({ length: count }, (_, i) => ({
        id: `$${from + i}`,
        sender: "@a:gov",
        senderName: "Aziz",
        body: `message ${from + i}`,
        ts: (from + i) * 1000,
    }));

describe("FR-36 / EDGE-2 — earlier history loads in segments", () => {
    it("reports that earlier messages remain when the room can page back", () => {
        const { timeline } = useRooms([
            { id: "!g:gov", name: "G", messages: page(100, 20), earlier: page(0, 100) },
        ]);
        expect(timeline.hasEarlierMessages("!g:gov")).toBe(true);
    });

    it("reports none for a conversation showing its whole history", () => {
        const { timeline } = useRooms([{ id: "!g:gov", name: "G", messages: page(0, 5) }]);
        expect(timeline.hasEarlierMessages("!g:gov")).toBe(false);
    });

    it("loads one page at a time rather than the whole history", async () => {
        const { timeline } = useRooms([
            { id: "!g:gov", name: "G", messages: page(100, 20), earlier: page(0, 100) },
        ]);

        const before = timeline.getTimeline("!g:gov").length;
        const more = await timeline.loadEarlierMessages("!g:gov");
        const after = timeline.getTimeline("!g:gov").length;

        expect(after).toBeGreaterThan(before);
        // EDGE-2: a segment, not the lot — 100,000 messages must not arrive at once.
        expect(after - before).toBeLessThanOrEqual(40);
        expect(more).toBe(true);
    });

    it("reaches the start of the conversation and then stops", async () => {
        const { timeline } = useRooms([
            { id: "!g:gov", name: "G", messages: page(40, 10), earlier: page(0, 40) },
        ]);

        let guard = 0;
        while (timeline.hasEarlierMessages("!g:gov") && guard++ < 20) {
            await timeline.loadEarlierMessages("!g:gov");
        }

        expect(timeline.hasEarlierMessages("!g:gov")).toBe(false);
        expect(guard).toBeLessThan(20);
    });

    it("collapses concurrent requests for the same conversation", async () => {
        const { timeline } = useRooms([
            { id: "!g:gov", name: "G", messages: page(100, 10), earlier: page(0, 100) },
        ]);

        // The scroll handler fires faster than a page can load; a second
        // request for the same token would duplicate the arriving events.
        const [first, second] = await Promise.all([
            timeline.loadEarlierMessages("!g:gov"),
            timeline.loadEarlierMessages("!g:gov"),
        ]);

        expect(first).toBe(true);
        expect(second).toBe(false);
    });
});

describe("FR-37 — the read boundary", () => {
    it("reports the position the reader had reached", () => {
        const { timeline } = useRooms([{ id: "!g:gov", name: "G", messages: page(0, 10) }]);
        expect(timeline.getReadUpToEventId("!g:gov")).toBe("$0");
    });

    it("reports null rather than guessing when no position is recorded", () => {
        const { timeline } = useRooms([{ id: "!g:gov", name: "G", messages: [] }]);
        expect(timeline.getReadUpToEventId("!g:gov")).toBeNull();
    });
});

describe("FR-35 / COM-6 / ST-40 — a message that cannot be displayed", () => {
    it("keeps it in the timeline as an unavailable state, not as text", () => {
        const { timeline } = useRooms([
            {
                id: "!g:gov",
                name: "G",
                messages: [
                    { id: "$1", sender: "@a:gov", senderName: "Aziz", body: "ochiq", ts: 1000 },
                    { id: "$2", sender: "@b:gov", senderName: "Dilshod", body: "", ts: 2000, encrypted: true },
                ],
            },
        ]);

        const items = timeline.getTimeline("!g:gov");
        expect(items).toHaveLength(2);

        const unavailable = items.find((m) => m.id === "$2");
        expect(unavailable?.type).toBe("unavailable");
        // The body is never carried through as message content.
        expect(unavailable?.body).toBe("");
    });

    it("treats a decryption failure the same way", () => {
        const { timeline } = useRooms([
            {
                id: "!g:gov",
                name: "G",
                messages: [
                    { id: "$1", sender: "@a:gov", senderName: "A", body: "x", ts: 1, decryptionFailure: true },
                ],
            },
        ]);
        expect(timeline.getTimeline("!g:gov")[0].type).toBe("unavailable");
    });
});

describe("COM-5 / ST-38 / ERR-1 — delivery state is the platform's own", () => {
    it("does not present a queued message as sent", async () => {
        const { messages } = useRooms([
            {
                id: "!g:gov",
                name: "G",
                messages: [
                    { id: "$1", sender: "@me:gov.uz", senderName: "Me", body: "sent", ts: 1000 },
                    { id: "$2", sender: "@me:gov.uz", senderName: "Me", body: "waiting", ts: 2000, status: "queued" },
                    { id: "$3", sender: "@me:gov.uz", senderName: "Me", body: "rejected", ts: 3000, status: "not_sent" },
                ],
            },
        ]);

        const captured: Record<string, string | undefined> = {};
        const stop = messages.subscribeToTimeline("!g:gov", (list) => {
            list.forEach((m) => (captured[m.content] = m.readState));
        });

        expect(captured["sent"]).toBe("sent");
        expect(captured["waiting"]).toBe("queued");
        expect(captured["rejected"]).toBe("failed");
        stop();
    });

    it("never reports a message as read, which would need receipts", async () => {
        const { messages } = useRooms([
            { id: "!g:gov", name: "G", messages: page(0, 5) },
        ]);

        const states: Array<string | undefined> = [];
        const stop = messages.subscribeToTimeline("!g:gov", (list) =>
            list.forEach((m) => states.push(m.readState)),
        );

        expect(states.length).toBeGreaterThan(0);
        expect(states).not.toContain("read");
        expect(states).not.toContain("delivered");
        stop();
    });

    it("asserts no organisational role for another sender (FR-34, AS-1)", () => {
        const { messages } = useRooms([
            { id: "!g:gov", name: "G", messages: page(0, 3) },
        ]);

        const roles: Array<string | undefined> = [];
        const stop = messages.subscribeToTimeline("!g:gov", (list) =>
            list.forEach((m) => roles.push(m.senderRole)),
        );

        expect(roles.length).toBeGreaterThan(0);
        expect(roles.every((r) => r === undefined)).toBe(true);
        stop();
    });
});

describe("COM-8 / EDGE-15 — ordering follows server time", () => {
    it("carries the origin timestamp for ordering, not local time", () => {
        const { messages } = useRooms([
            { id: "!g:gov", name: "G", messages: page(0, 3) },
        ]);

        const stamps: Array<number | undefined> = [];
        const stop = messages.subscribeToTimeline("!g:gov", (list) =>
            list.forEach((m) => stamps.push(m.sentAt)),
        );

        expect(stamps).toEqual([0, 1000, 2000]);
        stop();
    });
});

describe("FR-33 / UX-14 — relative day and time labels", () => {
    const now = new Date("2026-08-05T14:00:00").getTime();
    const day = 24 * 60 * 60 * 1000;

    it("labels today and yesterday in Uzbek", () => {
        expect(formatDayLabel(now, now)).toBe("Bugun");
        expect(formatDayLabel(now - day, now)).toBe("Kecha");
    });

    it("falls back to a date once relative reading stops helping", () => {
        expect(formatDayLabel(now - 10 * day, now)).not.toBe("Bugun");
        expect(formatDayLabel(now - 10 * day, now)).not.toBe("Kecha");
    });

    it("gives recent activity a relative label", () => {
        expect(formatRelativeTime(now - 30_000, now)).toBe("Hozir");
        expect(formatRelativeTime(now - 30 * 60_000, now)).toBe("30 daqiqa oldin");
    });
});
