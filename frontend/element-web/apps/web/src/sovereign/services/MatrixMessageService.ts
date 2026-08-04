/*
 * Sovereign Messenger — Sprint 2, Phase 6.3 / Debug Fix
 * MatrixMessageService.ts — Matrix Timeline & Messaging Service Implementation.
 *
 * Requirements:
 * - Implements real message sending via Matrix SDK sendTextMessage API.
 * - Uses MatrixClientService.getInstance().getClient(). Never creates duplicate Matrix clients.
 * - Subscribes to Matrix SDK Room.timeline and Room.localEchoUpdated events.
 * - Combines live timeline and pending sending events via MatrixTimelineService.
 * - Notifies subscribers immediately post-send so messages render in ChatArea instantly without refresh.
 */

import { MatrixEventEvent, RoomEvent } from "matrix-js-sdk/src/matrix";
import type { MessageService, SovereignMessage, TimelineCallback } from "./MessageService";
import { MatrixTimelineService } from "./MatrixTimelineService";
import { MatrixClientService } from "./MatrixClientService";

export class MatrixMessageService implements MessageService {
    private timelineService: MatrixTimelineService;
    private clientService: MatrixClientService;
    private activeSubscribers: Map<string, Set<TimelineCallback>> = new Map();

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
            const response = await client.sendTextMessage(channelId, content);

            // Notify active subscribers immediately upon send completion
            this.notifyTimelineUpdate(channelId);

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

        // Register callback in activeSubscribers
        if (!this.activeSubscribers.has(channelId)) {
            this.activeSubscribers.set(channelId, new Set());
        }
        this.activeSubscribers.get(channelId)!.add(callback);

        // 1. Deliver initial snapshot
        this.notifyTimelineUpdate(channelId);

        // 2. Register listener on authenticated MatrixClient for Room.timeline & Room.localEchoUpdated events
        const client = this.clientService.getClient();
        if (!client) {
            return () => {
                const callbacks = this.activeSubscribers.get(channelId);
                if (callbacks) callbacks.delete(callback);
            };
        }

        const onRoomTimeline = (event: any, room: any) => {
            const eventRoomId = room?.roomId || event?.getRoomId?.();
            if (eventRoomId === channelId || (room && room.roomId === channelId)) {
                this.notifyTimelineUpdate(channelId);
            }
        };

        // In an end-to-end encrypted room, an event arrives over /sync as
        // m.room.encrypted and Room.timeline fires BEFORE decryption finishes
        // (decryption is asynchronous — see matrix-js-sdk event-mapper.ts). At
        // that moment MatrixTimelineService.transformEvent() still sees
        // m.room.encrypted and drops the event. Decryption completing does NOT
        // re-fire Room.timeline — it fires MatrixEventEvent.Decrypted — so
        // without this second listener a received message never reaches the UI
        // until something else forces a re-read (sending, switching rooms, or a
        // refresh). Element's own RoomView.tsx uses this same pair of listeners.
        const onEventDecrypted = (event: any) => {
            if (event?.getRoomId?.() !== channelId) return; // not for this room
            if (event?.isDecryptionFailure?.()) return; // still undecryptable
            this.notifyTimelineUpdate(channelId);
        };

        try {
            client.on(RoomEvent.Timeline, onRoomTimeline);
            client.on(RoomEvent.LocalEchoUpdated, onRoomTimeline);
            client.on(MatrixEventEvent.Decrypted, onEventDecrypted);
        } catch (err: unknown) {
            const detail = err instanceof Error ? err.message : String(err);
            console.warn("[MatrixMessageService] Warning attaching timeline listener:", detail);
        }

        return () => {
            const callbacks = this.activeSubscribers.get(channelId);
            if (callbacks) {
                callbacks.delete(callback);
            }
            try {
                client.removeListener(RoomEvent.Timeline, onRoomTimeline);
                client.removeListener(RoomEvent.LocalEchoUpdated, onRoomTimeline);
                client.removeListener(MatrixEventEvent.Decrypted, onEventDecrypted);
            } catch {
                // Graceful fallback
            }
        };
    }

    /**
     * Triggers timeline snapshot fetch and notifies all active subscribers for the channel.
     */
    private notifyTimelineUpdate(channelId: string): void {
        const callbacks = this.activeSubscribers.get(channelId);
        if (!callbacks || callbacks.size === 0) return;

        const rawTimeline = this.timelineService.getTimeline(channelId);
        const sovereignMessages = rawTimeline.map((msg) => this.mapToSovereignMessage(msg));

        callbacks.forEach((cb) => {
            try {
                cb(sovereignMessages);
            } catch (e) {
                console.warn("[MatrixMessageService] Error in subscriber callback:", e);
            }
        });
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
