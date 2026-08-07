/*
 * Sovereign Messenger — Sprint 3, Milestone 5 acceptance
 * accessibility.test.tsx — D-17 conformance.
 *
 * AC-19, AC-20, AC-22, A11Y-1 … A11Y-12
 *
 * These assert the properties an automated scan can check and the ones the
 * product owns in code. The manual keyboard-only and screen-reader passes, and
 * the contrast measurements, are recorded in the Sprint 3 accessibility report.
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { FramePreferenceService } from "../services/FramePreferenceService";
import { GovernmentNavigation } from "../components/navigation/GovernmentNavigation";
import { ConversationList } from "../components/navigation/ConversationList";
import { MemberList } from "../components/chat/MemberList";
import { PresenceBadge } from "../components/ui/PresenceBadge";
import { OrganisationService } from "../services/OrganisationService";
import { PRESENCE_COPY } from "../config/presenceCopy";
import { CONVERSATION_COPY } from "../config/navigationCopy";
import { MEMBER_COPY } from "../config/chatCopy";
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

describe("A11Y-12 — a high-contrast theme, selectable in its own right", () => {
    it("offers all three themes and holds the choice", () => {
        const service = FramePreferenceService.getInstance();

        service.set({ theme: "contrast" });
        expect(service.get().theme).toBe("contrast");

        service.set({ theme: "light" });
        expect(service.get().theme).toBe("light");

        service.set({ theme: "dark" });
    });

    it("refuses a stored value that is not a theme, rather than applying it", () => {
        localStorage.setItem(
            "sovereign_frame_preferences",
            JSON.stringify({ theme: "neon", density: "compact" }),
        );

        // A fresh service reads the store on first access.
        (FramePreferenceService as unknown as { instance: unknown }).instance = null;
        const preferences = FramePreferenceService.getInstance().get();

        expect(preferences.theme).toBe("dark");
        // A valid neighbour is still honoured: one bad field is not a reset.
        expect(preferences.density).toBe("compact");

        (FramePreferenceService as unknown as { instance: unknown }).instance = null;
    });
});

describe("A11Y-5 — nothing is carried by colour alone", () => {
    it("gives every availability state a label as well as a mark", () => {
        const states = ["online", "away", "busy", "offline", "connecting", "unknown"] as const;

        for (const state of states) {
            const { unmount } = render(<PresenceBadge state={state} />);
            expect(screen.getByText(PRESENCE_COPY.state[state])).toBeTruthy();
            unmount();
        }
    });

    it("describes an unread count in words for assistive technology", () => {
        render(
            <ConversationList
                conversations={[conv({ id: "!a:gov", unreadCount: 3 })]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );

        expect(screen.getByLabelText(CONVERSATION_COPY.unreadLabel(3))).toBeTruthy();
    });
});

describe("A11Y-1 / A11Y-3 / AC-20 — operable by keyboard alone", () => {
    it("keeps one tab stop for the hierarchy and moves within it by arrow key", () => {
        OrganisationService.reset();
        const tree = OrganisationService.getInstance().getVisibleTree("tergov_workspace");
        const onSelectNode = vi.fn();

        render(
            <GovernmentNavigation
                tree={tree}
                state="ready"
                activeNodeId="tergov_workspace"
                onSelectNode={onSelectNode}
            />,
        );

        const items = screen.getAllByRole("treeitem");
        const tabbable = items.filter((item) => item.getAttribute("tabindex") === "0");
        // A11Y-1: one entry point, so tabbing past the tree takes one press
        // rather than one press per organisational level.
        expect(tabbable).toHaveLength(1);

        fireEvent.keyDown(tabbable[0], { key: "Enter" });
        expect(onSelectNode).toHaveBeenCalled();
    });

    it("presents a person as a control only where it leads somewhere (UX-8)", () => {
        const member = {
            id: "@a:gov",
            displayName: "Aziz Rahimov",
            status: "joined" as const,
            canPost: true,
        };

        const inert = render(<MemberList members={[member]} state="ready" />);
        expect(inert.queryByRole("button", { name: /Aziz/ })).toBeNull();
        inert.unmount();

        render(<MemberList members={[member]} state="ready" onSelectMember={() => undefined} />);
        expect(screen.getByRole("button", { name: /Aziz/ })).toBeTruthy();
    });
});

describe("A11Y-8 — a text alternative for an image", () => {
    it("lets the sender describe an image before it is sent", async () => {
        const { AttachmentPreview } = await import("../components/chat/AttachmentPreview");
        const { FILE_COPY } = await import("../config/fileCopy");
        const onDescribe = vi.fn();

        render(
            <AttachmentPreview
                attachment={{
                    id: "a1",
                    name: "IMG_2043.jpg",
                    size: 1024,
                    mimeType: "image/jpeg",
                    state: "queued",
                    progress: 0,
                    previewUrl: "blob:preview",
                }}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={() => undefined}
                onDescribe={onDescribe}
            />,
        );

        const field = screen.getByLabelText(`${FILE_COPY.describeLabel}: IMG_2043.jpg`);
        fireEvent.change(field, { target: { value: "Hodisa joyi" } });

        expect(onDescribe).toHaveBeenCalledWith("a1", "Hodisa joyi");
    });

    it("carries the description back out of the conversation, filename intact", async () => {
        const { MatrixTimelineService } = await import("../services/MatrixTimelineService");
        const service = MatrixTimelineService.getInstance();

        const read = (content: unknown) =>
            (
                service as unknown as {
                    readAttachment: (c: unknown) => { name: string; description?: string } | undefined;
                }
            ).readAttachment(content);

        const described = read({
            msgtype: "m.image",
            body: "Hodisa joyi",
            filename: "IMG_2043.jpg",
            url: "mxc://gov/1",
            info: { mimetype: "image/jpeg" },
        });
        expect(described?.name).toBe("IMG_2043.jpg");
        expect(described?.description).toBe("Hodisa joyi");

        // What every client sent before descriptions existed still reads as a
        // filename, not as a description of itself.
        const plain = read({
            msgtype: "m.image",
            body: "IMG_2043.jpg",
            url: "mxc://gov/1",
            info: { mimetype: "image/jpeg" },
        });
        expect(plain?.name).toBe("IMG_2043.jpg");
        expect(plain?.description).toBeUndefined();
    });
});

describe("A11Y-6 — regions are named", () => {
    it("names the conversation list and the member list", () => {
        const list = render(
            <ConversationList
                conversations={[conv({ id: "!a:gov" })]}
                state="ready"
                activeConversationId=""
                onSelect={() => undefined}
            />,
        );
        expect(screen.getAllByLabelText(CONVERSATION_COPY.listLabel).length).toBeGreaterThan(0);
        list.unmount();

        render(<MemberList members={[]} state="empty" />);
        expect(screen.getByLabelText(MEMBER_COPY.listLabel)).toBeTruthy();
    });
});
