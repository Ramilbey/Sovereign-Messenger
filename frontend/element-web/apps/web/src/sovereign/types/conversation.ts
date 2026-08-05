/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * conversation.ts — Conversation Domain Model
 *
 * IA-6 / COM-1: the platform has three conversation types, distinguishable by
 * structure and label rather than by icon alone. They were previously modelled
 * as two, with direct conversations folded into working groups, which made the
 * third type impossible to present correctly.
 */

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
     * synchronisation, not a locally derived tally. The unread model that
     * aggregates to module and organisation level, reconciles across tabs and
     * devices, and distinguishes every level (NT-1, NT-2, ST-21) is delivered
     * with the notification system; this is the per-conversation truth the
     * platform already provides.
     */
    unreadCount: number;
    /** NT-2: mentions, kept distinct from ordinary unread at every level. */
    mentionCount: number;
    /** FR-47 / IA-8: favourites sort above all other groupings. */
    isFavourite: boolean;
    /** FR-46 / NT-6: muted conversations stay listed but are counted out. */
    isMuted: boolean;
}
