/*
 * Sovereign Messenger — Sprint 3, Milestone 3
 * regression.test.tsx — Readiness Review §14 regression checklist,
 * plus AC-17 (breakpoints) and AC-29 (permission change without reload).
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

import { MatrixRoomService } from "../services/MatrixRoomService";
import { MatrixMessageService } from "../services/MatrixMessageService";
import { MatrixTimelineService } from "../services/MatrixTimelineService";
import { FramePreferenceService } from "../services/FramePreferenceService";
import { DraftService } from "../services/DraftService";
import { usePostingPermission } from "../hooks/usePostingPermission";
import { useBreakpoint, BREAKPOINT_STANDARD_MIN, BREAKPOINT_WIDE_MIN } from "../hooks/useBreakpoint";
import { ChatArea } from "../components/layout/ChatArea";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";
import { CHAT_COPY } from "../config/chatCopy";

function bindServices(specs: FakeRoomSpec[]) {
    const client = createFakeClient(specs);
    const stub = { getClient: () => client };

    const room = MatrixRoomService.getInstance();
    (room as unknown as { clientService: unknown }).clientService = stub;
    (room as unknown as { snapshot: unknown }).snapshot = null;

    const timeline = MatrixTimelineService.getInstance();
    (timeline as unknown as { clientService: unknown }).clientService = stub;

    return { client, room, timeline };
}

beforeEach(() => {
    FramePreferenceService.getInstance().set({
        sidebarCollapsed: false,
        panelOpen: true,
        workspaceOpen: false,
        density: "comfortable",
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * §14.3 / §14.4 — message send and receive still work
 * ───────────────────────────────────────────────────────────────────────── */

