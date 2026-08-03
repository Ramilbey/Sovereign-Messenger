/*
 * Sovereign Messenger — Sprint 2, Phase 6.2
 * MatrixMessageService.ts — Matrix Timeline MessageService Provider Implementation.
 *
 * Architecture:
 * UI -> Context -> Provider -> MatrixTimelineService -> MatrixClientService -> Matrix SDK
 */

import type { MessageService, SovereignMessage, TimelineCallback } from "./MessageService";
import { MatrixTimelineService } from "./MatrixTimelineService";

export class MatrixMessageService implements MessageService {
    private timelineService: MatrixTimelineService;

    constructor() {
        this.timelineService = MatrixTimelineService.getInstance();
    }

    public async getMessages(channelId: string): Promise<SovereignMessage[]> {
        if (!channelId) {
            return [];
        }

        const timeline = this.timelineService.getTimeline(channelId);
        return timeline.map((msg) => this.mapToSovereignMessage(msg));
    }

    public async sendMessage(
        _channelId: string,
        _content: string,
        _senderId: string,
        _senderName: string,
        _senderRole: string
    ): Promise<SovereignMessage> {
        // Message sending integration is deferred to Phase 6.3
        throw new Error("[MatrixMessageService] Message sending is deferred to Phase 6.3.");
    }

    public subscribeToTimeline(channelId: string, callback: TimelineCallback): () => void {
        if (!channelId) {
            callback([]);
            return () => {};
        }

        // Fetch initial timeline messages
        const initialMessages = this.timelineService.getTimeline(channelId);
        callback(initialMessages.map((msg) => this.mapToSovereignMessage(msg)));

        // Unsubscribe handle
        return () => {};
    }

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
