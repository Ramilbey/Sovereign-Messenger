/*
 * Sovereign Messenger — Sprint 1, Step 7.2 · Sprint 3, Milestone 3
 * ChatArea.tsx — Conversation Surface Composition Root
 *
 * Assembles the conversation header (CMP-30), timeline, typing indicator, and
 * either the composer (CMP-28) or the permission notice (CMP-29). It holds no
 * presentation of its own: each part is a component that can be reviewed,
 * restyled, and reused independently.
 *
 * COM-2 / UX-8: a user who may not post is presented with no composer at all
 * rather than a disabled one.
 * SUX-9 / AC-29: a change of posting rights takes effect without a reload and
 * is explained where it happens, with composed text preserved (SUX-15).
 */

import React, { useCallback, type JSX } from "react";

import "../chat/ChatArea.css";
import { useChat } from "../../context/ChatContext";
import { usePermissions } from "../../context/PermissionContext";
import { useConversations } from "../../providers/useSovereignData";
import { usePostingPermission } from "../../hooks/usePostingPermission";
import { ConversationHeader } from "../chat/ConversationHeader";
import { MessageTimeline } from "../chat/MessageTimeline";
import { TypingIndicator } from "../chat/TypingIndicator";
import { MessageComposer } from "../chat/MessageComposer";
import { PermissionNotice } from "../chat/PermissionNotice";
import { EmptyState } from "../ui";
import { CHAT_COPY } from "../../config/chatCopy";

export function ChatArea(): JSX.Element {
    const { activeChannelId, activeChannel, messages, sendMessage } = useChat();
    const { currentUser, canPostInChannel } = usePermissions();
    const { data: conversations, state: conversationsState } = useConversations();

    const conversation = conversations.find((item) => item.id === activeChannelId) ?? null;

    // Role-derived answer, used where the room cannot supply one of its own.
    const readOnlyForEmployees =
        conversation?.readOnlyForEmployees ?? activeChannel?.readOnlyForEmployees ?? true;
    const { canPost, reason, change } = usePostingPermission(activeChannelId, {
        fallbackCanPost: canPostInChannel(readOnlyForEmployees),
        readOnlyForEmployees,
    });

    const handleSendMessage = useCallback(
        (text: string) => {
            if (!text.trim()) return;
            sendMessage(text);
        },
        [sendMessage],
    );

    /*
     * ST-23: with no conversation selected the surface says so and points at
     * the next action, rather than rendering an empty conversation.
     */
    if (!activeChannelId || (!conversation && !activeChannel)) {
        return (
            <div id="sovereign-chat-area" className="svr-chat-root">
                <div className="svr-module-state">
                    <EmptyState
                        variant="empty"
                        icon="message"
                        title={CHAT_COPY.noConversation}
                        description={CHAT_COPY.noConversationDescription}
                    />
                </div>
            </div>
        );
    }

    return (
        <div id="sovereign-chat-area" className="svr-chat-root">
            <ConversationHeader
                name={conversation?.name ?? activeChannel?.name ?? ""}
                type={conversation?.type ?? activeChannel?.type ?? "group"}
                memberCount={conversation?.memberCount ?? null}
                topic={conversation?.topic ?? activeChannel?.description}
                loading={conversationsState === "loading"}
            />

            <MessageTimeline messages={messages} currentUserId={currentUser.id} />

            <TypingIndicator />

            {/* SUX-9: the change is stated where it takes effect, in one sentence. */}
            {change && (
                <p className="svr-permission-change" role="status" aria-live="polite">
                    {change}
                </p>
            )}

            {canPost ? (
                <MessageComposer onSendMessage={handleSendMessage} conversationId={activeChannelId} />
            ) : (
                <PermissionNotice message={reason ?? CHAT_COPY.readOnlyConversation} />
            )}
        </div>
    );
}
