/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * presence.ts — Availability Model
 *
 * FR-12: Online, Away, Busy, Offline.
 * ST-6: `connecting` is displayed distinctly from online and offline.
 * FR-16 / A11Y-5: every state carries a shape or label as well as colour, so
 * availability is never conveyed by colour alone.
 */

export type PresenceState = "online" | "away" | "busy" | "offline" | "connecting" | "unknown";

export interface SovereignPresence {
    userId: string;
    state: PresenceState;
    /** FR-14: last seen, where the platform reports it. Null when unknown. */
    lastActiveAt: number | null;
    /** A status message the person set themselves, where one exists. */
    statusMessage?: string;
}

/** ST-8: a manual selection overrides automatic detection until cleared. */
export const SELECTABLE_PRESENCE: ReadonlyArray<Extract<PresenceState, "online" | "away" | "busy">> = [
    "online",
    "away",
    "busy",
];
