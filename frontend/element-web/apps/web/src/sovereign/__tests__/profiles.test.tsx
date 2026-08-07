/*
 * Sovereign Messenger — Sprint 3, Milestone 5 acceptance
 * profiles.test.tsx — D-12 user profiles.
 *
 * AC-15, PR-1 … PR-9, FR-13, FR-14, AS-1, ES-1
 */

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { MatrixProfileService } from "../services/MatrixProfileService";
import { MatrixPresenceService } from "../services/MatrixPresenceService";
import { MatrixRoomService } from "../services/MatrixRoomService";
import { MatrixNotificationService } from "../services/MatrixNotificationService";
import { ProfilePanel } from "../components/profile/ProfilePanel";
import { PROFILE_COPY } from "../config/profileCopy";
import { createFakeClient, type FakeRoomSpec } from "./support/fakeClient";

const ME = "@me:gov.uz";
const AZIZ = "@aziz:gov.uz";

/** Every service reads the platform through the same stand-in client. */
function useServices(specs: FakeRoomSpec[], overrides: Record<string, unknown> = {}) {
    const client = Object.assign(createFakeClient(specs, ME), overrides);
    const stub = { getClient: () => client };

    for (const service of [
        MatrixProfileService.getInstance(),
        MatrixPresenceService.getInstance(),
        MatrixRoomService.getInstance(),
        MatrixNotificationService.getInstance(),
    ]) {
        (service as unknown as { clientService: unknown }).clientService = stub;
    }
    (MatrixRoomService.getInstance() as unknown as { snapshot: unknown }).snapshot = null;

    return { client };
}

const SHARED: FakeRoomSpec[] = [
    {
        id: "!g:gov",
        name: "Tergov guruhi",
        memberCount: 3,
        members: [
            { id: ME, name: "Men", membership: "join" },
            { id: AZIZ, name: "Aziz Rahimov", membership: "join" },
        ],
        messages: [
            { id: "$1", sender: AZIZ, senderName: "Aziz Rahimov", body: "Salom", ts: 1 },
        ],
    },
];

describe("PR-1 / AS-1 — what a profile states and what it does not", () => {
    it("reads the person's name and availability from the platform", () => {
        useServices(SHARED, {
            getUser: (id: string) =>
                id === AZIZ
                    ? { displayName: "Aziz Rahimov", presence: "online", currentlyActive: true }
                    : null,
        });

        const profile = MatrixProfileService.getInstance().getProfile(AZIZ);

        expect(profile?.displayName).toBe("Aziz Rahimov");
        expect(profile?.presence.state).toBe("online");
        expect(profile?.isSelf).toBe(false);
    });

    it("asserts no role, department, or position for another person (AS-1 / FR-1)", () => {
        useServices(SHARED, { getUser: () => ({ displayName: "Aziz Rahimov" }) });

        const profile = MatrixProfileService.getInstance().getProfile(AZIZ);

        expect(profile?.role).toBeNull();
        expect(profile?.department).toBeNull();
        expect(profile?.position).toBeNull();
    });

    it("falls back to the name the conversation records when no profile is held", () => {
        useServices(SHARED, { getUser: () => null });

        expect(MatrixProfileService.getInstance().getProfile(AZIZ)?.displayName).toBe(
            "Aziz Rahimov",
        );
    });
});

