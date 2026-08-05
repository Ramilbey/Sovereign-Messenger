/*
 * Sovereign Messenger — Sprint 1, Step 7.2 · Sprint 3, Milestone 3
 * TypingIndicator.tsx — CMP-26 Typing Indicator
 *
 * FR-9 / ES-6: the indicator occupies reserved layout space, so its appearance
 * and disappearance never shift the message timeline. It therefore always
 * renders — the hidden state is empty, not absent.
 *
 * Milestone 3 delivers the reserved space and the single and multiple forms.
 * The typing data itself is the real-time capability delivered in Milestone 4
 * (FR-6 … FR-8, FR-10, FR-11); until then no participant is ever reported as
 * typing, because no source says they are.
 */

import React, { memo, type JSX } from "react";

import { TYPING_COPY } from "../../config/chatCopy";

interface TypingIndicatorProps {
    /** Display names of participants currently composing (FR-7). */
    typingUsers?: string[];
}

export const TypingIndicator = memo(function TypingIndicator({
    typingUsers = [],
}: TypingIndicatorProps): JSX.Element {
    const isTyping = typingUsers.length > 0;

    return (
        <div
            className="svr-typing-indicator"
            /* A11Y-7: announced without interrupting the reader's current task. */
            role="status"
            aria-live="polite"
        >
            {isTyping && (
                <>
                    <span className="svr-typing-dots" aria-hidden="true">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                    </span>
                    <span className="svr-typing-text">
                        {/* FR-7: named when one person types, summarised when several do. */}
                        {typingUsers.length === 1
                            ? TYPING_COPY.single(typingUsers[0])
                            : TYPING_COPY.multiple(typingUsers.length)}
                    </span>
                </>
            )}
        </div>
    );
});
