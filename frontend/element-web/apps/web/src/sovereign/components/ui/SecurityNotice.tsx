/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * SecurityNotice.tsx — CMP-46 Security Notice
 *
 * Purpose: communicate a security-relevant situation.
 * States (CMP-46): informational, action-required.
 * Responsibility: SUX-14 requires notices that need user action to remain
 * accessible until resolved and NOT be dismissible into invisibility, while
 * informational notices may be dismissed. The distinction is enforced by the
 * component rather than left to each call site: `action-required` renders no
 * dismiss control at all.
 *
 * SUX-1: content is supplied from the error catalogue, so no protocol
 * terminology or internal identifier can reach the user.
 */

import React, { memo, type JSX } from "react";

import { Button } from "./Button";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import type { CatalogueEntry } from "../../config/errorCatalogue";
import "./ui.css";

export type SecurityNoticeSeverity = "informational" | "action-required";

interface SecurityNoticeProps {
    /** The situation, taken from the error catalogue (Appendix B). */
    notice: CatalogueEntry;
    severity?: SecurityNoticeSeverity;
    /** Invoked for a catalogue entry whose recovery is retry or navigate. */
    onAction?: () => void;
    /**
     * Dismiss handler. Ignored when severity is `action-required` — SUX-14
     * forbids dismissing a notice the user still has to resolve.
     */
    onDismiss?: () => void;
}

export const SecurityNotice = memo(function SecurityNotice({
    notice,
    severity = "informational",
    onAction,
    onDismiss,
}: SecurityNoticeProps): JSX.Element {
    const actionRequired = severity === "action-required";
    const recovery = notice.recovery;
    // ERR-19: an entry either offers an action or states why none exists.
    const actionLabel = recovery.kind === "none" ? null : recovery.label;
    const noActionReason = recovery.kind === "none" ? recovery.reason : null;

    return (
        <div
            className={`svr-security-notice svr-security-notice--${severity}`}
            /* Action-required notices interrupt; informational ones do not (A11Y-7). */
            role={actionRequired ? "alert" : "status"}
            aria-live={actionRequired ? "assertive" : "polite"}
        >
            <span className="svr-security-notice__icon" aria-hidden="true">
                <Icon name={actionRequired ? "lock" : "info"} size="md" />
            </span>

            <div className="svr-security-notice__body">
                <p className="svr-security-notice__title">{notice.title}</p>
                {notice.description && (
                    <p className="svr-security-notice__description">{notice.description}</p>
                )}
                {noActionReason && (
                    <p className="svr-security-notice__description">{noActionReason}</p>
                )}
            </div>

            {actionLabel && onAction && (
                <div className="svr-security-notice__action">
                    <Button
                        variant={actionRequired ? "primary" : "secondary"}
                        size="sm"
                        onClick={onAction}
                    >
                        {actionLabel}
                    </Button>
                </div>
            )}

            {/* SUX-14: no dismiss control exists when action is required. */}
            {!actionRequired && onDismiss && (
                <IconButton icon="close" label="Yopish" size="sm" onClick={onDismiss} />
            )}
        </div>
    );
});
