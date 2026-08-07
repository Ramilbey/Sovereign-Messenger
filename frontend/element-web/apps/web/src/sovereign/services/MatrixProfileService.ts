/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * MatrixProfileService.ts — Person Profiles
 *
 * Implements D-12 (PR-1 … PR-9).
 *
 * Everything here is read from what the synchronised client already holds, or
 * written through the client's own profile and presence calls. No new
 * integration, no change to synchronisation, and nothing that touches a
 * protected system (PRD §6.1).
 *
 * PR-9 / AC-15: there is one profile, assembled once. A surface opens it; it
 * does not compose a version of its own, which is the only way the presentation
 * can be identical wherever it is opened.
 */

import { MatrixClientService } from "./MatrixClientService";
import { MatrixPresenceService } from "./MatrixPresenceService";
import { MatrixRoomService } from "./MatrixRoomService";
import { MatrixUserService } from "./MatrixUserService";
import { OrganisationService, orgNodeName } from "./OrganisationService";
import { roleLabel } from "../config/roleCopy";
import type {
    SharedConversation,
    SharedFile,
    SovereignDevice,
    SovereignProfile,
} from "../types/profile";

/** How many recent events a shared conversation is scanned for files. */
const FILE_SCAN_LIMIT = 60;

/** PR-3: how many shared files the profile presents. */
const FILE_LIMIT = 20;

export class MatrixProfileService {
    private static instance: MatrixProfileService | null = null;

    private clientService: MatrixClientService;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    public static getInstance(): MatrixProfileService {
        if (!MatrixProfileService.instance) {
            MatrixProfileService.instance = new MatrixProfileService();
        }
        return MatrixProfileService.instance;
    }