describe("§14.3 / §14.4 — messaging still works", () => {
    it("delivers the room's messages to a timeline subscriber", () => {
        const client = createFakeClient([
            {
                id: "!g:gov",
                name: "G",
                messages: [{ id: "$1", sender: "@a:gov", senderName: "Aziz", body: "Salom", ts: 1000 }],
            },
        ]);
        const timeline = MatrixTimelineService.getInstance();
        const messages = new MatrixMessageService();
        (timeline as unknown as { clientService: unknown }).clientService = { getClient: () => client };
        (messages as unknown as { clientService: unknown }).clientService = { getClient: () => client };
        (messages as unknown as { timelineService: unknown }).timelineService = timeline;

        const received: string[] = [];
        const stop = messages.subscribeToTimeline("!g:gov", (list) =>
            list.forEach((m) => received.push(m.content)),
        );

        expect(received).toContain("Salom");
        stop();
    });

    it("routes a send to the conversation it was written in, not the open one", async () => {
        const client = createFakeClient([
            { id: "!a:gov", name: "A" },
            { id: "!b:gov", name: "B" },
        ]);
        const sent: string[] = [];
        (client as unknown as { sendTextMessage: unknown }).sendTextMessage = async (roomId: string) => {
            sent.push(roomId);
            return { event_id: "$new" };
        };

        const messages = new MatrixMessageService();
        (messages as unknown as { clientService: unknown }).clientService = { getClient: () => client };
        (messages as unknown as { timelineService: unknown }).timelineService =
            MatrixTimelineService.getInstance();

        await messages.sendMessage("!b:gov", "matn", "@me:gov.uz", "Me", "Xodim");
        expect(sent).toEqual(["!b:gov"]);
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * §14.6 — conversation switching preserves state (NAV-10)
 * ───────────────────────────────────────────────────────────────────────── */

describe("§14.6 / NAV-10 / FR-40 — switching conversations preserves drafts", () => {
    it("holds a draft per conversation and restores it on return", () => {
        const drafts = DraftService.getInstance();
        drafts.clearAll();

        drafts.set("!a:gov", "A uchun qoralama");
        drafts.set("!b:gov", "B uchun qoralama");

        expect(drafts.get("!a:gov")).toBe("A uchun qoralama");
        expect(drafts.get("!b:gov")).toBe("B uchun qoralama");
        expect(drafts.getConversationIdsWithDrafts().sort()).toEqual(["!a:gov", "!b:gov"]);
    });

    it("clears every draft on sign-out, for a shared workstation", () => {
        const drafts = DraftService.getInstance();
        drafts.set("!a:gov", "maxfiy");
        drafts.clearAll();
        expect(drafts.getConversationIdsWithDrafts()).toEqual([]);
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * §14.8 — one client, one sync loop (Blueprint §5)
 * ───────────────────────────────────────────────────────────────────────── */

describe("§14.8 / AC-25 — the single client principle", () => {
    it("keeps every service on one shared client instance", async () => {
        const { MatrixClientService } = await import("../services/MatrixClientService");
        expect(MatrixClientService.getInstance()).toBe(MatrixClientService.getInstance());
        expect(MatrixRoomService.getInstance()).toBe(MatrixRoomService.getInstance());
        expect(MatrixTimelineService.getInstance()).toBe(MatrixTimelineService.getInstance());
    });

    it("creates no client of its own and starts no sync", async () => {
        // The room and timeline services read an existing client; neither
        // constructs one nor drives synchronisation (PRD §6.1).
        const room = MatrixRoomService.getInstance() as unknown as Record<string, unknown>;
        const timeline = MatrixTimelineService.getInstance() as unknown as Record<string, unknown>;

        for (const service of [room, timeline]) {
            const names = Object.getOwnPropertyNames(Object.getPrototypeOf(service));
            expect(names).not.toContain("createClient");
            expect(names).not.toContain("startClient");
        }
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * AC-17 — three breakpoints
 * ───────────────────────────────────────────────────────────────────────── */

describe("AC-17 / UI-13 — three breakpoints", () => {
    function atWidth(width: number) {
        Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
        window.matchMedia = ((query: string) => {
            const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0);
            return {
                matches: width >= min,
                addEventListener: () => undefined,
                removeEventListener: () => undefined,
            };
        }) as unknown as typeof window.matchMedia;
    }

    it("resolves compact below 768px", () => {
        atWidth(BREAKPOINT_STANDARD_MIN - 1);
        expect(renderHook(() => useBreakpoint()).result.current).toBe("compact");
    });

    it("resolves standard from 768px", () => {
        atWidth(BREAKPOINT_STANDARD_MIN);
        expect(renderHook(() => useBreakpoint()).result.current).toBe("standard");
    });

    it("resolves wide from 1280px", () => {
        atWidth(BREAKPOINT_WIDE_MIN);
        expect(renderHook(() => useBreakpoint()).result.current).toBe("wide");
    });

    it("treats the minimum government workstation as wide (NFR-2)", () => {
        atWidth(1366);
        expect(renderHook(() => useBreakpoint()).result.current).toBe("wide");
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * UI-18 / UI-19 — preferences persist and survive a corrupt store
 * ───────────────────────────────────────────────────────────────────────── */

describe("UI-18 / UI-19 — frame preferences", () => {
    it("persists a change across a fresh read", () => {
        const service = FramePreferenceService.getInstance();
        service.set({ density: "compact", sidebarCollapsed: true });

        expect(JSON.parse(localStorage.getItem("sovereign_frame_preferences")!)).toMatchObject({
            density: "compact",
            sidebarCollapsed: true,
        });
    });

    it("recovers a usable layout from a corrupt store", () => {
        localStorage.setItem("sovereign_frame_preferences", "{ not json");
        const service = FramePreferenceService.getInstance();
        (service as unknown as { loaded: boolean }).loaded = false;

        const prefs = service.get();
        expect(prefs.density).toBe("comfortable");
        expect(typeof prefs.panelOpen).toBe("boolean");
    });

    it("keeps the conversation dominant by default (UX-2)", () => {
        localStorage.removeItem("sovereign_frame_preferences");
        const service = FramePreferenceService.getInstance();
        (service as unknown as { loaded: boolean }).loaded = false;

        // Both supporting surfaces open at once leaves the conversation the
        // narrowest column on a 1366px workstation.
        const prefs = service.get();
        expect(prefs.panelOpen && prefs.workspaceOpen).toBe(false);
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * AC-29 / SUX-9 — a permission change without a reload
 * ───────────────────────────────────────────────────────────────────────── */

describe("AC-29 / SUX-9 — posting rights change during a session", () => {
    it("withdraws the composer and explains it, without a reload", async () => {
        const { room } = bindServices([{ id: "!c:gov", name: "Kanal", canPost: true }]);
        let allowed = true;
        vi.spyOn(room, "canSendMessage").mockImplementation(() => allowed);

        const { result, rerender } = renderHook(() =>
            usePostingPermission("!c:gov", { fallbackCanPost: true, readOnlyForEmployees: true }),
        );

        expect(result.current.canPost).toBe(true);
        expect(result.current.change).toBeNull();

        // Leadership withdraws posting rights mid-session.
        allowed = false;
        await act(async () => {
            (room as unknown as { listeners: Set<() => void> }).listeners.forEach((cb) => cb());
        });
        rerender();

        expect(result.current.canPost).toBe(false);
        expect(result.current.change).toBe(CHAT_COPY.postingRevoked);
        expect(result.current.reason).toBe(CHAT_COPY.readOnlyChannel);
        vi.restoreAllMocks();
    });

    it("says nothing when the room's answer merely arrives", async () => {
        const { room } = bindServices([{ id: "!c:gov", name: "Kanal" }]);
        let answer: boolean | null = null;
        vi.spyOn(room, "canSendMessage").mockImplementation(() => answer);

        const { result, rerender } = renderHook(() =>
            usePostingPermission("!c:gov", { fallbackCanPost: false, readOnlyForEmployees: true }),
        );

        // The room loads and reports rights the role fallback did not have.
        answer = true;
        await act(async () => {
            (room as unknown as { listeners: Set<() => void> }).listeners.forEach((cb) => cb());
        });
        rerender();

        expect(result.current.canPost).toBe(true);
        // Nothing changed but data arriving; announcing a change would be a
        // misstatement about the user's authority.
        expect(result.current.change).toBeNull();
        vi.restoreAllMocks();
    });
});

/* ─────────────────────────────────────────────────────────────────────────
 * ST-23 — the conversation surface with nothing selected
 * ───────────────────────────────────────────────────────────────────────── */

describe("ST-23 — no conversation selected", () => {
    it("says so and points at the next action", async () => {
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

        bindServices([]);

        render(
            <PermissionProvider currentUser={user}>
                <ChatProvider defaultChannelId="">
                    <ChatArea />
                </ChatProvider>
            </PermissionProvider>,
        );

        expect(screen.getByText(CHAT_COPY.noConversation)).toBeTruthy();
    });
});
