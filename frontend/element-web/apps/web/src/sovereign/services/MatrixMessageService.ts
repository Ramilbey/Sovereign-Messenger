/*
 * Sovereign Messenger — Sprint 1, Step 7.1
 * MatrixMessageService.ts — Sprint 2 Matrix SDK Service Skeleton.
 *
 * Implements MessageService interface for matrix-js-sdk.
 * Will be fully wired in Sprint 2 to handle Matrix Synapse rooms and timeline events.
 */

import type { MessageService, SovereignMessage, TimelineCallback } from "./MessageService";

export class MatrixMessageService implements MessageService {
    public async getMessages(_channelId: string): Promise<SovereignMessage[]> {
        // Sprint 2: matrixClient.getRoom(channelId).getLiveTimeline().getEvents()
        throw new Error("MatrixMessageService is not active in Sprint 1 (SOVEREIGN_MODE demo).");
    }

    public async sendMessage(
        _channelId: string,
        _content: string,
        _senderId: string,
        _senderName: string,
        _senderRole: string
    ): Promise<SovereignMessage> {
        // Sprint 2: matrixClient.sendTextMessage(channelId, content)
        throw new Error("MatrixMessageService is not active in Sprint 1 (SOVEREIGN_MODE demo).");
    }

    public subscribeToTimeline(_channelId: string, _callback: TimelineCallback): () => void {
        // Sprint 2: matrixClient.on(RoomEvent.Timeline, ...) listener registration
        return () => {};
    }
}
