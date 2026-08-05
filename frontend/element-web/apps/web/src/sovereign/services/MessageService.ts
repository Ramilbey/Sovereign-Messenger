/*
 * Sovereign Messenger — Sprint 1, Step 7.1
 * MessageService.ts — Transport service contract interface.
 *
 * Defines the domain model and service interface for chat transport operations.
 * Allows switching between DemoMessageService (Sprint 1) and MatrixMessageService (Sprint 2)
 * with zero changes to React hooks or UI components.
 */

/**
 * COM-5: the message states, defined once and represented consistently across
 * every conversation type. `delivered` and `read` require read receipts and
 * are reported once that capability exists — until then a message is never
 * shown as read on evidence the platform does not have.
 */
import type { MessageAttachment } from "../types/attachment";

export type MessageDeliveryState = "queued" | "sending" | "sent" | "delivered" | "read" | "failed";

export interface SovereignMessage {
    id: string;
    channelId: string;
    senderId: string;
    senderName: string;
    /**
     * GW-10 / FR-34: the sender's official role.
     *
     * Optional because no authoritative source exists for another person's
     * role (AS-1): identity data carries only the signed-in user's own. Where
     * it is absent the surface shows the name alone rather than asserting a
     * role it cannot support (FR-1).
     */
    senderRole?: string;
    content: string;
    /** Display clock time, in the user's local time (UX-14). */
    timestamp: string;
    /** Display day label, relative where appropriate (FR-33). */
    date: string;
    /**
     * Origin server time. COM-8 / EDGE-15: ordering and grouping follow this,
     * not local time. Absent for demonstration data, which carries no clock.
     */
    sentAt?: number;
    readState?: MessageDeliveryState;
    /**
     * FR-35 / CMP-23: the message exists but cannot be displayed. Rendered as
     * a defined interface state, never as message text (COM-6, SUX-12).
     */
    unavailable?: boolean;
    /** FR-26: the file this message carries, where it carries one. */
    attachment?: MessageAttachment;
}

export type TimelineCallback = (messages: SovereignMessage[]) => void;

export interface MessageService {
    /**
     * FR-36 / EDGE-2: loads one page of earlier messages. Resolves true when
     * more remain. A transport with no history to page returns false.
     */
    loadEarlier(channelId: string): Promise<boolean>;

    /** FR-36: whether earlier messages remain to be loaded. */
    hasEarlier(channelId: string): boolean;

    /**
     * FR-37 / CMP-27: the message the user has read up to, or null when the
     * position is unknown. The unread divider is drawn after it.
     */
    getReadUpToId(channelId: string): string | null;

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
