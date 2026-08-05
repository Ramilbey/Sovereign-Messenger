/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * ConversationHeader.tsx — CMP-30 Conversation Header
 *
 * FR-44: name, type, participant count, and topic where defined.
 * IA-6: the type is a label, not an icon on its own.
 *
 * States (CMP-30): loading, ready, error — supplied by the caller, which knows
 * the state of the conversation surface.
 *
 * FR-48 (pinned messages): the header is where the affordance belongs, and it
 * arrives with pinned message retrieval. A control that opens nothing would
 * misrepresent an unavailable capability as an available one.
 */

import React, { memo, type JSX } from "react";

import { Avatar, Icon, Skeleton, type IconName } from "../ui";
import { CHAT_COPY } from "../../config/chatCopy";
import { CONVERSATION_TYPE_LABEL, type ConversationType } from "../../types/conversation";

const TYPE_ICON: Record<ConversationType, IconName> = {
    channel: "channel",
    group: "group",
    direct: "message",
};

interface ConversationHeaderProps {
    name: string;
    type: ConversationType;
    /** FR-44: null where the count is not known, never guessed. */
    memberCount: number | null;
    topic?: string;
    loading?: boolean;
}

export const ConversationHeader = memo(function ConversationHeader({
    name,
    type,
    memberCount,
    topic,
    loading = false,
}: ConversationHeaderProps): JSX.Element {
    if (loading) {
        // ES-6 / UX-13: the header reserves its height so the timeline below
        // does not jump once the conversation resolves.
        return (
            <header className="svr-conversation-header" aria-busy="true">
                <Skeleton shape="block" />
            </header>
        );
    }

    return (
        <header className="svr-conversation-header" aria-label={CHAT_COPY.headerLabel}>
            <Avatar name={name} size="md" />

            <div className="svr-conversation-header__text">
                <h2 className="svr-conversation-header__name">{name}</h2>

                <p className="svr-conversation-header__meta">
                    <Icon
                        name={TYPE_ICON[type]}
                        size="sm"
                        className="svr-conversation-header__type-icon"
                    />
                    {/* IA-6: the official designation, in words. */}
                    <span>{CONVERSATION_TYPE_LABEL[type]}</span>

                    {memberCount !== null && (
                        <>
                            <span aria-hidden="true">·</span>
                            <span>{CHAT_COPY.participants(memberCount)}</span>
                        </>
                    )}

                    {topic && (
                        <>
                            <span aria-hidden="true">·</span>
                            {/* EDGE-16: a long topic truncates rather than breaking the layout. */}
                            <span className="svr-conversation-header__topic" title={topic}>
                                {topic}
                            </span>
                        </>
                    )}
                </p>
            </div>
        </header>
    );
});
