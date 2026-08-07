/*
 * Sovereign Messenger — Sprint 3, Milestone 5 acceptance
 * notifications.test.tsx — D-11 in-application notifications.
 *
 * AC-11, AC-12, AC-33, FR-49 … FR-54, NT-1 … NT-9, EDGE-5, A11Y-5
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { act, render, screen, fireEvent } from "@testing-library/react";

import { MatrixNotificationService } from "../services/MatrixNotificationService";
import { MatrixRoomService } from "../services/MatrixRoomService";
import { ConversationList } from "../components/navigation/ConversationList";
import { WorkspaceNavigation } from "../components/navigation/WorkspaceNavigation";
import { GovernmentNavigation } from "../components/navigation/GovernmentNavigation";
import { OrganisationService } from "../services/OrganisationService";
import { summariseUnread, type UnreadSummary } from "../types/notification";
import { CONVERSATION_COPY } from "../config/navigationCopy";
import { NOTIFICATION_COPY, NOTIFICATION_LEVEL_LABEL } from "../config/notificationCopy";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";
import type { SovereignConversation } from "../types/conversation";

const conv = (over: Partial<SovereignConversation> & { id: string }): SovereignConversation => ({
    name: "Suhbat",
    type: "group",
    memberCount: 5,
    readOnlyForEmployees: false,
    lastActivityAt: 1000,
    preview: null,
    unreadCount: 0,
    mentionCount: 0,
    isFavourite: false,
    notificationLevel: "all",
    hasUrgent: false,
    ...over,
});

/** Both services read the platform through the same stand-in client. */
function useServices(specs: FakeRoomSpec[], userId = "@me:gov.uz") {
    const client = createFakeClient(specs, userId);
    const stub = { getClient: () => client };

    const notifications = MatrixNotificationService.getInstance();
    (notifications as unknown as { clientService: unknown }).clientService = stub;

    const rooms = MatrixRoomService.getInstance();
    (rooms as unknown as { clientService: unknown }).clientService = stub;
    (rooms as unknown as { snapshot: unknown }).snapshot = null;

    return { client, notifications, rooms };
}

