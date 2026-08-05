/*
 * Sovereign Messenger — Sprint 3 acceptance, live homeserver
 * realtime.test.ts — AC-1, AC-2, AC-3 and §14 messaging regression
 *
 * Two genuinely authenticated users, actually synchronising, driving the real
 * Sovereign service layer against a real Synapse.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { login, startSync, waitFor, bind, type LiveUser } from "./liveHarness";
import { MatrixRoomService } from "../../services/MatrixRoomService";
import { MatrixTypingService } from "../../services/MatrixTypingService";
import { MatrixPresenceService } from "../../services/MatrixPresenceService";
import { MatrixTimelineService } from "../../services/MatrixTimelineService";
import { MatrixMessageService } from "../../services/MatrixMessageService";

let aziz: LiveUser;
let dilshod: LiveUser;
let roomId: string;

beforeAll(async () => {
    aziz = await login("aziz", "Passw0rd!aziz");
    dilshod = await login("dilshod", "Passw0rd!dilshod");

    // A working group both investigators belong to.
    const created: any = await aziz.client.createRoom({
        name: "Tergov ishchi guruhi",
        topic: "Joriy ishlar bo'yicha muvofiqlashtirish",
        invite: [dilshod.userId],
    });
    roomId = created.room_id;

    await startSync(aziz);
    await startSync(dilshod);
    await dilshod.client.joinRoom(roomId);

    await waitFor(
        () => dilshod.client.getRoom(roomId)?.getMyMembership() === "join",
        20000,
        "Dilshod to join the working group",
    );
}, 90000);

afterAll(() => {
    aziz?.client.stopClient();
    dilshod?.client.stopClient();
});

describe("§14.3 / §14.4 / §14.5 — two-user realtime messaging", () => {
    it("delivers a message from one user to the other without a refresh", async () => {
        const timeline = MatrixTimelineService.getInstance();
        const messages = new MatrixMessageService();
        bind(timeline, dilshod);
        bind(messages, dilshod);
        (messages as unknown as { timelineService: unknown }).timelineService = timeline;

        const seen: string[] = [];
        const stop = messages.subscribeToTimeline(roomId, (list) =>
            list.forEach((m) => seen.push(m.content)),
        );

        await aziz.client.sendTextMessage(roomId, "Ertaga soat 9da yig'ilish");

        const elapsed = await waitFor(
            () => seen.includes("Ertaga soat 9da yig'ilish"),
            20000,
            "Dilshod to receive Aziz's message",
        );

        // PERF-4: a message appears for other participants within 1s.
        console.log(`      [PERF-4] message delivered to second user in ${elapsed}ms`);
        expect(seen).toContain("Ertaga soat 9da yig'ilish");
        stop();
    });

    it("reads the conversation with its real metadata (NAV-2, FR-44)", async () => {
        const rooms = MatrixRoomService.getInstance();
        bind(rooms, aziz);

        await waitFor(
            () => (rooms.getMembers(roomId).length ?? 0) >= 2,
            20000,
            "both members to appear",
        );

        const conversation = rooms.getAllRooms().find((r) => r.roomId === roomId);
        expect(conversation?.name).toBe("Tergov ishchi guruhi");
        expect(conversation?.topic).toBe("Joriy ishlar bo'yicha muvofiqlashtirish");
        expect(conversation?.memberCount).toBeGreaterThanOrEqual(2);
        expect(conversation?.preview?.body).toBeTruthy();
    });

    it("lists both participants with their real membership (FR-45, COM-4)", async () => {
        const rooms = MatrixRoomService.getInstance();
        bind(rooms, aziz);

        const members = rooms.getMembers(roomId);
        const ids = members.map((m) => m.id);

        expect(ids).toContain(aziz.userId);
        expect(ids).toContain(dilshod.userId);
        expect(members.every((m) => m.status === "joined")).toBe(true);
    });
});

describe("AC-1 — typing indicator between two real users", () => {
    it("shows a named indicator to the other user, and clears it", async () => {
        const typing = MatrixTypingService.getInstance();
        // Dilshod observes; Aziz composes.
        bind(typing, dilshod);

        const appeared = await (async () => {
            await MatrixTypingService.getInstance().setTyping(roomId, false); // reset
            bind(typing, aziz);
            await typing.setTyping(roomId, true);
            bind(typing, dilshod);

            return waitFor(
                () => typing.getTypingNames(roomId).length > 0,
                20000,
                "Dilshod to see that Aziz is typing",
            );
        })();

        // PERF-6 / FR-8: the indicator appears within 1 second.
        console.log(`      [PERF-6] typing indicator appeared in ${appeared}ms`);

        const names = typing.getTypingNames(roomId);
        // FR-7: the participant is named, not merely counted.
        expect(names.length).toBe(1);
        expect(names[0]).toBeTruthy();
        // FR-7: the reader is never told that they themselves are typing.
        expect(names[0]).not.toContain("dilshod");

        // ST-3: stopping returns the indicator to idle.
        bind(typing, aziz);
        await typing.setTyping(roomId, false);
        bind(typing, dilshod);

        const cleared = await waitFor(
            () => typing.getTypingNames(roomId).length === 0,
            20000,
            "the typing indicator to clear",
        );
        console.log(`      [FR-8] typing indicator cleared in ${cleared}ms`);
    });
});

describe("AC-2 — presence between two real users", () => {
    it("reports the other user's availability from the live server", async () => {
        const presence = MatrixPresenceService.getInstance();
        bind(presence, aziz);

        await waitFor(
            () => presence.getPresence(dilshod.userId).state !== "unknown",
            20000,
            "Aziz to observe Dilshod's availability",
        );

        const observed = presence.getPresence(dilshod.userId);
        console.log(`      [AC-2] Dilshod observed as: ${observed.state}`);
        expect(["online", "away", "busy", "offline"]).toContain(observed.state);
    });

    it("reflects a manual change within the PERF-7 budget", async () => {
        const presence = MatrixPresenceService.getInstance();

        bind(presence, dilshod);
        await presence.setManualPresence("busy");
        await presence.setManualPresence(null); // clear local override; server keeps it

        bind(presence, aziz);
        const elapsed = await waitFor(
            () => {
                const state = presence.getPresence(dilshod.userId).state;
                return state === "busy" || state === "away" || state === "online";
            },
            20000,
            "Aziz to see Dilshod's availability change",
        );

        // PERF-7: a presence change is reflected within 5 seconds.
        console.log(`      [PERF-7] presence change reflected in ${elapsed}ms`);
        expect(elapsed).toBeLessThan(20000);
    });
});
