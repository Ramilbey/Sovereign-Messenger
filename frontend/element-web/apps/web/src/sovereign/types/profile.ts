/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * profile.ts — Person Profile Model
 *
 * PR-1: full name, official role, department, organisational position,
 * presence, and last seen.
 *
 * PR-5 / AS-1: the organisation governs role, department, and position, and
 * only the signed-in user's own identity data carries them. For anyone else
 * they are absent — the profile shows what is known and says nothing about
 * what is not, rather than asserting a designation no source supports (FR-1).
 */

import type { SovereignPresence } from "./presence";

export interface SovereignProfile {
    userId: string;
    /** PR-1: as the person is named to the organisation. */
    displayName: string;
    avatarUrl?: string;
    /** PR-1 / PR-5: read-only, organisation-governed. Null where unknown. */
    role: string | null;
    department: string | null;
    /** PR-1: the position within the hierarchy. Null where unknown. */
    position: string | null;
    /** PR-1 / FR-13 / FR-14: availability and last seen. */
    presence: SovereignPresence;
    /** PR-4: a status message the person set themselves. */
    statusMessage: string | null;
    /** Whether this profile is the signed-in user's own (PR-4 editing). */
    isSelf: boolean;
}

/** PR-3: a conversation this person and the reader both belong to. */
export interface SharedConversation {
    id: string;
    name: string;
}

/** PR-3: a file exchanged in a conversation they share. */
export interface SharedFile {
    id: string;
    conversationId: string;
    eventId: string;
    name: string;
    sentAt: number;
}

/**
 * PR-8: a session the account has open.
 *
 * Read-only in Sprint 3. Ending a session is a security action with
 * consequences the PRD does not scope here, and a control that looked
 * available but was not would be worse than none.
 */
export interface SovereignDevice {
    id: string;
    displayName: string | null;
    lastSeenAt: number | null;
    /** Whether this is the session the user is reading from now. */
    isCurrent: boolean;
}
