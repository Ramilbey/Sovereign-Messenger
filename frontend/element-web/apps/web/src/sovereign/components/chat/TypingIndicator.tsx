/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * TypingIndicator.tsx — Presentation component for active typing state.
 *
 * Displays subtle Telegram-style "xodim yozmoqda..." animation.
 */

import React, { memo, type JSX } from "react";

interface TypingIndicatorProps {
    typingUsers?: string[];
}

export const TypingIndicator = memo(function TypingIndicator({
    typingUsers = [],
}: TypingIndicatorProps): JSX.Element | null {
    if (typingUsers.length === 0) return null;

    const namesText = typingUsers.join(", ");

    return (
        <div className="svr-typing-indicator">
            <span className="svr-typing-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
            </span>
            <span className="svr-typing-text">{namesText} yozmoqda...</span>
        </div>
    );
});
