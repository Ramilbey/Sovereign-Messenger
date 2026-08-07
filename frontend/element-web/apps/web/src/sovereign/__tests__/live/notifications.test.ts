/*
 * Sovereign Messenger — Sprint 3 acceptance, live homeserver
 * notifications.test.ts — AC-11, AC-12, AC-15 (NT-1 … NT-9, PR-1 … PR-3)
 *
 * Two real users, two real sessions. Unread counts, notification levels, and
 * profiles are all server-held state; only a real server can show that they
 * reconcile — which is the whole of NT-8 and the point of AC-11.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { login, startSync, waitFor, bind, type LiveUser } from "./liveHarness";
import { MatrixNotificationService } from "../../services/MatrixNotificationService";
import { MatrixProfileService } from "../../services/MatrixProfileService";
import { MatrixRoomService } from "../../services/MatrixRoomService";
import { summariseUnread } from "../../types/notification";
import type { SovereignConversation } from "../../types/conversation";

let rahbar: LiveUser;
let xodim: LiveUser;
let roomId: string;

/** The conversation model as the interface builds it, from a live room. */
function conversationsFor(user: LiveUser): SovereignConversation[] {
    const rooms = MatrixRoomService.getInstance();
    bind(rooms, user);

    return rooms.getJoinedRooms().map((room) => ({
        id: room.roomId,
        name: room.name,
        type: room.isDirect ? ("direct" as const) : ("group" as const),
        memberCount: room.memberCount,
        readOnlyForEmployees: false,
        lastActivityAt: room.lastActivityAt,
        preview: room.preview,
        unreadCount: room.unreadCount,
        mentionCount: room.mentionCount,
        isFavourite: room.isFavourite,
        notificationLevel: room.notificationLevel,
        hasUrgent: room.hasUrgent,
    }));
}

beforeAll(async () => {
    rahbar = await login("dilshod", "Passw0rd!dilshod");
    xodim = await login("aziz", "Passw0rd!aziz");

    const created: any = await rahbar.client.createRoom({
        name: "Bildirishnoma sinovi",
        invite: [xodim.userId],
    });
    roomId = created.room_id;

    await startSync(rahbar);
    await startSync(xodim);
    await xodim.client.joinRoom(roomId);
    await waitFor(
        () => xodim.client.getRoom(roomId)?.getMyMembership() === "join",
        20000,
        "the investigator to join",
    );
}, 120000);

afterAll(() => {
    rahbar?.client.stopClient();
    xodim?.client.stopClient();
});

describe("AC-11 / AC-12 — unread and mentions, as the server counts them", () => {
    it("raises the recipient's unread count when a message is sent", async () => {
        await rahbar.client.sendTextMessage(roomId, "Hisobotni tayyorlang");

        const elapsed = await waitFor(
            () => {
                MatrixRoomService.getInstance().refresh();
                return (
                    conversationsFor(xodim).find((c) => c.id === roomId)?.unreadCount ?? 0
                ) > 0;
            },
            20000,
            "the unread count to reach the recipient",
        );

        console.log(`      [AC-11] unread observed in ${elapsed}ms`);

        // NT-1: the aggregate is the same arithmetic the module and
        // organisation levels use, over what the server actually reported.
        expect(summariseUnread(conversationsFor(xodim)).unread).toBeGreaterThan(0);
    }, 60000);

    it("counts a mention separately from ordinary unread (NT-2)", async () => {
        await rahbar.client.sendEvent(roomId, "m.room.message" as any, {
            msgtype: "m.text",
            body: `${xodim.userId} javob bering`,
            "m.mentions": { user_ids: [xodim.userId] },
        } as any);

        const elapsed = await waitFor(
            () => {
                MatrixRoomService.getInstance().refresh();
                return (
                    conversationsFor(xodim).find((c) => c.id === roomId)?.mentionCount ?? 0
                ) > 0;
            },
            20000,
            "the mention to reach the recipient",
        );

        console.log(`      [AC-12] mention observed in ${elapsed}ms`);

        const summary = summariseUnread(conversationsFor(xodim));
        expect(summary.mentions).toBeGreaterThan(0);
    }, 60000);

    it("lists what is waiting in the notification centre (NT-3)", () => {
        const notifications = MatrixNotificationService.getInstance();
        bind(notifications, xodim);

        const feed = notifications.getFeed();

        expect(feed.length).toBeGreaterThan(0);
        expect(feed.some((entry) => entry.kind === "mention")).toBe(true);
        // EDGE-5: one entry per message, however it arrived.
        expect(new Set(feed.map((entry) => entry.id)).size).toBe(feed.length);
    });
});

describe("NT-5 / NT-8 — a notification level the server holds", () => {
    it("writes the level and reads the same answer back", async () => {
        const notifications = MatrixNotificationService.getInstance();
        bind(notifications, xodim);

        expect(notifications.getLevel(roomId)).toBe("all");

        await notifications.setLevel(roomId, "mentions");
        await waitFor(() => notifications.getLevel(roomId) === "mentions", 20000, "mentions only");

        await notifications.setLevel(roomId, "none");
        await waitFor(() => notifications.getLevel(roomId) === "none", 20000, "silenced");

        // NT-8: the choice is server state, so it is the same choice in every
        // tab and on every device — nothing here is remembered locally.
        await notifications.setLevel(roomId, "all");
        await waitFor(() => notifications.getLevel(roomId) === "all", 20000, "all messages");
    }, 90000);
});

describe("AC-15 / PR-1 / PR-3 — a real person's profile", () => {
    it("reads the colleague's name, availability, and what they share", () => {
        const profiles = MatrixProfileService.getInstance();
        bind(profiles, xodim);
        bind(MatrixRoomService.getInstance(), xodim);

        const profile = profiles.getProfile(rahbar.userId);

        expect(profile).not.toBeNull();
        expect(profile?.displayName).toBeTruthy();
        expect(profile?.isSelf).toBe(false);
        // AS-1: no role is asserted for another person, because nothing
        // authoritative carries one.
        expect(profile?.role).toBeNull();

        expect(profiles.getSharedConversations(rahbar.userId).map((c) => c.id)).toContain(roomId);
    });

    it("reads the user's own profile as their own", () => {
        const profiles = MatrixProfileService.getInstance();
        bind(profiles, xodim);

        expect(profiles.getProfile(xodim.userId)?.isSelf).toBe(true);
    });

    it("opens a direct conversation with a colleague, and reuses it (PR-3)", async () => {
        const profiles = MatrixProfileService.getInstance();
        bind(profiles, xodim);
        bind(MatrixRoomService.getInstance(), xodim);

        const first = await profiles.startDirectConversation(rahbar.userId);
        expect(first).toBeTruthy();

        await waitFor(
            () => xodim.client.getRoom(first!)?.getMyMembership() === "join",
            20000,
            "the direct conversation to appear",
        );

        MatrixRoomService.getInstance().refresh();
        bind(MatrixRoomService.getInstance(), xodim);

        // A second request finds the first rather than splitting the
        // correspondence across two conversations.
        expect(await profiles.startDirectConversation(rahbar.userId)).toBe(first);
    }, 90000);
});
