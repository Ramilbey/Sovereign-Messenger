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

import { MatrixClientService } from "./MatrixClientService";

export interface SovereignMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    body: string;
    timestamp: number;
    eventId: string;
    type: "text";
}

export class MatrixTimelineService {
    private static instance: MatrixTimelineService | null = null;
    private clientService: MatrixClientService;

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
     * Alias for getTimeline(roomId) for consistent naming.
     */
    public getMessages(roomId: string): SovereignMessage[] {
        return this.getTimeline(roomId);
    }

    /**
     * Triggers a fresh timeline retrieval for the specified room.
     */
    public refresh(roomId: string): SovereignMessage[] {
        return this.getTimeline(roomId);
    }

    /**
     * Check if a room exists in the authenticated MatrixClient.
     */
    public hasRoom(roomId: string): boolean {
        if (!roomId) {
            return false;
        }
        const client = this.clientService.getClient();
        if (!client) {
            return false;
        }
        return client.getRoom(roomId) !== null;
    }

    /**
     * Transforms Matrix SDK Event object into clean SovereignMessage.
     */
    private transformEvent(event: any, fallbackRoomId: string): SovereignMessage | null {
        if (!event) {
            return null;
        }

        const type = typeof event.getType === "function" ? event.getType() : "";
        if (type !== "m.room.message") {
            return null;
        }

        const content = typeof event.getContent === "function" ? event.getContent() : {};
        const body = content?.body;
        if (typeof body !== "string" || body.trim() === "") {
            return null;
        }

        const eventId = typeof event.getId === "function" ? event.getId() || "" : "";
        const senderId = typeof event.getSender === "function" ? event.getSender() || "" : "";
        const senderName = event.sender?.name || senderId || "Unknown";
        const timestamp = typeof event.getTs === "function" ? event.getTs() : Date.now();
        const actualRoomId = typeof event.getRoomId === "function" ? event.getRoomId() || fallbackRoomId : fallbackRoomId;

        return {
            id: eventId || `msg_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
            roomId: actualRoomId,
            senderId,
            senderName,
            body,
            timestamp,
            eventId,
            type: "text",
        };
    }
}
