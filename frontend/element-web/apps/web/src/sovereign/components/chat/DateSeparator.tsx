/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * DateSeparator.tsx — Presentation component for date section headers.
 *
 * Blueprint §6: Sticky/centered date divider pill.
 * Pure presentation — zero logic or state.
 */

import React, { memo, type JSX } from "react";

interface DateSeparatorProps {
    dateLabel: string;
}

export const DateSeparator = memo(function DateSeparator({
    dateLabel,
}: DateSeparatorProps): JSX.Element {
    return (
        <div className="svr-date-separator">
            <span className="svr-date-separator-pill">{dateLabel}</span>
        </div>
    );
});
