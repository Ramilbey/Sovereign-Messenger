/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Badge.tsx — CMP-5 Badge
 *
 * Purpose: count or status marker.
 * States (UI-5): count, dot, mention, muted.
 * Responsibility: NT-2 requires a mention to remain distinguishable from an
 * ordinary unread at every level, and A11Y-5 forbids colour as the sole
 * carrier. A mention badge therefore also changes shape and carries a text
 * alternative, so it is distinguishable without colour vision.
 */

import React, { memo, type JSX } from "react";

import "./ui.css";

export type BadgeTone = "unread" | "mention" | "muted" | "neutral";

interface BadgeProps {
    /**
     * Numeric count. Omit for a dot badge (activity with no meaningful count).
     * Values above `max` are rendered as "max+".
     */
    count?: number;
    max?: number;
    tone?: BadgeTone;
    /**
     * Text alternative describing what the badge represents, e.g.
     * "3 o'qilmagan xabar". Required so the badge is not a bare number to
     * assistive technology (A11Y-5, A11Y-6).
     */
    label: string;
    className?: string;
}

export const Badge = memo(function Badge({
    count,
    max = 99,
    tone = "unread",
    label,
    className,
}: BadgeProps): JSX.Element | null {
    const isDot = count === undefined;

    // A zero count renders nothing — an empty badge is visual noise.
    if (!isDot && count <= 0) {
        return null;
    }

    const display = isDot ? "" : count > max ? `${max}+` : String(count);

    return (
        <span
            className={[
                "svr-badge",
                `svr-badge--${tone}`,
                isDot ? "svr-badge--dot" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            role="status"
            aria-label={label}
        >
            {/* The visible glyph is decorative; the accessible name carries meaning. */}
            <span aria-hidden="true">{display}</span>
        </span>
    );
});
