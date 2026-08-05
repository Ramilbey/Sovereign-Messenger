/*
 * Sovereign Messenger — Sprint 1, Step 7.2 · Sprint 3, Milestone 3
 * MessageBubble.tsx — CMP-21 Message Bubble
 *
 * FR-32: within a group of consecutive messages from one sender, only the
 * first carries the sender's identity.
 * FR-34: the sender's actual name, and their organisational role where a
 * source for it exists — never a default standing in for one (AS-1, FR-1).
 * COM-5: delivery state is shown with a text alternative, so it never rests on
 * a tick shape alone (A11Y-5).
 *
 * The speculative reply, reaction, and attachment props carried here since
 * Sprint 1 were never rendered by any call site. Reply previews (CMP-24) and
 * attachments (CMP-34, CMP-35) are specified for Milestone 4 and are built
 * then, against their real data.
 */

import React, { memo, type JSX } from "react";

import { Avatar, Icon, type IconName } from "../ui";
import { ACKNOWLEDGEMENT_COPY, CHAT_COPY } from "../../config/chatCopy";
import type { MessageDeliveryState, SovereignMessage } from "../../services/MessageService";

/** COM-5: every state carries an icon and a label, never shape alone. */
const STATE_PRESENTATION: Record<MessageDeliveryState, { icon: IconName; label: string }> = {
    queued: { icon: "refresh", label: CHAT_COPY.stateQueued },
    sending: { icon: "refresh", label: CHAT_COPY.stateSending },
    sent: { icon: "check", label: CHAT_COPY.stateSent },
    delivered: { icon: "check-double", label: CHAT_COPY.stateDelivered },
    read: { icon: "check-double", label: CHAT_COPY.stateRead },
    failed: { icon: "warning", label: CHAT_COPY.stateFailed },
};

export interface MessageBubbleProps {
    message: SovereignMessage;
    isOutgoing: boolean;
    /**
     * FR-32: false for the second and later messages of a group, which show
     * neither avatar nor sender identity.
     */
    showSender: boolean;
    /**
     * FR-19: opens the acknowledgement state of one of the reader's own
     * messages. Absent where the surface does not offer it.
     */
    onShowAcknowledgement?: (eventId: string) => void;
}

export const MessageBubble = memo(function MessageBubble({
    message,
    isOutgoing,
    showSender,
    onShowAcknowledgement,
}: MessageBubbleProps): JSX.Element {
    const state = message.readState ? STATE_PRESENTATION[message.readState] : null;

    return (
        <div
            className={[
                "svr-msg-wrapper",
                isOutgoing ? "svr-msg-wrapper--outgoing" : "svr-msg-wrapper--incoming",
                showSender ? "" : "svr-msg-wrapper--continuation",
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {/*
             * FR-32: the avatar appears once per group, and its space is held
             * for continuations so the message column does not shift (UX-13).
             */}
            {!isOutgoing && (
                <span className="svr-msg-avatar-slot">
                    {showSender && <Avatar name={message.senderName} id={message.senderId} size="md" />}
                </span>
            )}

            <div
                className={`svr-msg-bubble ${
                    isOutgoing ? "svr-msg-bubble--outgoing" : "svr-msg-bubble--incoming"
                }${message.readState === "failed" ? " is-failed" : ""}`}
            >
                {!isOutgoing && showSender && (
                    <div className="svr-msg-header">
                        <span className="svr-msg-sender-name">{message.senderName}</span>
                        {/* FR-34: shown only where the role is actually known. */}
                        {message.senderRole && (
                            <span className="svr-msg-sender-role">{message.senderRole}</span>
                        )}
                    </div>
                )}

                {/* EDGE-16: a very long message wraps rather than breaking the layout. */}
                <div className="svr-msg-content">{message.content}</div>

                <div className="svr-msg-footer">
                    <span className="svr-msg-timestamp">{message.timestamp}</span>

                    {isOutgoing && state && (
                        <span className="svr-msg-state">
                            <Icon name={state.icon} size="sm" label={state.label} />
                        </span>
                    )}

                    {/*
                     * FR-19 / GW-2: the issuer of a message can see who has
                     * read it. Offered only on the reader's own messages —
                     * who has read somebody else's is not theirs to inspect.
                     */}
                    {isOutgoing && onShowAcknowledgement && (
                        <button
                            type="button"
                            className="svr-msg-ack-button"
                            onClick={() => onShowAcknowledgement(message.id)}
                        >
                            {ACKNOWLEDGEMENT_COPY.open}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});
