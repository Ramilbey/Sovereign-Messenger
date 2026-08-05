/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * ConnectionBanner.tsx — CMP-45 Connection Banner
 *
 * Purpose: communicate connection state.
 * States (CMP-45): hidden, disconnected, reconnecting, restored.
 * Responsibility: SUX-5 requires a persistent, NON-BLOCKING indication —
 * previously loaded content stays readable and recovery is automatic, so the
 * banner never traps the user or demands an action it cannot resolve.
 *
 * SUX-7: server unavailability is presented distinctly from local
 * connectivity loss, because the two imply different user actions.
 * SUX-16: connection state is shown in one consistent location.
 * A11Y-5: each state carries an icon and text, never colour alone.
 */

import React, { memo, type JSX } from "react";

import { Icon } from "./Icon";
import { Spinner } from "./Spinner";
import { CONNECTION_COPY } from "../../config/connectionCopy";
import type { ConnectionState } from "../../services/ConnectionStateService";
import "./ui.css";

interface ConnectionBannerProps {
    state: ConnectionState;
}

export const ConnectionBanner = memo(function ConnectionBanner({
    state,
}: ConnectionBannerProps): JSX.Element | null {
    const content = CONNECTION_COPY[state];

    // CMP-45 hidden state: a healthy connection is reported by the header
    // indicator (SUX-16) and does not occupy the working area (ERR-20).
    if (!content?.banner) {
        return null;
    }

    return (
        <div
            className={`svr-connection-banner svr-connection-banner--${content.tone}`}
            /*
             * Announced politely: the user is informed without having their
             * current task interrupted (A11Y-7).
             */
            role="status"
            aria-live="polite"
        >
            <span className="svr-connection-banner__indicator" aria-hidden="true">
                {content.busy ? <Spinner size="sm" /> : content.icon && <Icon name={content.icon} size="sm" />}
            </span>
            <span className="svr-connection-banner__title">{content.title}</span>
            {content.description && (
                <span className="svr-connection-banner__description">{content.description}</span>
            )}
        </div>
    );
});
