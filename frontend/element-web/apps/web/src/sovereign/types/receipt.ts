/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * receipt.ts — Read Receipt Model
 *
 * FR-18 … FR-21, GW-2, GW-3, CMP-31.
 */

/** One recipient's position relative to a message. */
export interface MessageReader {
    userId: string;
    displayName: string;
    /** When their read position reached the message, where reported. */
    readAt: number | null;
}

/**
 * FR-19 / FR-20 / GW-2 / GW-3: the acknowledgement state of one message,
 * suitable for a department head reporting to leadership.
 */
export interface AcknowledgementSummary {
    /** Recipients the message was addressed to, excluding its sender. */
    totalRecipients: number;
    /** Those whose read position has reached it. */
    readers: MessageReader[];
    /** FR-20: those it is still waiting on, named. */
    pending: MessageReader[];
}
