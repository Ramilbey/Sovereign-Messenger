/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * MessageComposer.tsx — Presentation component for the message compose bar.
 *
 * Pure presentation — zero role, permission, or transport logic.
 * Controlled input handling text state and calling onSendMessage prop.
 */

import React, { memo, useState, useCallback, type KeyboardEvent, type JSX } from "react";

interface MessageComposerProps {
    onSendMessage: (text: string) => void;
    placeholder?: string;
}

export const MessageComposer = memo(function MessageComposer({
    onSendMessage,
    placeholder = "Xabar yozing...",
}: MessageComposerProps): JSX.Element {
    const [text, setText] = useState<string>("");

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (trimmed) {
            onSendMessage(trimmed);
            setText("");
        }
    }, [text, onSendMessage]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend]
    );

    return (
        <div className="svr-composer-bar">
            <input
                id="sovereign-msg-input"
                type="text"
                className="svr-composer-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
            />
            <button
                id="sovereign-msg-send-btn"
                type="button"
                className="svr-composer-send-btn"
                onClick={handleSend}
                disabled={!text.trim()}
                title="Yuborish"
            >
                ➔
            </button>
        </div>
    );
});
