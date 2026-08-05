/*
 * Sovereign Messenger — Sprint 2, Phase 6.1
 * MatrixTimelineService.ts — Matrix Room Timeline Service.
 *
 * PRD §3.1 & Phase 6.1 Requirements:
 * - Responsible for reading room timelines from synchronized MatrixClient.
 * - Uses MatrixClientService.getInstance().getClient(). Never creates duplicate Matrix clients.
 * - Zero REST requests. Uses Matrix JS SDK APIs only.
 * - Maps Matrix events to clean SovereignMessage model (id, roomId, senderId, senderName, body, timestamp, eventId, type).
 * - Hides Matrix SDK internals.
 * - If roomId doesn't exist, returns [] without throwing UI exceptions.
 * - Zero UI / Provider / Context / ChatArea modifications.
 */

import { Direction, type EventTimeline } from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";

/**
 * COM-5 / ST-38: where a message has got to.
 *
 * Read from the platform's own send status rather than assumed: a message
 * still queued or already rejected must not be presented as delivered.
 */
export type TimelineDeliveryState = "queued" | "sending" | "sent" | "failed";

export interface SovereignMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    body: string;
    timestamp: number;
    eventId: string;
    type: "text" | "unavailable";
    delivery: TimelineDeliveryState;
}

/** How many earlier messages one backward page requests (FR-36, EDGE-2). */
const PAGE_SIZE = 40;

export class MatrixTimelineService {
    private static instance: MatrixTimelineService | null = null;
    private clientService: MatrixClientService;

    /** Rooms with a backward pagination already in flight. */
    private paginating = new Set<string>();

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get singleton instance of MatrixTimelineService.
     */
    public static getInstance(): MatrixTimelineService {
        if (!MatrixTimelineService.instance) {
            MatrixTimelineService.instance = new MatrixTimelineService();
        }
        return MatrixTimelineService.instance;
    }

