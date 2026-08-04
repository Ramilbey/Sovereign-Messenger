/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * ErrorState.tsx — CMP-52 Error State
 *
 * Purpose: communicate that a surface failed to load or act.
 * States (UI-5): default.
 * Responsibility: ES-5 requires every error state to offer an explicit retry,
 * and ERR-19 requires every error to offer a retry, a navigation action, or an
 * explicit statement that no action is available. `onRetry` is therefore
 * optional but, when omitted, the caller must say why via `noActionReason`.
 *
 * UX-7 / SUX-1 / NFR-8: the message states what happened and what to do next,
 * in plain Uzbek. No protocol terminology, error codes, or internal
 * identifiers may be passed into this component.
 */

import React, { memo, type JSX } from "react";

import { Button } from "./Button";
import { Icon } from "./Icon";
import "./ui.css";

interface ErrorStateProps {
    /** Plain-language description of what happened, e.g. "Xabarlarni yuklab bo'lmadi". */
    title: string;
    /** Optional supporting sentence explaining what the user can do. */
    description?: string;
    /** ES-5: explicit retry. */
    onRetry?: () => void;
    /** Label for the retry control. Defaults to "Qayta urinish". */
    retryLabel?: string;
    /**
     * ERR-19: when no retry is possible, state why. Required in that case so an
     * error is never presented as a dead end.
     */
    noActionReason?: string;
    className?: string;
}

export const ErrorState = memo(function ErrorState({
    title,
    description,
    onRetry,
    retryLabel = "Qayta urinish",
    noActionReason,
    className,
}: ErrorStateProps): JSX.Element {
    return (
        <div
            className={["svr-state", "svr-state--error", className].filter(Boolean).join(" ")}
            role="alert"
        >
            <span className="svr-state__icon" aria-hidden="true">
                <Icon name="warning" size="lg" />
            </span>
            <p className="svr-state__title">{title}</p>
            {description && <p className="svr-state__description">{description}</p>}

            {onRetry ? (
                <div className="svr-state__action">
                    <Button variant="secondary" size="sm" icon="refresh" onClick={onRetry}>
                        {retryLabel}
                    </Button>
                </div>
            ) : (
                noActionReason && <p className="svr-state__description">{noActionReason}</p>
            )}
        </div>
    );
});
