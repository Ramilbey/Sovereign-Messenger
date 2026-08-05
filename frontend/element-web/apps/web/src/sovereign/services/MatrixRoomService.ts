/*
 * Sovereign Messenger — Sprint 2, Phase 4
 * MatrixRoomService.ts — Matrix Room Discovery Service.
 *
 * PRD §3.1 & Phase 4 Requirements:
 * - Owns all Matrix room discovery logic.
 * - Uses existing authenticated MatrixClient from MatrixClientService. Never creates new client.
 * - Loads rooms strictly from synchronized MatrixClient (client.getRooms()).
 * - Zero manual HTTP requests / REST API calls.
 * - Exposes clean SovereignRoom interface (roomId, name, topic, avatarUrl, canonicalAlias, isDirect, membership).
 * - Sorts rooms consistently: Joined first, Invited second, Alphabetical inside each group.
 * - Zero React/Provider/Context changes, zero UI rendering, zero timeline/message loading.
 */

import { NotificationCountType } from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";
import type { ConversationPreview } from "../types/conversation";

export interface SovereignRoom {
    roomId: string;
    name: string;
    topic?: string;
    avatarUrl?: string;
    canonicalAlias?: string;
    isDirect: boolean;
    membership: "join" | "invite" | "leave";

    /*
     * Milestone 3: metadata the conversation list and header need (NAV-2,
     * FR-44). All of it is already carried on the synchronised room — nothing
     * here issues a request, changes synchronisation, or touches the bridge.
     */

    /** FR-44: participants in the conversation. */
    memberCount: number;
    /** IA-7: most recent activity, for ordering within a type. */
    lastActivityAt: number | null;
    /** NAV-2: last message, as the list summarises it. */
    preview: ConversationPreview | null;
    /** NT-1: unread count as the server reports it. */
    unreadCount: number;
    /** NT-2: mentions, kept distinct from ordinary unread. */
    mentionCount: number;
    /** FR-47: room tagged as a favourite. */
    isFavourite: boolean;
    /** FR-46: room-level notification rule suppresses notification. */
    isMuted: boolean;
}

/** The Matrix tag denoting a favourite conversation (FR-47). */
const FAVOURITE_TAG = "m.favourite";

/** How far back to look for a message to preview. Bounded, so a long-lived
 *  room costs no more than a short one (PERF-10). */
const PREVIEW_SCAN_LIMIT = 40;

export class MatrixRoomService {
    private static instance: MatrixRoomService | null = null;
    private clientService: MatrixClientService;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get singleton instance of MatrixRoomService.
     */
    public static getInstance(): MatrixRoomService {
        if (!MatrixRoomService.instance) {
            MatrixRoomService.instance = new MatrixRoomService();
        }
        return MatrixRoomService.instance;
    }

