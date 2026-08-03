/*
 * Sovereign Messenger — Sprint 2, Phase 6.3
 * MatrixMessageService.ts — Matrix Timeline & Messaging Service Implementation.
 *
 * PRD §3.1 & Phase 6.3 Requirements:
 * - Implements real message sending via Matrix SDK sendTextMessage API.
 * - Uses MatrixClientService.getInstance().getClient(). Never creates duplicate Matrix clients.
 * - Listens for Matrix SDK Room.timeline events to make Matrix timeline the single source of truth.
 * - Does NOT manually append messages to local state post-send.
 * - Graceful error handling without crashing React components.
 * - Architecture: MessageComposer -> ChatContext -> useMessages -> MatrixMessageService -> MatrixClientService -> Matrix SDK -> Synapse.
 */

import type { MessageService, SovereignMessage, TimelineCallback } from "./MessageService";
import { MatrixTimelineService } from "./MatrixTimelineService";
import { MatrixClientService } from "./MatrixClientService";

export class MatrixMessageService implements MessageService {
    private timelineService: MatrixTimelineService;
    private clientService: MatrixClientService;

    constructor() {
        this.timelineService = MatrixTimelineService.getInstance();
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get snapshot of messages for specified channel/room ID.
     */
    public async getMessages(channelId: string): Promise<SovereignMessage[]> {
        if (!channelId) {
            return [];
        }

        const timeline = this.timelineService.getTimeline(channelId);
        return timeline.map((msg) => this.mapToSovereignMessage(msg));
    }

    /**
     * Sends a text message to the specified Matrix room using Matrix JS SDK.
     * Does NOT append manually to local state; timeline subscription is the single source of truth.
     */
    public async sendMessage(
        channelId: string,
        content: string,
        senderId: string,
        senderName: string,
        senderRole: string
    ): Promise<SovereignMessage> {
        if (!channelId || !content.trim()) {
            throw new Error("[MatrixMessageService] Invalid channel ID or empty content.");
        }

        const client = this.clientService.getClient();
        if (!client) {
            throw new Error("[MatrixMessageService] Cannot send message: MatrixClient is not authenticated.");
        }

        try {
            // Execute Matrix JS SDK text message sending (POST /_matrix/client/v3/rooms/{roomId}/send/m.room.message/{txnId})
            const response = await client.sendTextMessage(channelId, content);
            const eventId = response?.event_id || `sent_${Date.now()}`;
            const timestamp = Date.now();
            const dateObj = new Date(timestamp);

            return {
                id: eventId,
                channelId,
                senderId: senderId || client.getUserId() || "",
                senderName: senderName || client.getUserId() || "User",
                senderRole: senderRole || "Xodim",
                content,
                timestamp: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                date: dateObj.toLocaleDateString(),
                readState: "sent",
            };
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixMessageService] Error sending message to ${channelId}:`, detail);
            throw new Error(`Message delivery failed: ${detail}`);
        }
    }

    /**
     * Subscribes to real-time Matrix timeline events for a specified room.
     */
    public subscribeToTimeline(channelId: string, callback: TimelineCallback): () => void {
        if (!channelId) {
            callback([]);
            return () => {};
        }

        const notifyTimelineUpdate = () => {
            const rawTimeline = this.timelineService.getTimeline(channelId);
            const sovereignMessages = rawTimeline.map((msg) => this.mapToSovereignMessage(msg));
            callback(sovereignMessages);
        };

        // 1. Send initial timeline snapshot
        notifyTimelineUpdate();

        // 2. Register listener on authenticated MatrixClient for Room.timeline events
        const client = this.clientService.getClient();
        if (!client) {
            return () => {};
        }

        const onRoomTimeline = (event: any, room: any) => {
            if (room && room.roomId === channelId) {
                notifyTimelineUpdate();
            }
        };

        try {
            client.on("Room.timeline", onRoomTimeline);
        } catch (err: unknown) {
            const detail = err instanceof Error ? err.message : String(err);
            console.warn("[MatrixMessageService] Warning attaching timeline listener:", detail);
        }

        return () => {
            try {
                client.removeListener("Room.timeline", onRoomTimeline);
            } catch {
                // Graceful fallback
            }
        };
    }

    /**
     * Maps MatrixTimelineService SovereignMessage DTO to Provider SovereignMessage.
     */
    private mapToSovereignMessage(msg: {
        id: string;
        roomId: string;
        senderId: string;
        senderName: string;
        body: string;
        timestamp: number;
        eventId: string;
        type: "text";
    }): SovereignMessage {
        const dateObj = new Date(msg.timestamp);
        const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const dateStr = dateObj.toLocaleDateString();

        return {
            id: msg.id,
            channelId: msg.roomId,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderRole: "Xodim",
            content: msg.body,
            timestamp: timeStr,
            date: dateStr,
            readState: "read",
        };
    }
}