describe("NT-1 / AC-11 — unread aggregates upward accurately", () => {
    it("adds the conversation counts, and adds nothing else", () => {
        const summary = summariseUnread([
            conv({ id: "!a:gov", unreadCount: 3 }),
            conv({ id: "!b:gov", unreadCount: 4, mentionCount: 1 }),
            conv({ id: "!c:gov" }),
        ]);

        expect(summary).toEqual({ unread: 7, mentions: 1 });
    });

    it("counts a silenced conversation out of the total but not out of the list (NT-6)", () => {
        const silenced = conv({ id: "!m:gov", unreadCount: 9, notificationLevel: "none" });
        expect(summariseUnread([silenced])).toEqual({ unread: 0, mentions: 0 });

        render(
            <ConversationList
                conversations={[silenced]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );
        expect(screen.getByText("Suhbat")).toBeTruthy();
    });

    it("keeps a mentions-only conversation out of the ordinary total, mentions included", () => {
        expect(
            summariseUnread([
                conv({ id: "!m:gov", unreadCount: 12, mentionCount: 2, notificationLevel: "mentions" }),
            ]),
        ).toEqual({ unread: 0, mentions: 2 });
    });

    it("shows the module total, mentions kept separate (NT-2 / AC-12)", () => {
        const totals = new Map<string, UnreadSummary>([["channels", { unread: 5, mentions: 2 }]]);

        render(
            <WorkspaceNavigation
                activeModuleId="channels"
                onSelectModule={() => undefined}
                modules={[{ id: "channels", label: "Kanallar", icon: "channel", category: "universal" }]}
                unreadByModule={totals}
            />,
        );

        expect(screen.getByLabelText(CONVERSATION_COPY.unreadLabel(5))).toBeTruthy();
        expect(screen.getByLabelText(CONVERSATION_COPY.mentionLabel(2))).toBeTruthy();
    });

    it("carries the total up every organisational level above the user's position", () => {
        OrganisationService.reset();
        const tree = OrganisationService.getInstance().getVisibleTree("tergov_workspace");

        render(
            <GovernmentNavigation
                tree={tree}
                state="ready"
                activeNodeId="tergov_workspace"
                onSelectNode={() => undefined}
                unread={{ unread: 4, mentions: 0 }}
                unreadNodeId="tergov_workspace"
            />,
        );

        // The position and every ancestor rendered above it: what is waiting at
        // a level is what is waiting anywhere beneath it.
        const badges = screen.getAllByLabelText(CONVERSATION_COPY.unreadLabel(4));
        expect(badges.length).toBeGreaterThan(1);
    });
});

describe("NT-5 / FR-52 — the level of one conversation", () => {
    it("distinguishes all, mentions only, and none from the platform's own rules", () => {
        const { notifications } = useServices([
            { id: "!a:gov", name: "All" },
            { id: "!m:gov", name: "Mentions", level: "mentions" },
            { id: "!n:gov", name: "None", level: "none" },
        ]);

        expect(notifications.getLevel("!a:gov")).toBe("all");
        expect(notifications.getLevel("!m:gov")).toBe("mentions");
        expect(notifications.getLevel("!n:gov")).toBe("none");
    });

    it("states the level in the conversation list in words, not colour alone (A11Y-5)", () => {
        render(
            <ConversationList
                conversations={[conv({ id: "!m:gov", name: "Kanal", notificationLevel: "mentions" })]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        expect(screen.getByLabelText(NOTIFICATION_LEVEL_LABEL.mentions)).toBeTruthy();
    });
});

describe("NT-3 / NT-4 — the notification centre feed", () => {
    const messages = [
        { id: "$read", sender: "@a:gov", senderName: "Aziz", body: "O'qilgan", ts: 1 },
        { id: "$new", sender: "@a:gov", senderName: "Aziz", body: "Yangi xabar", ts: 2 },
    ];

    it("reports only what sits past the reader's own read position", () => {
        // The stand-in reports the first message as read up to.
        const { notifications } = useServices([{ id: "!g:gov", name: "Tergov", messages }]);

        const feed = notifications.getFeed();
        expect(feed.map((entry) => entry.id)).toEqual(["$new"]);
        expect(feed[0].conversationName).toBe("Tergov");
    });

    it("never reports the same message twice, however it arrived (EDGE-5 / AC-33)", () => {
        const { notifications } = useServices([{ id: "!g:gov", name: "Tergov", messages }]);

        const ids = notifications.getFeed().map((entry) => entry.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("reports a mention as a mention, not as ordinary activity (NT-2)", () => {
        const { notifications } = useServices([
            {
                id: "!g:gov",
                name: "Tergov",
                messages: [
                    messages[0],
                    {
                        id: "$mention",
                        sender: "@a:gov",
                        senderName: "Aziz",
                        body: "@me:gov.uz javob bering",
                        ts: 3,
                        mentions: ["@me:gov.uz"],
                    },
                ],
            },
        ]);

        expect(notifications.getFeed()[0].kind).toBe("mention");
    });

    it("reports nothing from a silenced conversation (NT-5)", () => {
        const { notifications } = useServices([
            { id: "!g:gov", name: "Tergov", level: "none", messages },
        ]);

        expect(notifications.getFeed()).toEqual([]);
    });

    it("reports an urgent official message through the silence (NT-9 / FR-53)", () => {
        const { notifications } = useServices([
            {
                id: "!c:gov",
                name: "E'lonlar",
                alias: "#elonlar:gov",
                level: "none",
                messages: [
                    messages[0],
                    {
                        id: "$urgent",
                        sender: "@b:gov",
                        senderName: "Dilshod",
                        body: "Shoshilinch topshiriq",
                        ts: 4,
                        urgent: true,
                    },
                ],
            },
        ]);

        const feed = notifications.getFeed();
        expect(feed.map((entry) => entry.id)).toEqual(["$urgent"]);
        expect(feed[0].isUrgent).toBe(true);
    });

    it("marks an entry read as a read position, so every tab agrees (NT-4 / NT-8)", async () => {
        const { notifications } = useServices([{ id: "!g:gov", name: "Tergov", messages }]);
        const receipts = (notifications as unknown as { receiptService: { markRead: unknown } })
            .receiptService;
        const markRead = vi.fn().mockResolvedValue(undefined);
        receipts.markRead = markRead;

        await notifications.markAllRead();

        expect(markRead).toHaveBeenCalledWith("!g:gov", "$new");
    });
});

describe("NT-9 / FR-53 — an urgent message in the conversation list", () => {
    it("elevates the conversation and says why in words (A11Y-5)", () => {
        render(
            <ConversationList
                conversations={[conv({ id: "!c:gov", name: "E'lonlar", hasUrgent: true })]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        expect(screen.getByText(NOTIFICATION_COPY.urgentLabel)).toBeTruthy();
    });

    it("is read from the room's own unread messages", () => {
        const { rooms } = useServices([
            {
                id: "!c:gov",
                name: "E'lonlar",
                messages: [
                    { id: "$read", sender: "@a:gov", senderName: "Aziz", body: "Eski", ts: 1 },
                    {
                        id: "$urgent",
                        sender: "@b:gov",
                        senderName: "Dilshod",
                        body: "Shoshilinch",
                        ts: 2,
                        urgent: true,
                    },
                ],
            },
        ]);

        expect(rooms.getAllRooms()[0].hasUrgent).toBe(true);
    });
});

describe("FR-52 — setting the level from the conversation", () => {
    it("offers the three levels and writes the choice to the platform", async () => {
        const { notifications } = useServices([{ id: "!g:gov", name: "Tergov" }]);
        const set = vi.fn().mockResolvedValue(undefined);
        (notifications as unknown as { setLevel: unknown }).setLevel = set;

        const { NotificationLevelControl } = await import(
            "../components/chat/NotificationLevelControl"
        );

        render(<NotificationLevelControl conversationId="!g:gov" conversationName="Tergov" />);

        const select = screen.getByLabelText(NOTIFICATION_COPY.levelFor("Tergov")) as HTMLSelectElement;
        expect([...select.options].map((option) => option.value)).toEqual(["all", "mentions", "none"]);

        // The write settles before the assertion: the control reports its own
        // pending and failed states, so both are state updates of its own.
        await act(async () => {
            fireEvent.change(select, { target: { value: "mentions" } });
        });

        expect(set).toHaveBeenCalledWith("!g:gov", "mentions");
    });
});
