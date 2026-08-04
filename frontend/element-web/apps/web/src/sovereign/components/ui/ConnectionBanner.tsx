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

import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Spinner";
import { ERROR_CATALOGUE } from "../../config/errorCatalogue";
import type { ConnectionState } from "../../services/ConnectionStateService";
import "./ui.css";

interface ConnectionBannerProps {
    state: ConnectionState;
}

interface BannerContent {
    tone: "warning" | "danger" | "success";
    icon: IconName | null;
    title: string;
    description?: string;
    /** Whether to show an indeterminate progress indicator. */
    busy: boolean;
}

function resolve(state: ConnectionState): BannerContent | null {
    switch (state) {
        case "reconnecting":
            return {
                tone: "warning",
                icon: null,
                title: ERROR_CATALOGUE.connectionLost.title,
                description: ERROR_CATALOGUE.connectionLost.description,
                busy: true,
            };
        case "disconnected":
            return {
                tone: "warning",
                icon: "warning",
                title: ERROR_CATALOGUE.connectionLost.title,
                description: ERROR_CATALOGUE.connectionLost.description,
                busy: false,
            };
        case "serverUnavailable":
            // SUX-7: distinct from local connectivity loss.
            return {
                tone: "danger",
                icon: "error",
                title: ERROR_CATALOGUE.homeserverUnavailable.title,
                description: ERROR_CATALOGUE.homeserverUnavailable.description,
                busy: false,
            };
        case "restored":
            return {
                tone: "success",
                icon: "check",
                title: "Ulanish tiklandi",
                busy: false,
            };
        case "connected":
        default:
            return null;
    }
}

export const ConnectionBanner = memo(function ConnectionBanner({
    state,
}: ConnectionBannerProps): JSX.Element | null {
    const content = resolve(state);
    if (!content) {
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
