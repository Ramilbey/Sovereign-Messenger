/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * UnavailableMessage.tsx — CMP-23 Unavailable Message
 *
 * FR-35 / COM-6 / ST-40: a message that cannot be displayed is rendered as a
 * defined interface state, visually separate from message content, never as
 * message text.
 *
 * SUX-12: the explanation is in plain language, without cryptographic
 * terminology. The reader is told the message cannot be shown and why, in
 * terms that describe their situation rather than the system's.
 *
 * The message keeps its position in the timeline: the reader can see that
 * something was said here, which is the point — silently omitting it would
 * leave a gap nobody could notice (COM-8).
 */

import React, { memo, type JSX } from "react";

import { Icon } from "../ui";
import { CHAT_COPY } from "../../config/chatCopy";

interface UnavailableMessageProps {
    /** Shown so the reader knows who the unavailable message is from. */
    senderName?: string;
    timestamp: string;
}

export const UnavailableMessage = memo(function UnavailableMessage({
    senderName,
    timestamp,
}: UnavailableMessageProps): JSX.Element {
    return (
        <div className="svr-unavailable-message" role="note">
            <Icon name="lock" size="sm" className="svr-unavailable-message__icon" />

            <div className="svr-unavailable-message__text">
                <p className="svr-unavailable-message__title">{CHAT_COPY.messageUnavailable}</p>
                <p className="svr-unavailable-message__reason">
                    {CHAT_COPY.messageUnavailableReason}
                </p>
            </div>

            <span className="svr-unavailable-message__meta">
                {senderName ? `${senderName} · ` : ""}
                {timestamp}
            </span>
        </div>
    );
});
