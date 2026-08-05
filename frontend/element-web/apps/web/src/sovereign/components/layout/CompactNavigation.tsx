/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * CompactNavigation.tsx — Compact Surface Switcher
 *
 * UI-16: at the compact breakpoint the interface presents one surface at a
 * time with explicit navigation between them. This is that navigation — the
 * surfaces are not hidden behind a gesture or an edge swipe, because a user
 * on a shared field device has no way to discover one.
 *
 * UI-17: each target is a full control-height row, above the 44px minimum.
 * A11Y-6: the current surface is stated, not only highlighted.
 */

import React, { memo, type JSX } from "react";

import { Icon, type IconName } from "../ui";
import { FRAME_COPY } from "../../config/navigationCopy";

/** The surfaces a compact frame switches between. */
export type CompactSurface = "organisation" | "conversations" | "conversation" | "workspace";

const SURFACES: ReadonlyArray<{ id: CompactSurface; icon: IconName; label: string }> = [
    { id: "organisation", icon: "building", label: FRAME_COPY.compactOrganisation },
    { id: "conversations", icon: "message", label: FRAME_COPY.compactConversations },
    { id: "conversation", icon: "channel", label: FRAME_COPY.compactConversation },
    { id: "workspace", icon: "briefcase", label: FRAME_COPY.compactWorkspace },
];

interface CompactNavigationProps {
    active: CompactSurface;
    onSelect: (surface: CompactSurface) => void;
}

export const CompactNavigation = memo(function CompactNavigation({
    active,
    onSelect,
}: CompactNavigationProps): JSX.Element {
    return (
        <nav className="svr-compact-nav" aria-label={FRAME_COPY.compactNavLabel}>
            {SURFACES.map((surface) => {
                const isActive = surface.id === active;

                return (
                    <button
                        key={surface.id}
                        type="button"
                        className={`svr-compact-nav__item${isActive ? " is-active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => onSelect(surface.id)}
                    >
                        <Icon name={surface.icon} size="md" />
                        <span className="svr-compact-nav__label">{surface.label}</span>
                    </button>
                );
            })}
        </nav>
    );
});
