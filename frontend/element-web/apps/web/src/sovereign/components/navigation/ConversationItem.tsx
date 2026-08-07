/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * ConversationItem.tsx — CMP-19 Conversation Item
 *
 * NAV-2: type indicator, name, last message preview, time of last activity,
 * unread count, and muted or favourite state.
 *
 * States (CMP-19): default, hover, active, unread, mention, muted, favourite,
 * draft. Every one of them carries an icon or a text label as well as colour,
 * so none depends on colour vision (A11Y-5).
 */

import React, { memo, type JSX } from "react";

import { Avatar, Badge, Icon, type IconName } from "../ui";
import { CONVERSATION_COPY } from "../../config/navigationCopy";
import { NOTIFICATION_COPY, NOTIFICATION_LEVEL_LABEL } from "../../config/notificationCopy";
import { countsTowardMentions, countsTowardUnread } from "../../types/notification";
import {
    CONVERSATION_TYPE_LABEL,
    type ConversationType,
    type SovereignConversation,
} from "../../types/conversation";
import { formatRelativeTime, formatAbsoluteTime } from "../../config/timeCopy";

/** IA-6: the icon supports the type label; it never carries the type alone. */
const TYPE_ICON: Record<ConversationType, IconName> = {
    channel: "channel",
    group: "group",
    direct: "message",
};

interface ConversationItemProps {
    conversation: SovereignConversation;
    isActive: boolean;
    /** CMP-19 draft state: unsent text is waiting in this conversation (FR-40). */
    hasDraft: boolean;
    onSelect: (conversationId: string) => void;
}

export const ConversationItem = memo(function ConversationItem({
    conversation,
    isActive,
    hasDraft,
    onSelect,
}: ConversationItemProps): JSX.Element {
    const typeLabel = CONVERSATION_TYPE_LABEL[conversation.type];

    /*
     * NT-6: a silenced conversation stays visible but is counted out, so its
     * unread total is not presented as something demanding attention.
     * NT-2: a mention stays distinct from an ordinary unread at every level.
     * NT-9: an urgent official message is shown through the silence.
     */
    const showUnread = conversation.unreadCount > 0 && countsTowardUnread(conversation);
    const showMention = conversation.mentionCount > 0 && countsTowardMentions(conversation);
    const isSilenced = conversation.notificationLevel !== "all";

    return (
        <li>
            <button
                type="button"
                id={`conversation-item-${conversation.id}`}
                className={[
                    "svr-conversation-item",
                    isActive ? "is-active" : "",
                    isSilenced ? "is-muted" : "",
                    showUnread || showMention ? "is-unread" : "",
                    conversation.hasUrgent ? "is-urgent" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onSelect(conversation.id)}
            >
                <Avatar name={conversation.name} id={conversation.id} size="md" />

                <span className="svr-conversation-item__body">
                    <span className="svr-conversation-item__line">
                        <Icon
                            name={TYPE_ICON[conversation.type]}
                            size="sm"
                            className="svr-conversation-item__type"
                        />
                        <span className="svr-conversation-item__name">{conversation.name}</span>

                        {/* IA-6: the type is stated, not left to the icon. */}
                        <span className="svr-visually-hidden">{` — ${typeLabel}`}</span>

                        {conversation.isFavourite && (
                            <Icon
                                name="star"
                                size="sm"
                                label={CONVERSATION_COPY.favouriteLabel}
                                className="svr-conversation-item__flag"
                            />
                        )}
                        {/* NT-5: which of the three levels is in force, in words. */}
                        {isSilenced && (
                            <Icon
                                name={conversation.notificationLevel === "none" ? "bell-off" : "bell"}
                                size="sm"
                                label={NOTIFICATION_LEVEL_LABEL[conversation.notificationLevel]}
                                className="svr-conversation-item__flag"
                            />
                        )}

                        {/* NT-9 / A11Y-5: urgency is stated, never colour alone. */}
                        {conversation.hasUrgent && (
                            <span className="svr-conversation-item__urgent">
                                {NOTIFICATION_COPY.urgentLabel}
                            </span>
                        )}

                        {conversation.lastActivityAt !== null && (
                            <time
                                className="svr-conversation-item__time"
                                dateTime={new Date(conversation.lastActivityAt).toISOString()}
                                /* UX-14: relative label, absolute value on hover. */
                                title={formatAbsoluteTime(conversation.lastActivityAt)}
                            >
                                {formatRelativeTime(conversation.lastActivityAt)}
                            </time>
                        )}
                    </span>

                    <span className="svr-conversation-item__line">
                        <span className="svr-conversation-item__preview">
                            {hasDraft ? (
                                <span className="svr-conversation-item__draft">
                                    {`${CONVERSATION_COPY.draftLabel}: `}
                                </span>
                            ) : null}
                            {conversation.preview
                                ? `${conversation.preview.senderName}: ${conversation.preview.body}`
                                : CONVERSATION_COPY.noPreview}
                        </span>

                        {showMention && (
                            <Badge
                                count={conversation.mentionCount}
                                tone="mention"
                                label={CONVERSATION_COPY.mentionLabel(conversation.mentionCount)}
                            />
                        )}
                        {showUnread && (
                            <Badge
                                count={conversation.unreadCount}
                                tone="unread"
                                label={CONVERSATION_COPY.unreadLabel(conversation.unreadCount)}
                            />
                        )}
                    </span>
                </span>
            </button>
        </li>
    );
});
