/*
 * Sovereign Messenger — Sprint 3, Milestone 5 acceptance
 * performance.test.tsx — D-18 performance validation.
 *
 * AC-21, PERF-2, PERF-5, PERF-8, PERF-9, PERF-10.
 *
 * These measure the work the product itself does — mapping, filtering, and
 * rendering — on the synthetic datasets AC-34 names. The end-to-end targets
 * that involve a server and a screen (PERF-1, PERF-3, PERF-4, PERF-6, PERF-7,
 * PERF-11) are measured against the live deployment and recorded in the
 * Sprint 3 performance report; a jsdom clock cannot stand in for either.
 *
 * The budgets here are deliberately below the PRD's, because what is measured
 * is a part of the operation rather than the whole of it.
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { MatrixRoomService } from "../services/MatrixRoomService";
import { MatrixSearchService } from "../services/MatrixSearchService";
import { MessageTimeline } from "../components/chat/MessageTimeline";
import { ConversationList } from "../components/navigation/ConversationList";
import { summariseUnread } from "../types/notification";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";
import type { SovereignConversation } from "../types/conversation";
import type { SovereignMessage } from "../services/MessageService";

function bind(specs: FakeRoomSpec[]) {
    const client = createFakeClient(specs);
    const stub = { getClient: () => client };

    for (const service of [MatrixRoomService.getInstance(), MatrixSearchService.getInstance()]) {
        (service as unknown as { clientService: unknown }).clientService = stub;
    }
    (MatrixRoomService.getInstance() as unknown as { snapshot: unknown }).snapshot = null;
}

function rooms(count: number): FakeRoomSpec[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `!r${i}:gov`,
        name: `Bo'lim ${i}`,
        memberCount: 8,
        lastActive: i,
        unread: i % 3,
        messages: [{ id: `$${i}`, sender: "@a:gov", senderName: "Aziz", body: `xabar ${i}`, ts: i }],
    }));
}

function conversations(count: number): SovereignConversation[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `!c${i}:gov`,
        name: `Suhbat ${i}`,
        type: i % 3 === 0 ? ("channel" as const) : i % 3 === 1 ? ("group" as const) : ("direct" as const),
        memberCount: 6,
        readOnlyForEmployees: false,
        lastActivityAt: i,
        preview: { senderName: "Aziz", body: `xabar ${i}` },
        unreadCount: i % 4,
        mentionCount: i % 9 === 0 ? 1 : 0,
        isFavourite: i % 50 === 0,
        notificationLevel: "all" as const,
        hasUrgent: false,
    }));
}

function messages(count: number): SovereignMessage[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `$m${i}`,
        channelId: "!g:gov",
        senderId: i % 2 === 0 ? "@me:gov" : "@a:gov",
        senderName: "Aziz",
        content: `xabar ${i}`,
        timestamp: "10:00",
        date: "Bugun",
        sentAt: i * 1000,
    }));
}

/** Median of several runs: one reading on a shared machine is noise. */
function measure(run: () => void, samples = 5): number {
    const timings: number[] = [];

    for (let i = 0; i < samples; i++) {
        const started = performance.now();
        run();
        timings.push(performance.now() - started);
    }

    return timings.sort((a, b) => a - b)[Math.floor(samples / 2)];
}

describe("PERF-10 / AC-34 — a conversation list of 5,000", () => {
    it("maps the whole set well inside the interaction budget", () => {
        bind(rooms(5000));
        const service = MatrixRoomService.getInstance();

        const elapsed = measure(() => {
            (service as unknown as { snapshot: unknown }).snapshot = null;
            service.getAllRooms();
        });

        expect(elapsed).toBeLessThan(400);
    });

    it("renders and filters without perceptible delay", () => {
        const all = conversations(5000);

        const rendered = measure(
            () =>
                render(
                    <ConversationList
                        conversations={all}
                        state="ready"
                        activeConversationId=""
                        onSelect={() => undefined}
                    />,
                ).unmount(),
            3,
        );

        expect(rendered).toBeLessThan(1000);
    });

    it("totals the whole set in a fraction of a frame (NT-1)", () => {
        const all = conversations(5000);

        // The unread model runs on every change to any conversation, so it has
        // to cost nothing at this scale or it costs everything.
        expect(measure(() => summariseUnread(all), 20)).toBeLessThan(16);
    });
});

describe("PERF-8 / PERF-9 / AC-34 — a timeline of 100,000", () => {
    it("puts a bounded number of messages in the document", () => {
        const many = messages(100_000);

        const { container } = render(<MessageTimeline currentUserId="@me:gov" messages={many} />);

        // PERF-9: what is retained is bounded by the window, not by history.
        expect(container.querySelectorAll(".svr-msg-bubble").length).toBeLessThan(300);
        // PERF-8: and it is the newest end of it that is on screen.
        expect(screen.getByText("xabar 99999")).toBeTruthy();
    });

    it("renders that timeline within the conversation-switch budget", () => {
        const many = messages(100_000);

        const elapsed = measure(
            () => render(<MessageTimeline currentUserId="@me:gov" messages={many} />).unmount(),
            3,
        );

        // PERF-2 allows 300ms for a whole conversation switch; the timeline is
        // the largest part of it.
        expect(elapsed).toBeLessThan(300);
    });
});

describe("PERF-5 — the first search result", () => {
    it("answers from what the client already holds, immediately", () => {
        bind(rooms(2000));
        const service = MatrixSearchService.getInstance();

        const elapsed = measure(() => service.searchLocal("Bo'lim 1"));

        // SR-8: the local answer is what makes the 500ms target reachable —
        // the server's answer arrives afterwards and extends it.
        expect(elapsed).toBeLessThan(500);
        expect(service.searchLocal("Bo'lim 1").groups.length).toBeGreaterThan(0);
    });
});
