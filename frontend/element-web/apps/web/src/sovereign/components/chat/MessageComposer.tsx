/*
 * Sovereign Messenger — Sprint 1, Step 7.2 · Sprint 3, Milestone 3
 * MessageComposer.tsx — CMP-28 Composer
 *
 * FR-39: multi-line input with a defined send action and a defined newline
 * action, both stated to the user rather than left to be discovered.
 * FR-40 / UX-9: unsent text is held per conversation and restored on return.
 *
 * Pure presentation — no role, permission, or transport logic. Whether the
 * composer appears at all is decided above it (COM-2, UX-8).
 */

import React, {
    memo,
    useState,
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    type KeyboardEvent,
    type JSX,
} from "react";

import { IconButton } from "../ui";
import { CHAT_COPY } from "../../config/chatCopy";
import { DraftService } from "../../services/DraftService";

/** Rows the composer grows to before it scrolls internally (FR-39). */
const MAX_ROWS = 6;

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
    placeholder = CHAT_COPY.composerPlaceholder,
    conversationId,
}: MessageComposerProps): JSX.Element {
    const drafts = DraftService.getInstance();
    const [text, setText] = useState<string>(() => drafts.get(conversationId ?? ""));
    const inputRef = useRef<HTMLTextAreaElement | null>(null);

    /*
     * FR-40 / NAV-10: restore this conversation's draft when the composer is
     * pointed at a different conversation.
     */
    useEffect(() => {
        setText(drafts.get(conversationId ?? ""));
    }, [conversationId, drafts]);

    /*
     * FR-39 / UX-13: the field grows with its content up to a bound, so a long
     * message stays visible while composing without the surrounding layout
     * shifting unpredictably.
     */
    useLayoutEffect(() => {
        const element = inputRef.current;
        if (!element) return;

        element.style.height = "auto";

        const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 0;
        const maxHeight = lineHeight * MAX_ROWS;
        element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
        element.style.overflowY = element.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [text]);

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
        if (!trimmed) return;

        onSendMessage(trimmed);
        setText("");
        if (conversationId) {
            drafts.clear(conversationId);
        }
    }, [text, onSendMessage, conversationId, drafts]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLTextAreaElement>) => {
            // FR-39: Enter sends, Shift+Enter inserts a newline.
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    return (
        <div className="svr-composer">
            <div className="svr-composer__bar">
                <textarea
                    id="sovereign-msg-input"
                    ref={inputRef}
                    className="svr-composer__input"
                    value={text}
                    rows={1}
                    onChange={(e) => updateText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    aria-label={CHAT_COPY.composerLabel}
                    aria-describedby="sovereign-msg-hint"
                    autoComplete="off"
                />

                <IconButton
                    id="sovereign-msg-send-btn"
                    icon="send"
                    label={CHAT_COPY.send}
                    variant="solid"
                    onClick={handleSend}
                    disabled={!text.trim()}
                />
            </div>

            {/* FR-39: the send and newline actions are stated, not discovered. */}
            <p id="sovereign-msg-hint" className="svr-composer__hint">
                {CHAT_COPY.sendHint}
            </p>
        </div>
    );
});
