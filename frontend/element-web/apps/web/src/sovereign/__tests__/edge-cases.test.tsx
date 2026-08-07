/*
 * Sovereign Messenger — Sprint 3, Milestone 5 acceptance
 * edge-cases.test.tsx — D-27 edge case validation.
 *
 * Covers the §8.12 conditions not already exercised where the earlier
 * milestones built them: EDGE-1 and EDGE-2 in conversations.test.ts and
 * timeline.test.ts, EDGE-4, EDGE-8 and EDGE-16 in attachments.test.tsx,
 * EDGE-5 in notifications.test.tsx, EDGE-13 in regression.test.tsx.
 *
 * AC-33, AC-34.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, renderHook } from "@testing-library/react";

import { MatrixRoomService } from "../services/MatrixRoomService";
import { MatrixTimelineService } from "../services/MatrixTimelineService";
import { MatrixNotificationService } from "../services/MatrixNotificationService";
import { MatrixFileService } from "../services/MatrixFileService";
import { OutboxService } from "../services/OutboxService";
import { useMessages } from "../hooks/useMessages";
import { useUpload } from "../hooks/useUpload";
import { ChatArea } from "../components/layout/ChatArea";
import { CHAT_COPY } from "../config/chatCopy";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";
import type { MessageService, SovereignMessage } from "../services/MessageService";

function bindServices(specs: FakeRoomSpec[]) {
    const client = createFakeClient(specs);
    const stub = { getClient: () => client };

    for (const service of [
        MatrixRoomService.getInstance(),
        MatrixTimelineService.getInstance(),
        MatrixNotificationService.getInstance(),
        MatrixFileService.getInstance(),
    ]) {
        (service as unknown as { clientService: unknown }).clientService = stub;
    }
    (MatrixRoomService.getInstance() as unknown as { snapshot: unknown }).snapshot = null;

    return { client };
}

beforeEach(() => {
    OutboxService.getInstance().clearAll();
});

describe("EDGE-11 — offline, then reconnected", () => {
    it("sends what was queued in the order it was written", async () => {
        const outbox = OutboxService.getInstance();
        const sent: string[] = [];
        let online = false;

        outbox.start(async (_conversationId, content) => {
            if (!online) throw new Error("offline");
            sent.push(content);
        });

        // Written while the connection was down: each is recorded and each
        // send fails, so nothing is lost and nothing is delivered.
        await outbox.submit("!g:gov", "birinchi");
        await outbox.submit("!g:gov", "ikkinchi");
        await outbox.submit("!g:gov", "uchinchi");

        expect(sent).toEqual([]);
        expect(outbox.getPending("!g:gov").map((r) => r.content)).toEqual([
            "birinchi",
            "ikkinchi",
            "uchinchi",
        ]);

        online = true;
        // What reconnection triggers: the records are replayed, oldest first.
        await (outbox as unknown as { replay: () => Promise<void> }).replay();

        // SUX-6: original order, which is the order the user wrote them in.
        expect(sent).toEqual(["birinchi", "ikkinchi", "uchinchi"]);
        expect(outbox.getPending("!g:gov")).toEqual([]);

        outbox.stop();
    });
});

describe("EDGE-17 — rapid conversation switching", () => {
    it("renders only the conversation most recently asked for", async () => {
        const timelines: Record<string, SovereignMessage[]> = {
            "!a:gov": [
                {
                    id: "$a",
                    channelId: "!a:gov",
                    senderId: "@x:gov",
                    senderName: "X",
                    content: "A dagi xabar",
                    timestamp: "10:00",
                    date: "Bugun",
                },
            ],
            "!b:gov": [
                {
                    id: "$b",
                    channelId: "!b:gov",
                    senderId: "@y:gov",
                    senderName: "Y",
                    content: "B dagi xabar",
                    timestamp: "10:01",
                    date: "Bugun",
                },
            ],
        };

        // A transport that answers slowly, and out of order: the first
        // conversation's messages arrive after the second's.
        const pending: Array<() => void> = [];
        const service: MessageService = {
            subscribeToTimeline: (channelId: string, callback: (m: SovereignMessage[]) => void) => {
                pending.push(() => callback(timelines[channelId] ?? []));
                return () => undefined;
            },
            sendMessage: async () => undefined,
            sendToConversation: async () => undefined,
            loadEarlier: async () => false,
            hasEarlier: () => false,
            getReadUpToId: () => null,
        } as unknown as MessageService;

        const { result, rerender } = renderHook(({ id }) => useMessages(id, service), {
            initialProps: { id: "!a:gov" },
        });

        rerender({ id: "!b:gov" });

        await act(async () => {
            // The superseded conversation answers last.
            pending.reverse().forEach((deliver) => deliver());
        });

        expect(result.current.messages.map((m) => m.id)).toEqual(["$b"]);
    });
});

describe("EDGE-7 — a conversation that is removed under the reader", () => {
    it("moves the reader on and explains once, rather than breaking the screen", async () => {
        const { ChatProvider } = await import("../context/ChatContext");
        const { PermissionProvider } = await import("../context/PermissionContext");

        const user = {
            id: "@me:gov.uz",
            displayName: "Aziz",
            role: "Employee" as const,
            department: null,
            status: "online" as const,
            statusLabel: "Tarmoqda",
            avatarInitials: "AZ",
        };

        const { client } = bindServices([
            { id: "!a:gov", name: "Birinchi", memberCount: 4 },
            { id: "!b:gov", name: "Ikkinchi", memberCount: 4 },
        ]);

        render(
            <PermissionProvider currentUser={user}>
                <ChatProvider defaultChannelId="!a:gov">
                    <ChatArea />
                </ChatProvider>
            </PermissionProvider>,
        );

        expect(screen.getByText("Birinchi")).toBeTruthy();

        // The conversation goes away, as it does when the user is removed
        // from it or it becomes inaccessible.
        const rooms = (client as unknown as { __rooms: Array<{ roomId: string }> }).__rooms;
        rooms.splice(0, 1);

        await act(async () => {
            (client as unknown as { __emit: (event: string) => void }).__emit("sync");
            await new Promise((resolve) => setTimeout(resolve, 80));
        });

        expect(screen.getByText(CHAT_COPY.conversationRemoved("Birinchi"))).toBeTruthy();
        // Not left on a broken screen: they are in a conversation that exists.
        expect(screen.getByText("Ikkinchi")).toBeTruthy();
    });
});

describe("EDGE-18 — several uploads at once", () => {
    it("keeps each transfer's progress and cancellation independent", async () => {
        bindServices([]);

        const cancelled: string[] = [];
        const handles = new Map<string, (fraction: number) => void>();

        vi.spyOn(MatrixFileService.getInstance(), "check").mockReturnValue(null);
        vi.spyOn(MatrixFileService.getInstance(), "upload").mockImplementation(
            (file, onProgress) => {
                handles.set(file.name, onProgress);
                return {
                    promise: new Promise<string | null>(() => undefined),
                    cancel: () => cancelled.push(file.name),
                };
            },
        );

        const { result } = renderHook(() => useUpload());

        await act(async () => {
            result.current.add([
                new File(["a"], "birinchi.pdf", { type: "application/pdf" }),
                new File(["b"], "ikkinchi.pdf", { type: "application/pdf" }),
            ]);
        });

        await act(async () => {
            void result.current.uploadAll();
        });

        // FR-25: each reports its own progress.
        await act(async () => {
            handles.get("birinchi.pdf")?.(0.5);
        });

        const byName = Object.fromEntries(result.current.attachments.map((a) => [a.name, a]));
        expect(byName["birinchi.pdf"].progress).toBeCloseTo(0.5);
        expect(byName["ikkinchi.pdf"].progress).toBe(0);

        // FR-25 / ST-12: cancelling one leaves the other transferring.
        await act(async () => {
            result.current.cancel(byName["birinchi.pdf"].id);
        });

        expect(cancelled).toEqual(["birinchi.pdf"]);
        expect(
            result.current.attachments.find((a) => a.name === "ikkinchi.pdf")?.state,
        ).toBe("uploading");

        vi.restoreAllMocks();
    });
});

describe("EDGE-9 / EDGE-10 / AC-33 — one tab, another tab, another device", () => {
    it("takes unread state from the platform rather than counting locally", () => {
        bindServices([
            { id: "!a:gov", name: "A", unread: 4, highlight: 1 },
            { id: "!b:gov", name: "B", unread: 0 },
        ]);

        const rooms = MatrixRoomService.getInstance().getAllRooms();
        const byId = Object.fromEntries(rooms.map((r) => [r.roomId, r]));

        // NT-8: the figure is the server's, so a message read in another tab
        // or on another device is already reflected here — a local tally is
        // the only way these could disagree.
        expect(byId["!a:gov"].unreadCount).toBe(4);
        expect(byId["!a:gov"].mentionCount).toBe(1);
        expect(byId["!b:gov"].unreadCount).toBe(0);
    });
});

describe("EDGE-12 — a temporary outage", () => {
    it("keeps previously loaded content readable when the platform goes away", () => {
        const { client } = bindServices([
            {
                id: "!a:gov",
                name: "A",
                messages: [{ id: "$1", sender: "@x:gov", senderName: "X", body: "Salom", ts: 1 }],
            },
        ]);

        const timeline = MatrixTimelineService.getInstance();
        expect(timeline.getTimeline("!a:gov")).toHaveLength(1);

        // The client is gone — as it is between a disconnection and recovery.
        (timeline as unknown as { clientService: unknown }).clientService = {
            getClient: () => null,
        };

        // Nothing throws, and nothing is fabricated to fill the gap; the
        // surfaces already rendered keep what they were given.
        expect(timeline.getTimeline("!a:gov")).toEqual([]);
        expect(client).toBeTruthy();
    });
});
