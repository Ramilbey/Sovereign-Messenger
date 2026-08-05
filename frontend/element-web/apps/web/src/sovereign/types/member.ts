/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * member.ts — Conversation Membership Model
 *
 * FR-45 / COM-4: the participants of a conversation, with their names and
 * organisational roles.
 *
 * Presence is deliberately absent. FR-13 requires presence wherever a person
 * appears, and the presence capability is delivered in Milestone 4; showing a
 * placeholder availability here would assert something no source supports
 * (FR-1). The model gains presence when the capability does.
 */

/** Whether the person is still part of the conversation (EDGE-6). */
export type MemberStatus = "joined" | "invited" | "left";

export interface SovereignMember {
    id: string;
    displayName: string;
    /** Avatar source where the platform holds one; initials otherwise (PR-6). */
    avatarUrl?: string;
    status: MemberStatus;
    /**
     * GW-10 / FR-34: the person's official role, where a source exists.
     *
     * Absent for other people: identity data carries only the signed-in user's
     * own role (AS-1). The surface shows the name alone rather than asserting
     * a designation it cannot support.
     */
    role?: string;
    /** COM-2: whether this person may post in the conversation. */
    canPost: boolean;
}
