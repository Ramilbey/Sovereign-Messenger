/*
 * Sovereign Messenger — Sprint 1, Step 7.1
 * DemoMessageService.ts — Sprint 1 In-Memory Demo Message Service.
 *
 * Implements MessageService interface using static demo dataset + in-memory state.
 */

import type { MessageService, SovereignMessage, TimelineCallback } from "./MessageService";
import initialMessagesData from "../demo/messages.json";

export class DemoMessageService implements MessageService {
    private messagesStore: Map<string, SovereignMessage[]>;
    private subscribers: Map<string, Set<TimelineCallback>>;

    constructor() {
        this.messagesStore = new Map();
        this.subscribers = new Map();

        // Initialize store from demo JSON
        const rawMessages = initialMessagesData.messages as SovereignMessage[];
        rawMessages.forEach((msg) => {
            const list = this.messagesStore.get(msg.channelId) || [];
            list.push(msg);
            this.messagesStore.set(msg.channelId, list);
        });
    }

    public async getMessages(channelId: string): Promise<SovereignMessage[]> {
        return this.messagesStore.get(channelId) || [];
    }

    public async sendMessage(
        channelId: string,
        content: string,
        senderId: string,
        senderName: string,
        senderRole: string
    ): Promise<SovereignMessage> {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        const newMessage: SovereignMessage = {
            id: `msg_demo_${Date.now()}`,
            channelId,
            senderId,
            senderName,
            senderRole,
            content,
            timestamp: `${hours}:${minutes}`,
            date: "Bugun",
            readState: "delivered",
        };

        const list = this.messagesStore.get(channelId) || [];
        const updatedList = [...list, newMessage];
        this.messagesStore.set(channelId, updatedList);

        // Notify active subscribers for this channel
        this.notifySubscribers(channelId, updatedList);

        return newMessage;
    }

    /*
     * The demonstration dataset is held in full in memory, so there is no
     * earlier page to fetch and no read position recorded. Demo Mode behaviour
     * is unchanged (ADR-004).
     */
    public async loadEarlier(): Promise<boolean> {
        return false;
    }

    public hasEarlier(): boolean {
        return false;
    }

    public getReadUpToId(): string | null {
        return null;
    }

    public subscribeToTimeline(channelId: string, callback: TimelineCallback): () => void {
        if (!this.subscribers.has(channelId)) {
            this.subscribers.set(channelId, new Set());
        }

        const channelSubs = this.subscribers.get(channelId)!;
        channelSubs.add(callback);

        // Immediately emit current messages for this channel
        callback(this.messagesStore.get(channelId) || []);

        // Return unsubscribe cleanup function
        return () => {
            channelSubs.delete(callback);
            if (channelSubs.size === 0) {
                this.subscribers.delete(channelId);
            }
        };
    }

    private notifySubscribers(channelId: string, messages: SovereignMessage[]): void {
        const channelSubs = this.subscribers.get(channelId);
        if (channelSubs) {
            channelSubs.forEach((callback) => callback(messages));
        }
    }
}
