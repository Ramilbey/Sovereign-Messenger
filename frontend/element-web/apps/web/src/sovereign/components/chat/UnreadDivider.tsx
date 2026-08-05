/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * UnreadDivider.tsx — CMP-27 Unread Divider
 *
 * FR-37: marks the boundary between read and unread messages on entering a
 * conversation, and persists there.
 *
 * "Persistent" is the whole point: the divider marks where the reader left
 * off, so it must not creep down the timeline as they read past it. The
 * position is captured once on entry (see useMessages) and this component only
 * draws it.
 *
 * States (CMP-27): visible, dismissed — dismissed being the absence of a read
 * boundary in the loaded range, when the caller renders nothing.
 */

import React, { memo, type JSX } from "react";

import { CHAT_COPY } from "../../config/chatCopy";

export const UnreadDivider = memo(function UnreadDivider(): JSX.Element {
    return (
        <div
            className="svr-unread-divider"
            /* A11Y-6: announced as a landmark in the timeline, not just a line. */
            role="separator"
            aria-label={CHAT_COPY.unreadDivider}
        >
            <span className="svr-unread-divider__label">{CHAT_COPY.unreadDivider}</span>
        </div>
    );
});
