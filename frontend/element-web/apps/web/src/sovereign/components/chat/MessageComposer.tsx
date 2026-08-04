/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * MessageComposer.tsx — Presentation component for the message compose bar.
 *
 * Pure presentation — zero role, permission, or transport logic.
 * Controlled input handling text state and calling onSendMessage prop.
 */

import React, { memo, useState, useCallback, useEffect, type KeyboardEvent, type JSX } from "react";

import { DraftService } from "../../services/DraftService";

interface MessageComposerProps {
    onSendMessage: (text: string) => void;
    placeholder?: string;
    /**
     * Conversation this composer belongs to. Drafts are held per conversation
     * (FR-40), so switching away and back restores what was being written.
     */
    conversationId?: string;
}

export const MessageComposer = memo(function MessageComposer({
    onSendMessage,
    placeholder = "Xabar yozing...",
    conversationId,
}: MessageComposerProps): JSX.Element {
    const drafts = DraftService.getInstance();
    const [text, setText] = useState<string>(() => drafts.get(conversationId ?? ""));

    /*
     * FR-40 / NAV-10: restore this conversation's draft when the composer is
     * pointed at a different conversation.
     */
    useEffect(() => {
        setText(drafts.get(conversationId ?? ""));
    }, [conversationId, drafts]);

    /*
     * UX-9 / SUX-15: persist as the user types, so composed text survives
     * navigation, reload, connection loss, and session interruption.
     */
    const updateText = useCallback(
        (next: string) => {
            setText(next);
            if (conversationId) {
                drafts.set(conversationId, next);
            }
        },
        [conversationId, drafts],
    );

    const handleSend = useCallback(() => {
        const trimmed = text.trim();
        if (trimmed) {
            onSendMessage(trimmed);
            setText("");
            if (conversationId) {
                drafts.clear(conversationId);
            }
        }
    }, [text, onSendMessage, conversationId, drafts]);

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
                onChange={(e) => updateText(e.target.value)}
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