    /**
     * PR-1: the profile of one person.
     *
     * PR-5 / AS-1: role, department, and position are organisation-governed and
     * only the signed-in user's own identity data carries them. For anyone else
     * they resolve to null and the surface omits them, rather than showing a
     * designation nothing supports (FR-1).
     */
    public getProfile(userId: string): SovereignProfile | null {
        const client = this.clientService.getClient();
        if (!client || !userId) return null;

        try {
            const isSelf = client.getUserId() === userId;
            const user: any = client.getUser(userId);

            /*
             * NFR-8 / FR-1: a person the platform holds nothing about resolves
             * to no profile at all, so the surface presents its unavailable
             * state. Falling back to the account identifier would put an
             * internal identifier on screen and call it a name.
             */
            const displayName = user?.displayName || this.nameFromRooms(userId);
            if (!displayName && !isSelf) return null;

            const presence = MatrixPresenceService.getInstance().getPresence(userId);

            const identity = isSelf ? MatrixUserService.getCurrentUser(client) : null;
            const organisation = OrganisationService.getInstance();
            const positionId = identity ? organisation.resolvePosition(identity.department) : null;
            const position = positionId ? organisation.getNode(positionId) : null;
            const department = positionId ? organisation.getAncestorOfType(positionId, "Bolim") : null;

            return {
                userId,
                displayName: displayName || userId,
                avatarUrl: this.avatarFor(userId, user),
                role: identity ? roleLabel(identity.role) : null,
                department: department ? orgNodeName(department) : null,
                position: position ? orgNodeName(position) : null,
                presence,
                statusMessage: presence.statusMessage ?? null,
                isSelf,
            };
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixProfileService] Unable to read the profile of ${userId}:`, detail);
            return null;
        }
    }

    /** PR-3: the conversations this person and the reader both belong to. */
    public getSharedConversations(userId: string): SharedConversation[] {
        const client = this.clientService.getClient();
        if (!client || !userId) return [];

        const me = client.getUserId();
        if (userId === me) return [];

        return MatrixRoomService.getInstance()
            .getJoinedRooms()
            .filter((room) =>
                MatrixRoomService.getInstance()
                    .getMembers(room.roomId)
                    .some((member) => member.id === userId && member.status !== "left"),
            )
            .map((room) => ({ id: room.roomId, name: room.name }));
    }

    /**
     * PR-3: the files exchanged in the conversations they share.
     *
     * Bounded per conversation and in total: a profile is a summary, and a
     * profile that walked every message of every shared conversation would
     * cost more to open the longer two people had worked together (PERF-10).
     */
    public getSharedFiles(userId: string): SharedFile[] {
        const client = this.clientService.getClient();
        if (!client) return [];

        const files: SharedFile[] = [];

        for (const conversation of this.getSharedConversations(userId)) {
            try {
                const room: any = client.getRoom(conversation.id);
                const events: any[] = room?.getLiveTimeline?.()?.getEvents?.() ?? [];

                for (const event of events.slice(Math.max(0, events.length - FILE_SCAN_LIMIT))) {
                    const content = event?.getContent?.();
                    const msgtype = content?.msgtype;
                    if (msgtype !== "m.file" && msgtype !== "m.image") continue;

                    const name = typeof content?.body === "string" ? content.body : "";
                    const eventId = event?.getId?.() ?? "";
                    if (name === "" || eventId === "") continue;

                    files.push({
                        id: `${conversation.id}:${eventId}`,
                        conversationId: conversation.id,
                        eventId,
                        name,
                        sentAt: typeof event.getTs === "function" ? event.getTs() : 0,
                    });
                }
            } catch {
                // A conversation that cannot be read contributes nothing; the
                // rest of the profile is still worth showing.
            }
        }

        return files.sort((a, b) => b.sentAt - a.sentAt).slice(0, FILE_LIMIT);
    }

    /** PR-8: the sessions the account has open. Read-only. */
    public async getDevices(): Promise<SovereignDevice[]> {
        const client = this.clientService.getClient();
        if (!client) return [];

        const current = client.getDeviceId();
        const response = await client.getDevices();

        return (response?.devices ?? []).map((device: any): SovereignDevice => ({
            id: device.device_id,
            displayName: device.display_name || null,
            lastSeenAt: typeof device.last_seen_ts === "number" ? device.last_seen_ts : null,
            isCurrent: device.device_id === current,
        }));
    }

    /** PR-4: the user's own display name. */
    public async setDisplayName(name: string): Promise<void> {
        const client = this.clientService.getClient();
        if (!client) return;
        await client.setDisplayName(name);
    }

    /**
     * PR-4: the user's own status message.
     *
     * Carried on presence, which is where the platform holds it, so it appears
     * beside availability wherever the person appears (FR-13).
     */
    public async setStatusMessage(message: string): Promise<void> {
        const client = this.clientService.getClient();
        if (!client) return;

        const manual = MatrixPresenceService.getInstance().getManualPresence();
        await client.setPresence({
            presence: manual === "away" ? "unavailable" : "online",
            status_msg: message,
        });
    }

    /** PR-4: the user's own avatar, from an image they choose. */
    public async setAvatar(contentUri: string): Promise<void> {
        const client = this.clientService.getClient();
        if (!client) return;
        await client.setAvatarUrl(contentUri);
    }

    /**
     * PR-3: open a direct conversation with this person.
     *
     * An existing one is used rather than a second one created: two direct
     * conversations with the same colleague would split their correspondence
     * in half. Only when none exists is one created.
     */
    public async startDirectConversation(userId: string): Promise<string | null> {
        const client = this.clientService.getClient();
        if (!client || !userId) return null;

        const existing = MatrixRoomService.getInstance()
            .getJoinedRooms()
            .find(
                (room) =>
                    room.isDirect &&
                    MatrixRoomService.getInstance()
                        .getMembers(room.roomId)
                        .some((member) => member.id === userId),
            );
        if (existing) return existing.roomId;

        const created = await client.createRoom({
            is_direct: true,
            invite: [userId],
            preset: "trusted_private_chat" as any,
        });

        return created?.room_id ?? null;
    }

    /** A person's name as the conversations they are in record it. */
    private nameFromRooms(userId: string): string | null {
        const rooms = MatrixRoomService.getInstance();

        for (const room of rooms.getJoinedRooms()) {
            const member = rooms.getMembers(room.roomId).find((entry) => entry.id === userId);
            if (member?.displayName) return member.displayName;
        }

        return null;
    }

    /** PR-6: the person's image where one exists; initials are the fallback. */
    private avatarFor(userId: string, user: any): string | undefined {
        if (typeof user?.avatarUrl === "string" && user.avatarUrl !== "") return user.avatarUrl;

        const rooms = MatrixRoomService.getInstance();
        for (const room of rooms.getJoinedRooms()) {
            const member = rooms.getMembers(room.roomId).find((entry) => entry.id === userId);
            if (member?.avatarUrl) return member.avatarUrl;
        }

        return undefined;
    }
}
