/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Avatar.tsx — CMP-4 Avatar
 *
 * Purpose: person or conversation identity.
 * States (UI-5): image, initials fallback, sizes.
 * Responsibility: deterministic initials fallback (PR-6) — the same person
 * always produces the same initials and the same background, so identity stays
 * visually stable across every surface.
 */

import React, { memo, useState, type JSX } from "react";

import "./ui.css";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
    /** Display name used to derive initials and the fallback tint. */
    name: string;
    /** Stable identifier used to derive the fallback tint. Falls back to `name`. */
    id?: string;
    /** Image source. When absent or failing to load, initials are shown. */
    src?: string;
    size?: AvatarSize;
    /**
     * Avatars normally sit beside a visible name, in which case they are
     * decorative. Set this when the avatar stands alone.
     */
    standalone?: boolean;
    className?: string;
}

/** Number of fallback tints available. Kept in step with ui.css. */
const TINT_COUNT = 6;

/**
 * PR-6: deterministic initials. Uses the first letters of the first two words,
 * falling back to the first two characters of a single word.
 */
function deriveInitials(name: string): string {
    const cleaned = name.replace(/^@/, "").replace(/:.*$/, "").trim();
    if (!cleaned) return "??";

    const words = cleaned.split(/[\s._-]+/).filter(Boolean);
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
}

/** PR-6: deterministic tint so a given identity always renders the same colour. */
function deriveTint(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % TINT_COUNT;
}

export const Avatar = memo(function Avatar({
    name,
    id,
    src,
    size = "md",
    standalone = false,
    className,
}: AvatarProps): JSX.Element {
    const [failed, setFailed] = useState(false);
    const showImage = Boolean(src) && !failed;
    const initials = deriveInitials(name);
    const tint = deriveTint(id || name);

    return (
        <span
            className={[
                "svr-avatar",
                `svr-avatar--${size}`,
                showImage ? "" : `svr-avatar--tint-${tint}`,
                className,
            ]
                .filter(Boolean)
                .join(" ")}
            role={standalone ? "img" : undefined}
            aria-label={standalone ? name : undefined}
            aria-hidden={standalone ? undefined : true}
        >
            {showImage ? (
                <img
                    className="svr-avatar__image"
                    src={src}
                    alt=""
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className="svr-avatar__initials">{initials}</span>
            )}
        </span>
    );
});
