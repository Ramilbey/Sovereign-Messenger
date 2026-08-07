/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * conversation.ts — Conversation Domain Model
 *
 * IA-6 / COM-1: the platform has three conversation types, distinguishable by
 * structure and label rather than by icon alone. They were previously modelled
 * as two, with direct conversations folded into working groups, which made the
 * third type impossible to present correctly.
 */

import type { NotificationLevel } from "./notification";

/** §12.2 Plane 2 — who the user is speaking with. */
export type ConversationType = "channel" | "group" | "direct";

/** Official designations for the three types (GW-11, IA-6). */
export const CONVERSATION_TYPE_LABEL: Record<ConversationType, string> = {
    channel: "Rasmiy kanal",
    group: "Ishchi guruh",
    direct: "Shaxsiy suhbat",
};

/** The last thing said, as the conversation list summarises it (NAV-2). */
export interface ConversationPreview {
    senderName: string;
    body: string;
}

export interface SovereignConversation {
    id: string;
    name: string;
    type: ConversationType;
    /** FR-44: shown in the conversation header where defined. */
    topic?: string;
    /** FR-44: null where the count is not yet known, never guessed. */
    memberCount: number | null;
    /** COM-2: whether posting here is restricted to leadership. */
    readOnlyForEmployees: boolean;
    /** IA-7: ordering within a type. Null where no activity is known. */
    lastActivityAt: number | null;
    /** NAV-2: last message preview. Null where none is available. */
    preview: ConversationPreview | null;
    /**
     * NT-1: unread messages as the server counts them.
     *
     * This is the authoritative per-conversation count carried on
     * synchronisation, not a locally derived tally — a local tally could not
     * agree with another tab or another device (NT-8, EDGE-9, EDGE-10). The
     * aggregation to module and organisation level is arithmetic over this
     * number (see `summariseUnread`), so every level is drawn from the same
     * truth the platform reports.
     */
    unreadCount: number;
    /** NT-2: mentions, kept distinct from ordinary unread at every level. */
    mentionCount: number;
    /** FR-47 / IA-8: favourites sort above all other groupings. */
    isFavourite: boolean;
    /** NT-5 / FR-52 / NT-6: how much this conversation may interrupt. */
    notificationLevel: NotificationLevel;
    /** NT-9 / FR-53: an unread urgent official message is waiting here. */
    hasUrgent: boolean;
}
