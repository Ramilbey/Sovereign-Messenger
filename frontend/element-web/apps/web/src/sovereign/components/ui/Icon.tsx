/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Icon.tsx — Institutional Icon System
 *
 * Implements PRD TOK-10 … TOK-13 and A11Y-8.
 *
 * TOK-10: One icon set, consistent 24x24 grid and stroke weight.
 * TOK-11: Provided at defined sizes (16 / 20 / 24) and inherits content colour.
 * TOK-12: Every icon conveying meaning carries a text alternative.
 * TOK-13: Emoji are not used as interface iconography.
 *
 * Icons are inline vector definitions rather than an external icon package:
 * NFR-5 requires the platform to make zero external requests on an
 * air-gapped network, so no icon font or CDN asset may be referenced.
 */

import React, { memo, type JSX } from "react";

import "./ui.css";

/** Icon identifiers available to the product. Extended as milestones require. */
export type IconName =
    | "search"
    | "close"
    | "check"
    | "check-double"
    | "chevron-right"
    | "chevron-down"
    | "chevron-left"
    | "attachment"
    | "send"
    | "download"
    | "document"
    | "image"
    | "channel"
    | "group"
    | "person"
    | "people"
    | "pin"
    | "star"
    | "bell"
    | "bell-off"
    | "settings"
    | "warning"
    | "error"
    | "info"
    | "lock"
    | "refresh"
    | "more"
    | "calendar"
    | "folder"
    | "task";

export type IconSize = "sm" | "md" | "lg";

interface IconProps {
    /** Which icon to render. */
    name: IconName;
    /** Rendered size. Defaults to medium (20px). */
    size?: IconSize;
    /**
     * Text alternative (TOK-12, A11Y-8). Provide when the icon carries meaning
     * on its own. Omit when the icon sits beside a visible text label, in which
     * case the icon is marked decorative and hidden from assistive technology.
     */
    label?: string;
    className?: string;
}

/*
 * Path geometry. All paths are authored on a 24x24 grid with a consistent
 * stroke weight so optical size stays uniform across the set (TOK-10).
 */
const ICON_PATHS: Record<IconName, string> = {
    "search": "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4.2-4.2",
    "close": "M6 6l12 12M18 6L6 18",
    "check": "M4 12.5l5 5L20 6.5",
    "check-double": "M2 12.5l4.5 4.5L15 8.5M11 15l2 2L22 8",
    "chevron-right": "M9 5l7 7-7 7",
    "chevron-down": "M5 9l7 7 7-7",
    "chevron-left": "M15 5l-7 7 7 7",
    "attachment": "M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l8-8",
    "send": "M21 3L3 10.5l7 3 3 7L21 3z",
    "download": "M12 3v12M7 11l5 5 5-5M4 20h16",
    "document": "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5",
    "image": "M4 5h16v14H4zM4 15l4.5-4.5 4 4L16 11l4 4",
    "channel": "M4 9v6h4l6 4V5L8 9H4zM18 8a5 5 0 0 1 0 8",
    "group": "M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z",
    "person": "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21v-1a7 7 0 0 1 14 0v1",
    "people": "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 21v-1a7 7 0 0 1 14 0v1M17 5.5a3.5 3.5 0 0 1 0 7M18 21v-1a6 6 0 0 0-2-4.5",
    "pin": "M9 3h6l-1 6 4 4H6l4-4-1-6zM12 13v8",
    "star": "M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9L12 3.5z",
    "bell": "M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7M10.5 20a2 2 0 0 0 3 0",
    "bell-off": "M18 9a6 6 0 0 0-8.5-5.5M6.2 6.2A6 6 0 0 0 6 9c0 6-2 7-2 7h13M10.5 20a2 2 0 0 0 3 0M3 3l18 18",
    "settings": "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1.2z",
    "warning": "M12 4l9 16H3l9-16zM12 10v4M12 17.5v.5",
    "error": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5M12 16v.5",
    "info": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.5V8",
    "lock": "M6 11h12v9H6v-9zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
    "refresh": "M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5",
    "more": "M12 6.5v.01M12 12v.01M12 17.5v.01",
    "calendar": "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
    "folder": "M3 6h6l2 2.5h10V19H3V6z",
    "task": "M9 5h10M9 12h10M9 19h10M4 5l1.5 1.5L8 4M4 12l1.5 1.5L8 11M4 19l1.5 1.5L8 18",
};

/** Icons drawn as filled shapes rather than strokes. */
const FILLED_ICONS: ReadonlySet<IconName> = new Set<IconName>(["star", "pin", "send"]);

export const Icon = memo(function Icon({
    name,
    size = "md",
    label,
    className,
}: IconProps): JSX.Element {
    const isDecorative = !label;
    const filled = FILLED_ICONS.has(name);

    return (
        <svg
            className={["svr-icon", `svr-icon--${size}`, className].filter(Boolean).join(" ")}
            viewBox="0 0 24 24"
            fill={filled ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="var(--svr-icon-stroke)"
            strokeLinecap="round"
            strokeLinejoin="round"
            /* TOK-12 / A11Y-8: meaningful icons are labelled, decorative icons are hidden */
            role={isDecorative ? undefined : "img"}
            aria-hidden={isDecorative ? true : undefined}
            aria-label={label}
            focusable="false"
        >
            <path d={ICON_PATHS[name]} />
        </svg>
    );
});
