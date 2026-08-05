/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * connectionCopy.ts — Connection State Presentation
 *
 * SUX-16 requires connection state in one consistent location at all times;
 * SUX-5 requires a persistent banner while connectivity is lost. Two surfaces
 * therefore present the same state, and this table is what they share, so the
 * two can never disagree about what a state means or is called.
 *
 * NFR-4: no connection copy is embedded in a component.
 * A11Y-5: every state carries an icon and a text label, never colour alone.
 */

import type { IconName } from "../components/ui/Icon";
import type { ConnectionState } from "../services/ConnectionStateService";
import { ERROR_CATALOGUE } from "./errorCatalogue";

export type ConnectionTone = "neutral" | "warning" | "danger" | "success";

export interface ConnectionPresentation {
    tone: ConnectionTone;
    /** Null where an indeterminate progress indicator stands in for the icon. */
    icon: IconName | null;
    title: string;
    description?: string;
    /** Whether recovery is in progress and should be shown as such (ST-35). */
    busy: boolean;
    /** Whether the banner surfaces this state at all (CMP-45 hidden state). */
    banner: boolean;
}

export const CONNECTION_COPY: Record<ConnectionState, ConnectionPresentation> = {
    connected: {
        tone: "success",
        icon: "check",
        title: "Ulanish faol",
        busy: false,
        // ST-33: shown persistently in the header; the banner stays hidden so
        // a healthy connection never occupies the working area (ERR-20).
        banner: false,
    },
    reconnecting: {
        tone: "warning",
        icon: null,
        title: ERROR_CATALOGUE.connectionLost.title,
        description: ERROR_CATALOGUE.connectionLost.description,
        busy: true,
        banner: true,
    },
    disconnected: {
        tone: "warning",
        icon: "warning",
        title: ERROR_CATALOGUE.connectionLost.title,
        description: ERROR_CATALOGUE.connectionLost.description,
        busy: false,
        banner: true,
    },
    // SUX-7: server unavailability reads differently from local connectivity
    // loss, because the two imply different actions by the user.
    serverUnavailable: {
        tone: "danger",
        icon: "error",
        title: ERROR_CATALOGUE.homeserverUnavailable.title,
        description: ERROR_CATALOGUE.homeserverUnavailable.description,
        busy: false,
        banner: true,
    },
    restored: {
        tone: "success",
        icon: "check",
        title: "Ulanish tiklandi",
        busy: false,
        banner: true,
    },
};

/** Short label for the always-visible header indicator (SUX-16). */
export const CONNECTION_STATUS_LABEL = "Ulanish holati";
