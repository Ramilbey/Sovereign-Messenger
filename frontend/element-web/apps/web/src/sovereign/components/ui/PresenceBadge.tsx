/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * PresenceBadge.tsx — CMP-9 Presence Badge
 *
 * FR-12: Online, Away, Busy, Offline.
 * FR-16 / A11Y-5 / ST-10: availability is carried by shape and by an
 * accessible label as well as by colour — never colour alone, which a reader
 * with a colour vision deficiency could not distinguish.
 * ST-6: `connecting` reads distinctly from both online and offline.
 *
 * R-3: `unknown` means the deployment reports nothing for this person. It is
 * deliberately not folded into "offline" — saying a colleague is offline when
 * the server is simply silent asserts something no source supports (FR-1).
 */

import React, { memo, type JSX } from "react";

import { PRESENCE_COPY } from "../../config/presenceCopy";
import type { PresenceState } from "../../types/presence";
import "./ui.css";

interface PresenceBadgeProps {
    state: PresenceState;
    /** Renders the label beside the mark rather than only for assistive tech. */
    showLabel?: boolean;
}

export const PresenceBadge = memo(function PresenceBadge({
    state,
    showLabel = false,
}: PresenceBadgeProps): JSX.Element {
    return (
        <span className="svr-presence">
            {/*
             * FR-16: the mark differs in shape as well as colour — a filled
             * disc, a hollow ring, a bar, and a dashed outline are all
             * distinguishable without colour vision.
             */}
            <span className={`svr-presence__mark svr-presence__mark--${state}`} aria-hidden="true" />
            <span className={showLabel ? "svr-presence__label" : "svr-visually-hidden"}>
                {PRESENCE_COPY.state[state]}
            </span>
        </span>
    );
});
