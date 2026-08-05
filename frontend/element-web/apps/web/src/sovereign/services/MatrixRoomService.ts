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

import {
    ClientEvent,
    NotificationCountType,
    RoomEvent,
    RoomStateEvent,
} from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";
import type { ConversationPreview } from "../types/conversation";
import type { MemberStatus, SovereignMember } from "../types/member";

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

/**
 * How long room changes are gathered before subscribers are told.
 *
 * PERF-10: a busy department produces a burst of timeline and receipt events,
 * and each notification costs a full re-read of every room. Coalescing keeps
 * the conversation list responsive at 200 conversations without making it
 * noticeably less current — the delay is well inside the 100ms feedback budget
 * of UX-5.
 */
const COALESCE_MS = 60;

/** How far back to look for a message to preview. Bounded, so a long-lived
 *  room costs no more than a short one (PERF-10). */
const PREVIEW_SCAN_LIMIT = 40;

/** Notified when the room list or any room's metadata may have changed. */
export type RoomListListener = () => void;

export class MatrixRoomService {
    private static instance: MatrixRoomService | null = null;
    private clientService: MatrixClientService;

    private listeners = new Set<RoomListListener>();
    private detach: (() => void) | null = null;
    private coalesceTimer: ReturnType<typeof setTimeout> | null = null;

    /*
     * PERF-10 / EDGE-1: several surfaces read the room list — the conversation
     * list, the grouped views, the conversation surface — and each read maps
     * every room and scans its recent events for a preview. Without this they
     * each repeat the same work in the same tick: measured at 5,000 rooms, five
     * readers cost 375ms against 51ms for one.
     *
     * The snapshot is cleared on the next macrotask, so readers reacting to one
     * change share a single computation and nothing can observe a room list
     * older than a tick. Returning the same array reference also lets React
     * bail out of the redundant renders entirely.
     */
    private snapshot: SovereignRoom[] | null = null;
    private snapshotTimer: ReturnType<typeof setTimeout> | null = null;

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
        if (this.snapshot) return this.snapshot;

        const client = this.clientService.getClient();
        if (!client) {
            return [];
        }