    /**
     * Retrieves the list of messages for a given room timeline.
     * Returns [] if room does not exist or client is unauthenticated.
     */
    public getTimeline(roomId: string): SovereignMessage[] {
        if (!roomId) {
            return [];
        }

        const client = this.clientService.getClient();
        if (!client) {
            return [];
        }

        try {
            const room = client.getRoom(roomId);
            if (!room) {
                return [];
            }

            const liveTimeline = typeof room.getLiveTimeline === "function" ? room.getLiveTimeline() : null;
            const rawEvents = liveTimeline && typeof liveTimeline.getEvents === "function"
                ? liveTimeline.getEvents()
                : Array.isArray(room.timeline) ? room.timeline : [];
            const pendingEvents = typeof room.getPendingEvents === "function" ? room.getPendingEvents() : [];

            // Combine live timeline events with local pending sending events
            const allEvents = [...rawEvents, ...pendingEvents];

            const messages: SovereignMessage[] = [];
            for (const event of allEvents) {
                const msg = this.transformEvent(event, roomId);
                if (msg) {
                    messages.push(msg);
                }
            }

            return messages;
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixTimelineService] Error retrieving timeline for room ${roomId}:`, detail);
            return [];
        }
    }

    /**
     * FR-36 / EDGE-2: whether earlier messages remain to be loaded.
     *
     * A timeline with no backward pagination token is at the start of the
     * conversation — there is nothing further back to fetch.
     */
    public hasEarlierMessages(roomId: string): boolean {
        const timeline = this.getLiveTimeline(roomId);
        if (!timeline) return false;

        try {
            return timeline.getPaginationToken(Direction.Backward) !== null;
        } catch {
            return false;
        }
    }

    /**
     * FR-36: loads one page of earlier messages.
     *
     * EDGE-2: the history is fetched in segments rather than in full, so a
     * conversation of 100,000 messages costs the same to open as a short one.
     * Resolves true when more remain after this page.
     *
     * Concurrent calls for the same room are collapsed: the timeline fires
     * scroll events faster than a page can load, and issuing a second request
     * for the same token would duplicate the events already arriving.
     */
    public async loadEarlierMessages(roomId: string): Promise<boolean> {
        if (!roomId || this.paginating.has(roomId)) return false;

        const client = this.clientService.getClient();
        const timeline = this.getLiveTimeline(roomId);
        if (!client || !timeline) return false;

        this.paginating.add(roomId);
        try {
            return await client.paginateEventTimeline(timeline, {
                backwards: true,
                limit: PAGE_SIZE,
            });
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixTimelineService] Error paginating room ${roomId}:`, detail);
            return false;
        } finally {
            this.paginating.delete(roomId);
        }
    }

    /**
     * FR-37 / CMP-27: the event the user has read up to.
     *
     * The unread divider is drawn above the first message after this one. The
     * marker is the platform's own fully-read position, so the boundary is the
     * same one the user left behind on any of their devices (EDGE-10).
     */
    public getReadUpToEventId(roomId: string): string | null {
        const client = this.clientService.getClient();
        if (!client || !roomId) return null;

        try {
            const room: any = client.getRoom(roomId);
            const userId = client.getUserId();
            if (!room || !userId) return null;

            return room.getEventReadUpTo?.(userId, false) ?? null;
        } catch {
            return null;
        }
    }

    private getLiveTimeline(roomId: string): EventTimeline | null {
        const client = this.clientService.getClient();
        if (!client || !roomId) return null;

        try {
            const room = client.getRoom(roomId);
            return room?.getLiveTimeline() ?? null;
        } catch {
            return null;
        }
    }

    /**
     * COM-5 / ST-38: the platform's own send status for a message.
     *
     * A message the user composed while disconnected sits in the pending queue
     * and is reported as queued, not as sent — the timeline merges pending
     * events, so without this every unsent message claimed to have arrived.
     */
    private readDeliveryState(event: any): TimelineDeliveryState {
        const status = event?.status;
        if (!status) return "sent";

        switch (status) {
            case "not_sent":
                return "failed";
            case "queued":
                return "queued";
            case "sending":
            case "encrypting":
                return "sending";
            default:
                return "sent";
        }
    }

    /**
     * Transforms Matrix SDK Event object into clean SovereignMessage.
     */
    private transformEvent(event: any, fallbackRoomId: string): SovereignMessage | null {
        if (!event) {
            return null;
        }

        const type = typeof event.getType === "function" ? event.getType() : "";
        const eventId = typeof event.getId === "function" ? event.getId() || "" : "";
        const senderId = typeof event.getSender === "function" ? event.getSender() || "" : "";
        const senderName = event.sender?.name || senderId || "";
        const timestamp = typeof event.getTs === "function" ? event.getTs() : Date.now();
        const actualRoomId = typeof event.getRoomId === "function" ? event.getRoomId() || fallbackRoomId : fallbackRoomId;

        const base = {
            id: eventId || `msg_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
            roomId: actualRoomId,
            senderId,
            senderName,
            timestamp,
            eventId,
            delivery: this.readDeliveryState(event),
        };

        /*
         * FR-35 / COM-6: a message the client holds but cannot render is a
         * message, not an absence. Dropping it silently left a gap in the
         * conversation that the reader had no way to notice. It is reported as
         * unavailable and the surface renders the defined state; the reason is
         * never expressed in cryptographic terms (SUX-12).
         */
        const undecryptable =
            typeof event.isDecryptionFailure === "function" && event.isDecryptionFailure();

        if (type === "m.room.encrypted" || undecryptable) {
            return { ...base, body: "", type: "unavailable" };
        }

        if (type !== "m.room.message") {
            return null;
        }

        const content = typeof event.getContent === "function" ? event.getContent() : {};
        const body = content?.body;
        if (typeof body !== "string" || body.trim() === "") {
            return null;
        }

        return { ...base, body, type: "text" };
    }
}
