/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * ConnectionStatus.tsx — Persistent Connection Indicator (part of CMP-18)
 *
 * SUX-16 / ST-33: connection state is visible at all times in one consistent
 * location. The banner (CMP-45) appears only when connectivity is lost; this
 * indicator is always present, so the user can answer "am I connected?"
 * without waiting for something to go wrong.
 *
 * A11Y-5: state is carried by icon and text label together, never by colour.
 */

import React, { memo, type JSX } from "react";

import { Icon } from "./Icon";
import { Spinner } from "./Spinner";
import { CONNECTION_COPY, CONNECTION_STATUS_LABEL } from "../../config/connectionCopy";
import type { ConnectionState } from "../../services/ConnectionStateService";
import "./ui.css";

interface ConnectionStatusProps {
    state: ConnectionState;
    /**
     * Hides the text label, leaving icon and accessible name. Used where the
     * frame is too narrow for the label (UI-16).
     */
    compact?: boolean;
}

export const ConnectionStatus = memo(function ConnectionStatus({
    state,
    compact = false,
}: ConnectionStatusProps): JSX.Element {
    const content = CONNECTION_COPY[state];

    return (
        <div
            className={`svr-connection-status svr-connection-status--${content.tone}`}
            /*
             * A11Y-7: state changes are announced without interrupting the
             * user's current task.
             */
            role="status"
            aria-live="polite"
            aria-label={`${CONNECTION_STATUS_LABEL}: ${content.title}`}
        >
            <span className="svr-connection-status__indicator" aria-hidden="true">
                {content.busy ? <Spinner size="sm" /> : content.icon && <Icon name={content.icon} size="sm" />}
            </span>
            <span className={compact ? "svr-visually-hidden" : "svr-connection-status__label"}>
                {content.title}
            </span>
        </div>
    );
});
