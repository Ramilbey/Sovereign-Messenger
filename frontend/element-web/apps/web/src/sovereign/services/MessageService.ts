/*
 * Sovereign Messenger — Sprint 1, Step 7.1
 * MessageService.ts — Transport service contract interface.
 *
 * Defines the domain model and service interface for chat transport operations.
 * Allows switching between DemoMessageService (Sprint 1) and MatrixMessageService (Sprint 2)
 * with zero changes to React hooks or UI components.
 */

export interface SovereignMessage {
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    timestamp: string;
    date: string;
    readState?: "sent" | "delivered" | "read";
}

export type TimelineCallback = (messages: SovereignMessage[]) => void;

export interface MessageService {
    /** Fetch initial message list for a channel */
    getMessages(channelId: string): Promise<SovereignMessage[]>;

    /** Send a message to a channel */
    sendMessage(
        channelId: string,
        content: string,
        senderId: string,
        senderName: string,
        senderRole: string
    ): Promise<SovereignMessage>;

    /** Subscribe to real-time message updates for a channel */
    subscribeToTimeline(channelId: string, callback: TimelineCallback): () => void;
}
