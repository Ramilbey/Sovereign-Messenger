/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * notification.ts — Notification Domain Model
 *
 * NT-1: unread counts are displayed at conversation, module, and organisational
 * level and aggregate upward. The aggregation itself is arithmetic over the
 * conversations the interface already holds, so it lives here as pure functions
 * rather than in a service: no surface needs a subscription to add up numbers
 * it is already rendering.
 *
 * NT-2: a mention is never folded into the ordinary unread total at any level.
 */

import type { SovereignConversation } from "./conversation";

/**
 * NT-5 / FR-52: how much a conversation may interrupt.
 *
 * `all`      — every message notifies.
 * `mentions` — only a mention of this user notifies (NT-6: ordinary unread
 *              messages are excluded from the counts that demand attention).
 * `none`     — nothing notifies, mentions included.
 */
export type NotificationLevel = "all" | "mentions" | "none";

export const NOTIFICATION_LEVELS: readonly NotificationLevel[] = ["all", "mentions", "none"];

/** NT-1 / NT-2: what one level of the interface has waiting for the user. */
export interface UnreadSummary {
    /** Ordinary unread messages, mentions excluded. */
    unread: number;
    /** Mentions of this user, counted separately at every level (NT-2). */
    mentions: number;
}

/** Stable zero, so a surface with nothing waiting does not change identity. */
export const NO_UNREAD: UnreadSummary = { unread: 0, mentions: 0 };

/** NT-6: a conversation set to anything but `all` is counted out of the total. */
export function countsTowardUnread(conversation: SovereignConversation): boolean {
    return conversation.notificationLevel === "all";
}

/** NT-9: an urgent official message is counted even where the user muted. */
export function countsTowardMentions(conversation: SovereignConversation): boolean {
    return conversation.notificationLevel !== "none" || conversation.hasUrgent;
}

/**
 * NT-1: the total for a set of conversations.
 *
 * Every level uses this same function over a different set, which is what makes
 * a module total and the organisation total agree with the conversations they
 * are drawn from — they cannot be computed two different ways.
 */
export function summariseUnread(conversations: readonly SovereignConversation[]): UnreadSummary {
    let unread = 0;
    let mentions = 0;

    for (const conversation of conversations) {
        if (countsTowardUnread(conversation)) unread += conversation.unreadCount;
        if (countsTowardMentions(conversation)) mentions += conversation.mentionCount;
    }

    return unread === 0 && mentions === 0 ? NO_UNREAD : { unread, mentions };
}

export function hasUnread(summary: UnreadSummary): boolean {
    return summary.unread > 0 || summary.mentions > 0;
}

/** NT-3: what kind of activity brought an entry into the notification centre. */
export type NotificationKind = "mention" | "direct" | "channel";

/**
 * NT-3: one item in the notification centre.
 *
 * Identified by the event that produced it, which is what makes EDGE-5 hold:
 * the same message arriving by a second delivery path resolves to the same
 * entry rather than a second one.
 */
export interface NotificationEntry {
    /** The event this entry reports. Also the deduplication key (EDGE-5). */
    id: string;
    conversationId: string;
    conversationName: string;
    kind: NotificationKind;
    senderName: string;
    /** What was said, as the centre summarises it. */
    body: string;
    /** Origin server time — ordering follows the server, not the clock (EDGE-15). */
    sentAt: number;
    /** NT-9 / FR-53: elevated, and shown even where the conversation is muted. */
    isUrgent: boolean;
}
