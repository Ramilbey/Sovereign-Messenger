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
import { isPreviewableImage, type MessageAttachment } from "../types/attachment";

/**
 * COM-5 / ST-38: where a message has got to.
 *
 * Read from the platform's own send status rather than assumed: a message
 * still queued or already rejected must not be presented as delivered.
 */
export type TimelineDeliveryState = "queued" | "sending" | "sent" | "read" | "failed";

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
    /** FR-26: the file this message carries, where it carries one. */
    attachment?: MessageAttachment;
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

            /*
             * Pending events are supplementary: they are the user's own unsent
             * messages, shown while they are on their way (SUX-6).
             *
             * The platform only keeps them in a separate list when the client
             * was created with detached pending-event ordering; with
             * chronological ordering they are already in the live timeline and
             * asking for them separately THROWS. That throw used to reach the
             * outer catch, which returned an empty array — so a single
             * configuration choice by the host silently emptied every
             * conversation, and the surface then reported "no messages yet"
             * about official correspondence that plainly existed.
             *
             * Their absence costs nothing; losing the timeline costs
             * everything, so they are read separately and never allowed to
             * take the real messages down with them.
             */
            let pendingEvents: unknown[] = [];
            try {
                pendingEvents = typeof room.getPendingEvents === "function" ? room.getPendingEvents() : [];
            } catch {
                pendingEvents = [];
            }

            const allEvents = [...rawEvents, ...pendingEvents];

            const messages: SovereignMessage[] = [];
            for (const event of allEvents) {
                const msg = this.transformEvent(event, roomId, room, client.getUserId() ?? undefined);
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
     * FR-26: the file a message carries, where it carries one.
     *
     * EDGE-8: a message whose media reference is missing keeps its filename so
     * the card can present the unavailable state rather than vanishing.
     */
    private readAttachment(content: any): MessageAttachment | undefined {
        const msgtype = content?.msgtype;
        if (msgtype !== "m.image" && msgtype !== "m.file" && msgtype !== "m.video" && msgtype !== "m.audio") {
            return undefined;
        }

        const contentUri = typeof content?.url === "string" ? content.url : "";
        const info = content?.info ?? {};
        const mimeType = typeof info?.mimetype === "string" ? info.mimetype : "application/octet-stream";

        return {
            contentUri,
            name: typeof content?.body === "string" ? content.body : "",
            size: typeof info?.size === "number" ? info.size : null,
            mimeType,
            isImage: msgtype === "m.image" && isPreviewableImage(mimeType),
            width: typeof info?.w === "number" ? info.w : undefined,
            height: typeof info?.h === "number" ? info.h : undefined,
        };
    }

    /**
     * COM-5 / ST-38: the platform's own send status for a message.
     *
     * A message the user composed while disconnected sits in the pending queue
     * and is reported as queued, not as sent — the timeline merges pending
     * events, so without this every unsent message claimed to have arrived.
     */
    private readDeliveryState(event: any, room?: any, myUserId?: string): TimelineDeliveryState {
        const status = event?.status;

        if (!status) {
            /*
             * FR-18: a message the user sent has been read once another
             * participant's read position has reached it. Only the sender's
             * own messages carry a read state — reporting one on somebody
             * else's message would tell them about their own reading.
             */
            if (room && myUserId && event?.getSender?.() === myUserId) {
                try {
                    const others: string[] = (room.getUsersReadUpTo?.(event) ?? []).filter(
                        (id: string) => id !== myUserId,
                    );
                    if (others.length > 0) return "read";
                } catch {
                    // Receipts are supplementary; their absence leaves the
                    // message at "sent" rather than losing it.
                }
            }
            return "sent";
        }

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
    private transformEvent(
        event: any,
        fallbackRoomId: string,
        room?: any,
        myUserId?: string,
    ): SovereignMessage | null {
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
            delivery: this.readDeliveryState(event, room, myUserId),
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

        return { ...base, body, type: "text", attachment: this.readAttachment(content) };
    }
}