        try {
            const rawRooms = client.getRooms() || [];
            const sovereignRooms = rawRooms.map((room) => this.transformRoom(room));
            this.snapshot = this.sortRooms(sovereignRooms);
            this.scheduleSnapshotExpiry();
            return this.snapshot;
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixRoomService] Error retrieving rooms from client:", detail);
            return [];
        }
    }

    /** Discards the shared snapshot at the end of the current tick. */
    private scheduleSnapshotExpiry(): void {
        if (this.snapshotTimer !== null) return;

        this.snapshotTimer = setTimeout(() => {
            this.snapshotTimer = null;
            this.snapshot = null;
        }, 0);
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
        this.snapshot = null;
        return this.getAllRooms();
    }

    /**
     * Observe changes to the room list and to room metadata.
     *
     * NAV-2: a conversation's place in the list changes without the list
     * itself changing — a new message moves it up, a read receipt from another
     * device clears its unread count, a tag makes it a favourite. Observing
     * only room creation would leave the list stale.
     *
     * This is the only place these platform events are read, so no hook,
     * provider, or component imports the SDK to watch them (Blueprint §8).
     * Unread counts arrive on the sync response, which `Sync` covers; the
     * room-level unread event is not among the events the client re-emits.
     */
    public subscribe(listener: RoomListListener): () => void {
        this.listeners.add(listener);
        this.attach();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.detachListeners();
            }
        };
    }

    /**
     * FR-45 / COM-4: the participants of a conversation.
     *
     * Read from the room's own membership, which the platform already holds —
     * no request is issued. Ordered joined before invited before departed, then
     * by name, so the people currently in the conversation come first.
     *
     * EDGE-6: a person who has left is reported rather than dropped, so their
     * historical messages stay attributed and the surface can show them in an
     * inactive treatment.
     */
    public getMembers(roomId: string): SovereignMember[] {
        const client = this.clientService.getClient();
        if (!roomId || !client) return [];

        try {
            const room: any = client.getRoom(roomId);
            if (!room || typeof room.getMembers !== "function") return [];

            const state = room.currentState;

            const members: SovereignMember[] = room.getMembers().map((member: any): SovereignMember => {
                const raw = member?.membership;
                const status: MemberStatus =
                    raw === "join" ? "joined" : raw === "invite" ? "invited" : "left";

                return {
                    id: member?.userId ?? "",
                    displayName: member?.name || member?.rawDisplayName || member?.userId || "",
                    avatarUrl: typeof member?.getMxcAvatarUrl === "function"
                        ? member.getMxcAvatarUrl()
                        : undefined,
                    status,
                    canPost:
                        status === "joined" &&
                        typeof state?.maySendMessage === "function" &&
                        Boolean(state.maySendMessage(member?.userId)),
                };
            });

            const rank: Record<MemberStatus, number> = { joined: 0, invited: 1, left: 2 };

            return members
                .filter((member) => member.id !== "")
                .sort(
                    (a, b) =>
                        rank[a.status] - rank[b.status] ||
                        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
                );
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixRoomService] Error reading members of ${roomId}:`, detail);
            return [];
        }
    }

    /**
     * COM-2 / SUX-9: whether this user may currently post in a room.
     *
     * The authority is the room's own power levels, which change during a
     * session (EDGE-13). Returns null when the answer is not knowable — no
     * client, or no such room — so the caller can fall back rather than treat
     * "unknown" as "denied" and silently remove a composer.
     */
    public canSendMessage(roomId: string): boolean | null {
        if (!roomId) return null;

        const client = this.clientService.getClient();
        if (!client) return null;

        try {
            const room: any = client.getRoom(roomId);
            const userId = client.getUserId();
            if (!room || !userId) return null;

            // The live forward state — the same state the room list reads.
            const state = room.currentState;
            if (typeof state?.maySendMessage !== "function") return null;

            return Boolean(state.maySendMessage(userId));
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixRoomService] Error reading posting rights for ${roomId}:`, detail);
            return null;
        }
    }

    /**
     * Observation. This is the only place these platform events are read, so
     * no hook, provider, or component imports the SDK to watch them.
     */
    private attach(): void {
        if (this.detach) return;

        const client = this.clientService.getClient();
        if (!client) return;

        const notify = (): void => {
            // The snapshot is stale the moment the platform reports a change.
            this.snapshot = null;
            this.scheduleNotify();
        };

        const events = [
            ClientEvent.Sync,
            ClientEvent.Room,
            RoomEvent.Timeline,
            RoomEvent.Receipt,
            RoomEvent.Tags,
            RoomEvent.Name,
            RoomEvent.MyMembership,
            // SUX-9: a change of posting rights arrives as a room state event.
            RoomStateEvent.Events,
            RoomStateEvent.Update,
        ] as const;

        try {
            events.forEach((event) => client.on(event, notify));
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixRoomService] Unable to observe room changes:", detail);
            return;
        }

        this.detach = () => {
            try {
                events.forEach((event) => client.removeListener(event, notify));
            } catch {
                // Graceful fallback: listeners go out of scope with the client.
            }
        };
    }

    private detachListeners(): void {
        if (this.coalesceTimer !== null) {
            clearTimeout(this.coalesceTimer);
            this.coalesceTimer = null;
        }
        if (this.snapshotTimer !== null) {
            clearTimeout(this.snapshotTimer);
            this.snapshotTimer = null;
        }
        this.snapshot = null;
        this.detach?.();
        this.detach = null;
    }

    /** PERF-10: gathers a burst of events into a single notification. */
    private scheduleNotify(): void {
        if (this.coalesceTimer !== null) return;

        this.coalesceTimer = setTimeout(() => {
            this.coalesceTimer = null;
            this.listeners.forEach((listener) => {
                try {
                    listener();
                } catch (error: unknown) {
                    const detail = error instanceof Error ? error.message : String(error);
                    console.warn("[MatrixRoomService] Error in room list subscriber:", detail);
                }
            });
        }, COALESCE_MS);
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
