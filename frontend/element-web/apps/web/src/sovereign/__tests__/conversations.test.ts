/*
 * Sovereign Messenger — Sprint 3, Milestone 3 acceptance
 * conversations.test.ts — NAV-2, NAV-3, IA-6, IA-7, IA-8, NT-1, NT-2, NT-6,
 * FR-44, FR-45, COM-2, PERF-10
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

import { MatrixRoomService } from "../services/MatrixRoomService";
import { MatrixNotificationService } from "../services/MatrixNotificationService";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";

function useRooms(specs: FakeRoomSpec[]) {
    const client = createFakeClient(specs);
    const service = MatrixRoomService.getInstance();
    // Both services read the platform through MatrixClientService; the fake
    // stands in for the synchronised client it would return. The room list
    // reports the notification level (NT-5), so both see the same world.
    const stub = { getClient: () => client };
    (service as unknown as { clientService: unknown }).clientService = stub;
    (service as unknown as { snapshot: unknown }).snapshot = null;
    (MatrixNotificationService.getInstance() as unknown as { clientService: unknown }).clientService = stub;
    return { client, service };
}

beforeEach(() => {
    vi.useRealTimers();
});

describe("IA-6 — three conversation types", () => {
    it("classifies a published channel, a working group, and a direct conversation", () => {
        const { service } = useRooms([
            { id: "!c:gov", name: "E'lonlar", alias: "#elonlar:gov", memberCount: 40 },
            { id: "!g:gov", name: "Tergov guruhi", memberCount: 8 },
            { id: "!d:gov", name: "Aziz Rahimov", memberCount: 2 },
        ]);

        const rooms = service.getAllRooms();
        const byId = Object.fromEntries(rooms.map((r) => [r.roomId, r]));

        expect(byId["!c:gov"].canonicalAlias).toBe("#elonlar:gov");
        expect(byId["!g:gov"].isDirect).toBe(false);
        expect(byId["!d:gov"].isDirect).toBe(true);
    });
});

describe("NAV-2 / FR-44 — the metadata the list and header present", () => {
    it("reads member count, topic, last activity and preview from the room", () => {
        const { service } = useRooms([
            {
                id: "!g:gov",
                name: "Tergov",
                memberCount: 12,
                topic: "Joriy ishlar",
                lastActive: 1_700_000_000_000,
                messages: [
                    { id: "$1", sender: "@a:gov", senderName: "Aziz", body: "Salom", ts: 1 },
                    { id: "$2", sender: "@b:gov", senderName: "Dilshod", body: "Bugun soat 10da", ts: 2 },
                ],
            },
        ]);

        const room = service.getAllRooms()[0];
        expect(room.memberCount).toBe(12);
        expect(room.topic).toBe("Joriy ishlar");
        expect(room.lastActivityAt).toBe(1_700_000_000_000);
        // The preview is the most recent displayable message, with its sender.
        expect(room.preview).toEqual({ senderName: "Dilshod", body: "Bugun soat 10da" });
    });

    it("reports no preview rather than inventing one when nothing is displayable", () => {
        const { service } = useRooms([
            { id: "!g:gov", name: "Yangi", messages: [{ id: "$1", sender: "@a:gov", senderName: "A", body: "", ts: 1 }] },
        ]);
        expect(service.getAllRooms()[0].preview).toBeNull();
    });
});

describe("NT-1 / NT-2 / NT-6 — unread state is read, never computed", () => {
    it("reports the server's unread and mention counts", () => {
        const { service } = useRooms([{ id: "!g:gov", name: "G", unread: 7, highlight: 2 }]);
        const room = service.getAllRooms()[0];
        expect(room.unreadCount).toBe(7);
        expect(room.mentionCount).toBe(2);
    });

    it("reports each notification level and a favourite room from their platform state", () => {
        const { service } = useRooms([
            { id: "!n:gov", name: "Silenced", level: "none" },
            { id: "!m:gov", name: "Mentions only", level: "mentions" },
            { id: "!a:gov", name: "All", level: "all" },
            { id: "!f:gov", name: "Fav", favourite: true },
        ]);
        const byId = Object.fromEntries(service.getAllRooms().map((r) => [r.roomId, r]));

        // NT-5: the two ways a conversation can be silenced do not mean the
        // same thing, and are not read as though they did.
        expect(byId["!n:gov"].notificationLevel).toBe("none");
        expect(byId["!m:gov"].notificationLevel).toBe("mentions");
        expect(byId["!a:gov"].notificationLevel).toBe("all");
        expect(byId["!f:gov"].isFavourite).toBe(true);
    });
});

describe("COM-2 / SUX-9 — posting rights come from the room", () => {
    it("answers from the room's power levels", () => {
        const { service } = useRooms([
            { id: "!open:gov", name: "Group", canPost: true },
            { id: "!announce:gov", name: "Channel", canPost: false },
        ]);
        expect(service.canSendMessage("!open:gov")).toBe(true);
        expect(service.canSendMessage("!announce:gov")).toBe(false);
    });

    it("answers null — not false — for a room it has never seen", () => {
        const { service } = useRooms([{ id: "!a:gov", name: "A" }]);
        // "Unknown" must not be treated as a refusal, or an unloaded room
        // would silently remove the composer.
        expect(service.canSendMessage("!missing:gov")).toBeNull();
    });
});

describe("FR-45 / COM-4 / EDGE-6 — conversation participants", () => {
    it("lists members joined first, then invited, then departed, each by name", () => {
        const { service } = useRooms([
            {
                id: "!g:gov",
                name: "G",
                members: [
                    { id: "@zafar:gov", name: "Zafar", membership: "join" },
                    { id: "@aziz:gov", name: "Aziz", membership: "join" },
                    { id: "@nodira:gov", name: "Nodira", membership: "invite" },
                    { id: "@olim:gov", name: "Olim", membership: "leave" },
                ],
            },
        ]);

        const members = service.getMembers("!g:gov");
        expect(members.map((m) => m.displayName)).toEqual(["Aziz", "Zafar", "Nodira", "Olim"]);
        expect(members.map((m) => m.status)).toEqual(["joined", "joined", "invited", "left"]);
    });

    it("keeps a departed participant rather than dropping them (EDGE-6)", () => {
        const { service } = useRooms([
            { id: "!g:gov", name: "G", members: [{ id: "@olim:gov", name: "Olim", membership: "leave" }] },
        ]);
        expect(service.getMembers("!g:gov")).toHaveLength(1);
    });

    it("reports who may post, so a read-only channel is legible", () => {
        const { service } = useRooms([
            {
                id: "!c:gov",
                name: "Channel",
                members: [
                    { id: "@boss:gov", name: "Dilshod", membership: "join", canPost: true },
                    { id: "@staff:gov", name: "Aziz", membership: "join", canPost: false },
                ],
            },
        ]);
        const byName = Object.fromEntries(service.getMembers("!c:gov").map((m) => [m.displayName, m]));
        expect(byName["Dilshod"].canPost).toBe(true);
        expect(byName["Aziz"].canPost).toBe(false);
    });

    it("asserts no role for another person, because no source supplies one (AS-1)", () => {
        const { service } = useRooms([
            { id: "!g:gov", name: "G", members: [{ id: "@a:gov", name: "Aziz", membership: "join" }] },
        ]);
        expect(service.getMembers("!g:gov")[0].role).toBeUndefined();
    });
});

describe("PERF-10 / EDGE-1 — the room list at scale", () => {
    function manyRooms(count: number): FakeRoomSpec[] {
        return Array.from({ length: count }, (_, i) => ({
            id: `!r${i}:gov`,
            name: `Room ${i}`,
            memberCount: 8,
            lastActive: i,
            messages: Array.from({ length: 60 }, (_, j) => ({
                id: `$${i}-${j}`,
                sender: "@a:gov",
                senderName: "Aziz",
                body: `message ${j}`,
                ts: j,
            })),
        }));
    }

    it("serves concurrent readers one shared computation", () => {
        const { service } = useRooms(manyRooms(200));

        const first = service.getAllRooms();
        const rest = [service.getAllRooms(), service.getAllRooms(), service.getAllRooms()];

        // Identical reference: React bails out of the redundant renders, and
        // the room set is mapped once rather than once per reader.
        rest.forEach((r) => expect(r).toBe(first));
    });

    it("renders 5,000 conversations within the interaction budget", () => {
        const { service } = useRooms(manyRooms(5000));

        const started = performance.now();
        const rooms = service.getAllRooms();
        const elapsed = performance.now() - started;

        expect(rooms).toHaveLength(5000);
        // EDGE-1: a conversation list at this scale must stay responsive.
        expect(elapsed).toBeLessThan(1000);
    });

    it("does not serve a stale room list after the platform reports a change", async () => {
        const { client, service } = useRooms([{ id: "!a:gov", name: "A" }]);

        const before = service.getAllRooms();
        service.subscribe(() => undefined);
        client.__emit("sync");

        await new Promise((resolve) => setTimeout(resolve, 5));
        expect(service.getAllRooms()).not.toBe(before);
    });
});