describe("PR-3 — what a profile lets the reader do", () => {
    it("lists the conversations both people belong to", () => {
        useServices(SHARED, { getUser: () => ({ displayName: "Aziz Rahimov" }) });

        expect(
            MatrixProfileService.getInstance()
                .getSharedConversations(AZIZ)
                .map((conversation) => conversation.name),
        ).toEqual(["Tergov guruhi"]);
    });

    it("lists the files exchanged in them, newest first", () => {
        const withFiles: FakeRoomSpec[] = [
            {
                ...SHARED[0],
                messages: [
                    { id: "$f1", sender: AZIZ, senderName: "Aziz", body: "dalil.pdf", ts: 1 },
                    { id: "$f2", sender: AZIZ, senderName: "Aziz", body: "bayonnoma.pdf", ts: 2 },
                ],
            },
        ];

        // The stand-in reports message bodies; file messages carry a msgtype.
        useServices(withFiles, { getUser: () => ({ displayName: "Aziz" }) });
        const client = (
            MatrixProfileService.getInstance() as unknown as {
                clientService: { getClient: () => any };
            }
        ).clientService.getClient();

        const events = client.getRoom("!g:gov").getLiveTimeline().getEvents();
        events.forEach((event: any, index: number) => {
            const body = index === 0 ? "dalil.pdf" : "bayonnoma.pdf";
            event.getContent = () => ({ body, msgtype: "m.file" });
        });

        expect(
            MatrixProfileService.getInstance()
                .getSharedFiles(AZIZ)
                .map((file) => file.name),
        ).toEqual(["bayonnoma.pdf", "dalil.pdf"]);
    });

    it("opens the existing direct conversation rather than creating a second", async () => {
        const createRoom = vi.fn();
        useServices(
            [
                {
                    id: "!d:gov",
                    name: "Aziz Rahimov",
                    memberCount: 2,
                    members: [
                        { id: ME, name: "Men", membership: "join" },
                        { id: AZIZ, name: "Aziz Rahimov", membership: "join" },
                    ],
                },
            ],
            { createRoom },
        );

        const roomId = await MatrixProfileService.getInstance().startDirectConversation(AZIZ);

        expect(roomId).toBe("!d:gov");
        expect(createRoom).not.toHaveBeenCalled();
    });

    it("creates one only where none exists", async () => {
        const createRoom = vi.fn().mockResolvedValue({ room_id: "!new:gov" });
        useServices(SHARED, { createRoom });

        expect(await MatrixProfileService.getInstance().startDirectConversation(AZIZ)).toBe(
            "!new:gov",
        );
        expect(createRoom).toHaveBeenCalled();
    });
});

describe("PR-9 / AC-15 — one profile, wherever it is opened", () => {
    function open(userId: string) {
        const onClose = vi.fn();
        const onOpenConversation = vi.fn();

        render(
            <ProfilePanel
                userId={userId}
                onClose={onClose}
                onOpenConversation={onOpenConversation}
            />,
        );

        return { onClose, onOpenConversation };
    }

    it("presents the organisation-governed fields as read-only (PR-5)", () => {
        useServices(SHARED, { getUser: () => ({ displayName: "Aziz Rahimov" }) });
        open(AZIZ);

        expect(screen.getByText(PROFILE_COPY.governedNote)).toBeTruthy();
        // AS-1: stated as unknown rather than filled in.
        expect(screen.getAllByText(PROFILE_COPY.unknownField).length).toBeGreaterThan(0);
        expect(screen.queryByLabelText(PROFILE_COPY.avatarChange)).toBeNull();
    });

    it("offers a direct conversation and the shared conversations (PR-3)", () => {
        useServices(SHARED, { getUser: () => ({ displayName: "Aziz Rahimov" }) });
        const { onOpenConversation } = open(AZIZ);

        expect(screen.getByText(PROFILE_COPY.startDirect)).toBeTruthy();

        fireEvent.click(screen.getByText("Tergov guruhi"));
        expect(onOpenConversation).toHaveBeenCalledWith("!g:gov");
    });

    it("offers the user their own editable fields and sessions (PR-4 / PR-8)", () => {
        useServices(SHARED, {
            getUser: () => ({ displayName: "Men" }),
            getDevices: async () => ({ devices: [] }),
            getDeviceId: () => "DEV1",
        });
        open(ME);

        expect(screen.getByLabelText(PROFILE_COPY.avatarChange)).toBeTruthy();
        expect(screen.getByText(PROFILE_COPY.sessions)).toBeTruthy();
        expect(screen.getByText(PROFILE_COPY.sessionsReadOnly)).toBeTruthy();
        // PR-3's actions are about someone else; they are absent on one's own.
        expect(screen.queryByText(PROFILE_COPY.startDirect)).toBeNull();
    });

    it("says so plainly when the platform holds no such person (ES-1)", () => {
        useServices(SHARED, { getUser: () => null, getRooms: () => [] });
        open("@nobody:gov.uz");

        expect(screen.getByText(PROFILE_COPY.unavailableTitle)).toBeTruthy();
    });

    it("closes on Escape (A11Y-1)", () => {
        useServices(SHARED, { getUser: () => ({ displayName: "Aziz Rahimov" }) });
        const { onClose } = open(AZIZ);

        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalled();
    });
});
