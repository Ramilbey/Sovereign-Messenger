/*
 * Sovereign Messenger — Sprint 3 acceptance, live homeserver
 * receipts.test.ts — AC-3, AC-4 (FR-18 … FR-21, GW-2, GW-3)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { login, startSync, waitFor, bind, type LiveUser } from "./liveHarness";
import { MatrixReceiptService } from "../../services/MatrixReceiptService";
import { MatrixTimelineService } from "../../services/MatrixTimelineService";

let rahbar: LiveUser;
let xodim: LiveUser;
let roomId: string;
let directiveId: string;

beforeAll(async () => {
    rahbar = await login("dilshod", "Passw0rd!dilshod");
    xodim = await login("aziz", "Passw0rd!aziz");

    const created: any = await rahbar.client.createRoom({
        name: "Rasmiy buyruqlar",
        invite: [xodim.userId],
    });
    roomId = created.room_id;

    await startSync(rahbar);
    await startSync(xodim);
    await xodim.client.joinRoom(roomId);
    await waitFor(
        () => xodim.client.getRoom(roomId)?.getMyMembership() === "join",
        20000,
        "the investigator to join the channel",
    );

    const sent: any = await rahbar.client.sendTextMessage(roomId, "Buyruq: ertaga hisobot topshirilsin");
    directiveId = sent.event_id;

    await waitFor(
        () => Boolean(xodim.client.getRoom(roomId)?.findEventById(directiveId)),
        20000,
        "the directive to reach the investigator",
    );
}, 120000);

afterAll(() => {
    rahbar?.client.stopClient();
    xodim?.client.stopClient();
});

describe("AC-4 / FR-19 / FR-20 / GW-2 — who has read a directive", () => {
    it("starts with the directive unread by its recipient", () => {
        const receipts = MatrixReceiptService.getInstance();
        bind(receipts, rahbar);

        const summary = receipts.getAcknowledgement(roomId, directiveId, rahbar.userId);

        expect(summary.totalRecipients).toBe(1);
        expect(summary.readers).toHaveLength(0);
        // FR-20: the department head is told WHO is outstanding, by name.
        expect(summary.pending.map((p) => p.userId)).toEqual([xodim.userId]);
    });

    it("moves the recipient from pending to read once they read it", async () => {
        const receipts = MatrixReceiptService.getInstance();

        // The investigator reads the directive.
        bind(receipts, xodim);
        await receipts.markRead(roomId, directiveId);

        // The department head observes the acknowledgement change.
        bind(receipts, rahbar);
        const elapsed = await waitFor(
            () => receipts.getAcknowledgement(roomId, directiveId, rahbar.userId).readers.length === 1,
            20000,
            "the read receipt to reach the department head",
        );
        console.log(`      [AC-4] acknowledgement observed in ${elapsed}ms`);

        const summary = receipts.getAcknowledgement(roomId, directiveId, rahbar.userId);
        expect(summary.readers).toHaveLength(1);
        expect(summary.readers[0].userId).toBe(xodim.userId);
        expect(summary.pending).toHaveLength(0);
        // GW-3: a figure suitable for reporting to leadership.
        expect(summary.totalRecipients).toBe(1);
    });

    it("never counts the issuer as a recipient of their own directive", () => {
        const receipts = MatrixReceiptService.getInstance();
        bind(receipts, rahbar);

        const summary = receipts.getAcknowledgement(roomId, directiveId, rahbar.userId);
        const everyone = [...summary.readers, ...summary.pending].map((p) => p.userId);
        expect(everyone).not.toContain(rahbar.userId);
    });

    it("states which reading of 'has read' produced the figure (R-2)", () => {
        // A department head reporting this upward is told what it counts.
        expect(MatrixReceiptService.getInstance().getSemantic()).toBe("read-position");
    });
});

describe("AC-3 / FR-18 — a sent message progresses to read", () => {
    it("shows the sender their message as read once the recipient reaches it", async () => {
        const timeline = MatrixTimelineService.getInstance();
        bind(timeline, rahbar);

        const elapsed = await waitFor(
            () => timeline.getTimeline(roomId).find((m) => m.id === directiveId)?.delivery === "read",
            20000,
            "the sender to observe their message as read",
        );
        console.log(`      [AC-3] sender observed 'read' in ${elapsed}ms`);

        const message = timeline.getTimeline(roomId).find((m) => m.id === directiveId);
        expect(message?.delivery).toBe("read");
    });

    it("does not report a read state on somebody else's message", () => {
        const timeline = MatrixTimelineService.getInstance();
        // From the investigator's side the directive is not theirs, so it
        // carries no read state — that would be telling them about their own
        // reading.
        bind(timeline, xodim);

        const message = timeline.getTimeline(roomId).find((m) => m.id === directiveId);
        expect(message?.delivery).not.toBe("read");
    });
});
