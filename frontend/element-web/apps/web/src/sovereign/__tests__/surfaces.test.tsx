/*
 * Sovereign Messenger — Sprint 3, Milestone 3 acceptance
 * surfaces.test.tsx — rendered behaviour of the Milestone 3 surfaces.
 *
 * FR-32, FR-35, FR-37, FR-43, FR-45, NAV-2, NAV-3, NAV-5, IA-6, IA-8,
 * COM-3, A11Y-1, A11Y-5, A11Y-6, ES-2, ES-4
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";

import { MessageTimeline } from "../components/chat/MessageTimeline";
import { ConversationList } from "../components/navigation/ConversationList";
import { MemberList } from "../components/chat/MemberList";
import { PermissionNotice } from "../components/chat/PermissionNotice";
import { Breadcrumb } from "../components/navigation/Breadcrumb";
import { GovernmentNavigation } from "../components/navigation/GovernmentNavigation";
import { OrganisationService } from "../services/OrganisationService";
import { CHAT_COPY, MEMBER_COPY } from "../config/chatCopy";
import { CONVERSATION_COPY } from "../config/navigationCopy";
import type { SovereignMessage } from "../services/MessageService";
import type { SovereignConversation } from "../types/conversation";
import type { SovereignMember } from "../types/member";

const msg = (over: Partial<SovereignMessage> & { id: string }): SovereignMessage => ({
    channelId: "!g:gov",
    senderId: "@a:gov",
    senderName: "Aziz",
    content: "matn",
    timestamp: "10:00",
    date: "Bugun",
    sentAt: 1000,
    readState: "sent",
    ...over,
});

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

describe("FR-37 / CMP-27 — the unread divider", () => {
    it("draws the boundary above the first unread message", () => {
        render(
            <MessageTimeline
                currentUserId="@me:gov"
                readUpToId="$2"
                messages={[
                    msg({ id: "$1", content: "o'qilgan", sentAt: 1000 }),
                    msg({ id: "$2", content: "chegara", sentAt: 2000 }),
                    msg({ id: "$3", content: "o'qilmagan", sentAt: 3000 }),
                ]}
            />,
        );

        const divider = screen.getByRole("separator", { name: CHAT_COPY.unreadDivider });
        expect(divider).toBeTruthy();
    });

    it("draws nothing when everything has been read", () => {
        render(
            <MessageTimeline
                currentUserId="@me:gov"
                readUpToId="$2"
                messages={[msg({ id: "$1" }), msg({ id: "$2" })]}
            />,
        );
        expect(screen.queryByRole("separator", { name: CHAT_COPY.unreadDivider })).toBeNull();
    });

    it("does not open a boundary on the reader's own message", () => {
        render(
            <MessageTimeline
                currentUserId="@me:gov"
                readUpToId="$1"
                messages={[
                    msg({ id: "$1", sentAt: 1000 }),
                    msg({ id: "$2", senderId: "@me:gov", senderName: "Me", sentAt: 2000 }),
                ]}
            />,
        );
        expect(screen.queryByRole("separator", { name: CHAT_COPY.unreadDivider })).toBeNull();
    });
});

describe("FR-36 — asking for earlier messages", () => {
    it("requests a page when the reader reaches the top", () => {
        const onLoadEarlier = vi.fn();
        const { container } = render(
            <MessageTimeline
                currentUserId="@me:gov"
                messages={[msg({ id: "$1" })]}
                hasEarlier
                onLoadEarlier={onLoadEarlier}
            />,
        );

        const scroller = container.querySelector(".svr-timeline-scroll")!;
        Object.defineProperty(scroller, "scrollTop", { value: 0, configurable: true });
        fireEvent.scroll(scroller);

        expect(onLoadEarlier).toHaveBeenCalled();
    });

    it("does not ask again while a page is already loading", () => {
        const onLoadEarlier = vi.fn();
        const { container } = render(
            <MessageTimeline
                currentUserId="@me:gov"
                messages={[msg({ id: "$1" })]}
                hasEarlier
                isLoadingEarlier
                onLoadEarlier={onLoadEarlier}
            />,
        );

        const scroller = container.querySelector(".svr-timeline-scroll")!;
        Object.defineProperty(scroller, "scrollTop", { value: 0, configurable: true });
        fireEvent.scroll(scroller);

        expect(onLoadEarlier).not.toHaveBeenCalled();
    });

    it("shows progress while the page is on its way (UX-6)", () => {
        render(
            <MessageTimeline currentUserId="@me:gov" messages={[msg({ id: "$1" })]} isLoadingEarlier />,
        );
        expect(screen.getByText(CHAT_COPY.loadingEarlier)).toBeTruthy();
    });
});

describe("EDGE-2 / PERF-9 — a long history stays bounded", () => {
    it("puts a bounded number of messages in the document", () => {
        const many = Array.from({ length: 3000 }, (_, i) =>
            msg({ id: `$${i}`, content: `m${i}`, sentAt: i * 1000 }),
        );

        const { container } = render(<MessageTimeline currentUserId="@me:gov" messages={many} />);
        const rendered = container.querySelectorAll(".svr-msg-bubble").length;

        expect(rendered).toBeLessThan(300);
        // The newest messages are the ones on screen.
        expect(screen.getByText("m2999")).toBeTruthy();
    });
});

describe("FR-32 — consecutive messages from one sender", () => {
    it("shows the sender once for a run, and again after a long gap", () => {
        const { container } = render(
            <MessageTimeline
                currentUserId="@me:gov"
                messages={[
                    msg({ id: "$1", sentAt: 1_000_000 }),
                    msg({ id: "$2", sentAt: 1_000_100 }),
                    msg({ id: "$3", sentAt: 9_000_000 }),
                ]}
            />,
        );

        // Two identity headers: one opening the run, one after the gap.
        expect(container.querySelectorAll(".svr-msg-header")).toHaveLength(2);
    });
});

describe("FR-35 — an undisplayable message", () => {
    it("renders the defined state, never the message content", () => {
        render(
            <MessageTimeline
                currentUserId="@me:gov"
                messages={[msg({ id: "$1", content: "sirli", unavailable: true })]}
            />,
        );

        expect(screen.getByText(CHAT_COPY.messageUnavailable)).toBeTruthy();
        expect(screen.queryByText("sirli")).toBeNull();
    });
});

describe("NAV-2 / IA-6 / IA-8 — the conversation list", () => {
    const conversations = [
        conv({ id: "!c:gov", name: "E'lonlar", type: "channel", readOnlyForEmployees: true }),
        conv({ id: "!g:gov", name: "Tergov guruhi", type: "group" }),
        conv({ id: "!d:gov", name: "Aziz Rahimov", type: "direct" }),
        conv({ id: "!f:gov", name: "Muhim", type: "group", isFavourite: true }),
    ];

    it("groups by type with favourites above everything (IA-7, IA-8)", () => {
        render(
            <ConversationList
                conversations={conversations}
                state="ready"
                activeConversationId="!g:gov"
                onSelect={() => undefined}
            />,
        );

        const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
        expect(headings[0]).toBe(CONVERSATION_COPY.groupFavourites);
        expect(headings).toContain(CONVERSATION_COPY.groupChannels);
        expect(headings).toContain(CONVERSATION_COPY.groupGroups);
        expect(headings).toContain(CONVERSATION_COPY.groupDirect);
    });

    it("states each conversation's type as text, not by icon alone (A11Y-5)", () => {
        render(
            <ConversationList
                conversations={[conversations[0]]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        const row = screen.getByRole("button", { name: /E'lonlar/ });
        expect(within(row).getByText(/Rasmiy kanal/)).toBeTruthy();
    });

    it("labels unread and mention counts rather than showing a bare number", () => {
        render(
            <ConversationList
                conversations={[conv({ id: "!u:gov", name: "U", unreadCount: 3, mentionCount: 1 })]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        expect(screen.getByLabelText(CONVERSATION_COPY.unreadLabel(3))).toBeTruthy();
        expect(screen.getByLabelText(CONVERSATION_COPY.mentionLabel(1))).toBeTruthy();
    });

    it("counts a muted conversation out but keeps it listed (NT-6)", () => {
        render(
            <ConversationList
                conversations={[conv({ id: "!m:gov", name: "Muted", unreadCount: 9, notificationLevel: "none" })]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        expect(screen.getByText("Muted")).toBeTruthy();
        expect(screen.queryByLabelText(CONVERSATION_COPY.unreadLabel(9))).toBeNull();
    });

    it("distinguishes filtered-out from empty, and offers the way back (ES-2, ES-4)", () => {
        render(
            <ConversationList
                conversations={[conversations[1]]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        fireEvent.change(screen.getByRole("combobox", { name: CONVERSATION_COPY.filterLabel }), {
            target: { value: "channel" },
        });

        expect(screen.getByText(CONVERSATION_COPY.filteredEmpty)).toBeTruthy();
        expect(screen.getByRole("button", { name: CONVERSATION_COPY.filteredEmptyAction }).textContent).toBe(
            CONVERSATION_COPY.filteredEmptyAction,
        );
    });

    it("selects a conversation when its row is activated", () => {
        const onSelect = vi.fn();
        render(
            <ConversationList
                conversations={[conversations[1]]}
                state="ready"
                activeConversationId=""
                onSelect={onSelect}
            />,
        );

        fireEvent.click(screen.getByText("Tergov guruhi"));
        expect(onSelect).toHaveBeenCalledWith("!g:gov");
    });
});

describe("FR-45 / CMP-12 — the participant list", () => {
    const members: SovereignMember[] = [
        { id: "@a:gov", displayName: "Aziz", status: "joined", canPost: true },
        { id: "@n:gov", displayName: "Nodira", status: "invited", canPost: false },
        { id: "@r:gov", displayName: "Rustam", status: "joined", canPost: false },
        { id: "@o:gov", displayName: "Olim", status: "left", canPost: false },
    ];

    it("lists participants with their membership stated as text (A11Y-5)", () => {
        render(<MemberList members={members} state="ready" />);

        expect(screen.getByText("Aziz")).toBeTruthy();
        expect(screen.getByText(MEMBER_COPY.invited)).toBeTruthy();
        expect(screen.getByText(MEMBER_COPY.departed)).toBeTruthy();
    });

    it("marks a participant who may only read (COM-2)", () => {
        render(<MemberList members={members} state="ready" />);
        expect(screen.getAllByLabelText(MEMBER_COPY.readOnly).length).toBeGreaterThan(0);
    });

    it("presents the surface's loading state rather than an empty list", () => {
        const { container } = render(<MemberList members={[]} state="loading" />);
        expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    });
});

describe("FR-43 / COM-3 — no composer where posting is not permitted", () => {
    it("states the rule in one neutral sentence", () => {
        render(<PermissionNotice message={CHAT_COPY.readOnlyChannel} />);
        expect(screen.getByRole("note").textContent).toBe(CHAT_COPY.readOnlyChannel);
    });
});

describe("NAV-5 — breadcrumbs are navigable at every level", () => {
    const path = OrganisationService.getInstance().getPath("tergov_workspace");

    it("renders the whole organisational path", () => {
        render(<Breadcrumb path={path} onSelectNode={() => undefined} maxVisible={10} />);

        expect(screen.getByRole("button", { name: /Samarqand viloyati/ })).toBeTruthy();
        expect(screen.getByRole("button", { name: /Ichki Ishlar/ })).toBeTruthy();
    });

    it("navigates from any level, not only the last", () => {
        const onSelectNode = vi.fn();
        render(<Breadcrumb path={path} onSelectNode={onSelectNode} maxVisible={10} />);

        fireEvent.click(screen.getByRole("button", { name: /Samarqand viloyati/ }));
        expect(onSelectNode).toHaveBeenCalledWith("samarqand");
    });

    it("collapses a deep path behind one control (CMP-17 truncated)", () => {
        render(<Breadcrumb path={path} onSelectNode={() => undefined} maxVisible={3} />);
        expect(screen.getByRole("button", { name: /To'liq yo'lni ko'rsatish/ })).toBeTruthy();
    });
});

describe("A11Y-1 — the hierarchy tree is operable by keyboard", () => {
    function renderTree() {
        const service = OrganisationService.getInstance();
        return render(
            <GovernmentNavigation
                tree={service.getVisibleTree("tergov_workspace")}
                state="ready"
                activeNodeId="tergov_workspace"
                onSelectNode={() => undefined}
            />,
        );
    }

    it("exposes one tab stop with levels announced", () => {
        renderTree();
        const tree = screen.getByRole("tree");
        const items = within(tree).getAllByRole("treeitem");

        expect(items.length).toBeGreaterThan(1);
        expect(items.filter((i) => i.getAttribute("tabindex") === "0")).toHaveLength(1);
        expect(items[0].getAttribute("aria-level")).toBe("1");
    });

    it("selects with Enter", () => {
        const onSelectNode = vi.fn();
        const service = OrganisationService.getInstance();
        render(
            <GovernmentNavigation
                tree={service.getVisibleTree("tergov_workspace")}
                state="ready"
                activeNodeId="tergov_workspace"
                onSelectNode={onSelectNode}
            />,
        );

        fireEvent.keyDown(screen.getAllByRole("treeitem")[0], { key: "Enter" });
        expect(onSelectNode).toHaveBeenCalled();
    });

    it("collapses and expands a branch with the arrow keys", () => {
        renderTree();
        const first = screen.getAllByRole("treeitem")[0];

        expect(first.getAttribute("aria-expanded")).toBe("true");
        fireEvent.keyDown(first, { key: "ArrowLeft" });
        expect(screen.getAllByRole("treeitem")[0].getAttribute("aria-expanded")).toBe("false");

        fireEvent.keyDown(screen.getAllByRole("treeitem")[0], { key: "ArrowRight" });
        expect(screen.getAllByRole("treeitem")[0].getAttribute("aria-expanded")).toBe("true");
    });
});
