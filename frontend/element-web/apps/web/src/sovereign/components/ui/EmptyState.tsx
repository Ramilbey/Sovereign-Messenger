/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * EmptyState.tsx — CMP-51 Empty State
 *
 * Purpose: communicate that a surface has nothing to display.
 * States (UI-5): empty, unavailable.
 * Responsibility: ES-2 requires "empty" and "unavailable" to be visually and
 * textually distinct — empty means "nothing here yet", unavailable means "this
 * is not part of the current release" (FR-2). They are deliberately one
 * component with two variants so the distinction cannot be forgotten at a
 * call site. ES-4 asks empty states to offer the most relevant next action.
 *
 * FR-1 / ES-3: neither variant may be satisfied by presenting demonstration
 * data in Production Mode.
 */

import React, { memo, type JSX, type ReactNode } from "react";

import { Icon, type IconName } from "./Icon";
import "./ui.css";

export type EmptyStateVariant = "empty" | "unavailable";

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    /** Primary message, e.g. "Xabarlar yo'q". Supplied per §8.11. */
    title: string;
    /** Optional supporting sentence. */
    description?: string;
    /** Decorative illustration icon. */
    icon?: IconName;
    /** ES-4: the most relevant next action, where one exists. */
    action?: ReactNode;
    className?: string;
}

export const EmptyState = memo(function EmptyState({
    variant = "empty",
    title,
    description,
    icon,
    action,
    className,
}: EmptyStateProps): JSX.Element {
    const resolvedIcon: IconName = icon ?? (variant === "unavailable" ? "lock" : "info");

    return (
        <div
            className={["svr-state", `svr-state--${variant}`, className].filter(Boolean).join(" ")}
        >
            <span className="svr-state__icon" aria-hidden="true">
                <Icon name={resolvedIcon} size="lg" />
            </span>
            <p className="svr-state__title">{title}</p>
            {description && <p className="svr-state__description">{description}</p>}
            {action && <div className="svr-state__action">{action}</div>}
        </div>
    );
});