    /**
     * Retrieves all discovered Matrix rooms sorted (Joined first, Invited second, Alphabetical).
     */
    public getAllRooms(): SovereignRoom[] {
        const client = this.clientService.getClient();
        if (!client) {
            return [];
        }

        try {
            const rawRooms = client.getRooms() || [];
            const sovereignRooms = rawRooms.map((room) => this.transformRoom(room));
            return this.sortRooms(sovereignRooms);
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixRoomService] Error retrieving rooms from client:", detail);
            return [];
        }
    }

    /**
     * Returns only rooms where current user's membership is "join".
     */
    public getJoinedRooms(): SovereignRoom[] {
        return this.getAllRooms().filter((room) => room.membership === "join");
    }

    /**
     * Returns only rooms where current user's membership is "invite".
     */
    public getInvitedRooms(): SovereignRoom[] {
        return this.getAllRooms().filter((room) => room.membership === "invite");
    }

    /**
     * Get details for a specific Matrix room by roomId.
     */
    public getRoom(roomId: string): SovereignRoom | null {
        if (!roomId) {
            return null;
        }
        const client = this.clientService.getClient();
        if (!client) {
            return null;
        }

        try {
            const rawRoom = client.getRoom(roomId);
            return rawRoom ? this.transformRoom(rawRoom) : null;
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixRoomService] Error fetching room ${roomId}:`, detail);
            return null;
        }
    }

    /**
     * Triggers a fresh discovery of all synchronized rooms.
     */
    public refresh(): SovereignRoom[] {
        return this.getAllRooms();
    }

    /**
     * Transforms Matrix SDK Room object to clean SovereignRoom interface.
     */
    private transformRoom(room: any): SovereignRoom {
        const membershipRaw = typeof room.getMyMembership === "function" ? room.getMyMembership() : "leave";
        const membership: "join" | "invite" | "leave" =
            membershipRaw === "join" ? "join" : membershipRaw === "invite" ? "invite" : "leave";

        let topic: string | undefined = undefined;
        try {
            const topicEvent = room.currentState?.getStateEvents("m.room.topic", "");
            topic = topicEvent?.getContent()?.topic || undefined;
        } catch {
            topic = undefined;
        }

        let canonicalAlias: string | undefined = undefined;
        try {
            canonicalAlias = typeof room.getCanonicalAlias === "function" ? room.getCanonicalAlias() : undefined;
        } catch {
            canonicalAlias = undefined;
        }

        let avatarUrl: string | undefined = undefined;
        try {
            avatarUrl = typeof room.getMxcAvatarUrl === "function" ? room.getMxcAvatarUrl() : undefined;
        } catch {
            avatarUrl = undefined;
        }

        const memberCount = typeof room.getJoinedMemberCount === "function" ? room.getJoinedMemberCount() : 0;
        const isDirect = memberCount <= 2 && !canonicalAlias;

        return {
            roomId: room.roomId,
            name: room.name || canonicalAlias || room.roomId,
            topic,
            avatarUrl,
            canonicalAlias,
            isDirect,
            membership,
            memberCount,
            lastActivityAt: this.readLastActivity(room),
            preview: this.readPreview(room),
            unreadCount: this.readNotificationCount(room, NotificationCountType.Total),
            mentionCount: this.readNotificationCount(room, NotificationCountType.Highlight),
            isFavourite: this.readIsFavourite(room),
            isMuted: this.readIsMuted(room),
        };
    }

    /**
     * NT-1: the unread count the server carried on synchronisation.
     *
     * Read, never computed: a locally derived tally would drift from other
     * tabs and devices, which is precisely what NT-8 forbids.
     */
    private readNotificationCount(room: any, type: NotificationCountType): number {
        try {
            const count = typeof room.getUnreadNotificationCount === "function"
                ? room.getUnreadNotificationCount(type)
                : 0;
            return typeof count === "number" && count > 0 ? count : 0;
        } catch {
            return 0;
        }
    }

    /** IA-7: most recent activity. Null rather than zero when unknown. */
    private readLastActivity(room: any): number | null {
        try {
            const timestamp = typeof room.getLastActiveTimestamp === "function"
                ? room.getLastActiveTimestamp()
                : null;
            return typeof timestamp === "number" && timestamp > 0 ? timestamp : null;
        } catch {
            return null;
        }
    }

    /**
     * NAV-2: the last message, for the list preview.
     *
     * Returns null when the most recent events carry nothing displayable —
     * a preview is never invented from a state change or an undecryptable
     * event (FR-35, COM-6).
     */
    private readPreview(room: any): ConversationPreview | null {
        try {
            const timeline = typeof room.getLiveTimeline === "function" ? room.getLiveTimeline() : null;
            const events: any[] = timeline?.getEvents?.() ?? (Array.isArray(room.timeline) ? room.timeline : []);

            const start = Math.max(0, events.length - PREVIEW_SCAN_LIMIT);
            for (let i = events.length - 1; i >= start; i--) {
                const event = events[i];
                if (typeof event?.getType !== "function" || event.getType() !== "m.room.message") continue;

                const body = event.getContent?.()?.body;
                if (typeof body !== "string" || body.length === 0) continue;

                const senderId: string = event.getSender?.() ?? "";
                const senderName: string =
                    room.getMember?.(senderId)?.name || event.sender?.name || senderId;

                return { senderName, body };
            }

            return null;
        } catch {
            return null;
        }
    }

    /** FR-47 / IA-8: favourites are expressed as a room tag. */
    private readIsFavourite(room: any): boolean {
        try {
            return Boolean(room.tags?.[FAVOURITE_TAG]);
        } catch {
            return false;
        }
    }

    /**
     * FR-46 / NT-6: a room-level rule that suppresses notification is what the
     * platform means by "muted". Read only — Sprint 3 presents this state; the
     * per-conversation setting arrives with the notification system.
     */
    private readIsMuted(room: any): boolean {
        const client = this.clientService.getClient();
        if (!client) return false;

        try {
            const rule = client.getRoomPushRule("global", room.roomId);
            if (!rule?.enabled) return false;

            const actions: unknown[] = Array.isArray(rule.actions) ? rule.actions : [];
            // Both the historic "dont_notify" action and the modern empty
            // action list mean the same thing to the user.
            return actions.length === 0 || actions.includes("dont_notify");
        } catch {
            return false;
        }
    }

    /**
     * Sorts rooms: Joined rooms first, Invited rooms second, Alphabetical inside each group.
     */
    private sortRooms(rooms: SovereignRoom[]): SovereignRoom[] {
        const joined = rooms.filter((r) => r.membership === "join");
        const invited = rooms.filter((r) => r.membership === "invite");
        const others = rooms.filter((r) => r.membership !== "join" && r.membership !== "invite");

        const sortByName = (a: SovereignRoom, b: SovereignRoom) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

        joined.sort(sortByName);
        invited.sort(sortByName);
        others.sort(sortByName);

        return [...joined, ...invited, ...others];
    }
}
