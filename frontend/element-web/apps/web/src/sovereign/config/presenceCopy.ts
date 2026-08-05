/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * presenceCopy.ts — Availability Copy
 *
 * NFR-4: no availability text is embedded in a component.
 * FR-16: every state has a text label, so it is never carried by colour alone.
 */

import type { PresenceState } from "../types/presence";

export const PRESENCE_COPY: {
    state: Record<PresenceState, string>;
    lastSeen: (when: string) => string;
    manualLabel: string;
    manualAuto: string;
} = {
    state: {
        online: "Tarmoqda",
        away: "Joyida yo'q",
        busy: "Band",
        offline: "Oflayn",
        connecting: "Ulanmoqda",
        // R-3: the deployment reports nothing for this person. Deliberately
        // distinct from offline, which is a claim the platform has made.
        unknown: "Holati noma'lum",
    },
    /** FR-14: last seen, where the platform reports it. */
    lastSeen: (when: string): string => `Oxirgi faollik: ${when}`,
    manualLabel: "Holatim",
    manualAuto: "Avtomatik",
};
