/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Divider.tsx — CMP-8 Divider
 *
 * Purpose: visual separation, including labelled separators such as the date
 * separator in a conversation timeline (FR-33) and the unread boundary (FR-37).
 * States (UI-5): default, labelled.
 * Responsibility: a plain rule is decorative and hidden from assistive
 * technology; a labelled rule announces its label, because "Bugun" or
 * "Yangi xabarlar" is meaningful content rather than decoration.
 */

import React, { memo, type JSX } from "react";

import "./ui.css";

export type DividerTone = "default" | "emphasis";

interface DividerProps {
    /** Optional centred label. When present the divider becomes meaningful. */
    label?: string;
    tone?: DividerTone;
    className?: string;
}

export const Divider = memo(function Divider({
    label,
    tone = "default",
    className,
}: DividerProps): JSX.Element {
    if (!label) {
        return (
            <hr
                className={["svr-divider", `svr-divider--${tone}`, className].filter(Boolean).join(" ")}
            />
        );
    }

    return (
        <div
            className={[
                "svr-divider-labelled",
                `svr-divider-labelled--${tone}`,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            role="separator"
            aria-label={label}
        >
            <span className="svr-divider-labelled__rule" aria-hidden="true" />
            <span className="svr-divider-labelled__label">{label}</span>
            <span className="svr-divider-labelled__rule" aria-hidden="true" />
        </div>
    );
});
