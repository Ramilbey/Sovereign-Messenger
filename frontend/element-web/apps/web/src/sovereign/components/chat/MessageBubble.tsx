/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * MessageBubble.tsx — Pure presentation component for Telegram-style message bubbles.
 *
 * Blueprint §6 Visual Rules:
 *   - Canvas background: #0e1621
 *   - Incoming bubble:   #182533 (left aligned)
 *   - Outgoing bubble:   #2b5278 (right aligned)
 *   - Avatar initials, sender name/role, timestamp, read receipt ticks (✓ / ✓✓).
 *
 * Extensible for Matrix features: replyTo, reactions, attachments, isEdited.
 */

import React, { memo, type JSX } from "react";
import type { SovereignMessage } from "../../services/MessageService";

export interface MessageReaction {
    emoji: string;
    count: number;
    userReacted?: boolean;
}

export interface MessageAttachment {
    id: string;
    name: string;
    type: "file" | "image" | "voice";
    size?: string;
    url?: string;
}

export interface MessageBubbleProps {
    message: SovereignMessage;
    isOutgoing: boolean;
    avatarInitials?: string;
    /** Future Matrix extensibility props (optional, non-breaking) */
    replyToMessage?: SovereignMessage;
    reactions?: MessageReaction[];
    attachments?: MessageAttachment[];
    isEdited?: boolean;
    onReactionClick?: (emoji: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
    message,
    isOutgoing,
    avatarInitials = "??",
    replyToMessage,
    reactions,
    attachments,
    isEdited = false,
    onReactionClick,
}: MessageBubbleProps): JSX.Element {
    const bubbleClass = isOutgoing
        ? "svr-msg-bubble svr-msg-bubble-outgoing"
        : "svr-msg-bubble svr-msg-bubble-incoming";

    return (
        <div className={`svr-msg-wrapper ${isOutgoing ? "svr-msg-wrapper-outgoing" : "svr-msg-wrapper-incoming"}`}>
            {/* Avatar for incoming messages */}
            {!isOutgoing && (
                <div className="svr-msg-avatar" title={message.senderName}>
                    {avatarInitials}
                </div>
            )}

            <div className={bubbleClass}>
                {/* Header (Sender Name + Role for incoming) */}
                {!isOutgoing && (
                    <div className="svr-msg-header">
                        <span className="svr-msg-sender-name">{message.senderName}</span>
                        <span className="svr-msg-sender-role">({message.senderRole})</span>
                    </div>
                )}

                {/* Reply preview if present */}
                {replyToMessage && (
                    <div className="svr-msg-reply-preview">
                        <span className="svr-msg-reply-name">{replyToMessage.senderName}</span>
                        <span className="svr-msg-reply-text">{replyToMessage.content}</span>
                    </div>
                )}

                {/* Attachments if present */}
                {attachments && attachments.length > 0 && (
                    <div className="svr-msg-attachments">
                        {attachments.map((att) => (
                            <div key={att.id} className="svr-msg-attachment-item">
                                📎 {att.name} {att.size ? `(${att.size})` : ""}
                            </div>
                        ))}
                    </div>
                )}

                {/* Message Body */}
                <div className="svr-msg-content">
                    {message.content}
                    {isEdited && <span className="svr-msg-edited-tag"> (tahrirlangan)</span>}
                </div>

                {/* Footer (Timestamp + Read Ticks) */}
                <div className="svr-msg-footer">
                    <span className="svr-msg-timestamp">{message.timestamp}</span>
                    {isOutgoing && (
                        <span className="svr-msg-ticks" title={message.readState === "read" ? "O'qildi" : "Yetkazildi"}>
                            {message.readState === "read" ? "✓✓" : "✓"}
                        </span>
                    )}
                </div>

                {/* Reactions if present */}
                {reactions && reactions.length > 0 && (
                    <div className="svr-msg-reactions">
                        {reactions.map((r, i) => (
                            <button
                                key={i}
                                className={`svr-msg-reaction-btn ${r.userReacted ? "active" : ""}`}
                                onClick={() => onReactionClick?.(r.emoji)}
                            >
                                {r.emoji} {r.count}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
