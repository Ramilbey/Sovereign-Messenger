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

import React, { useCallback, useState, type JSX } from "react";

import "../chat/ChatArea.css";
import { useChat } from "../../context/ChatContext";
import { usePermissions } from "../../context/PermissionContext";
import { usePostingPermission } from "../../hooks/usePostingPermission";
import { useTyping } from "../../hooks/useTyping";
import { useAcknowledgement, useReadReporting } from "../../hooks/useReceipts";
import { AcknowledgementSummary } from "../chat/AcknowledgementSummary";
import { MatrixReceiptService } from "../../services/MatrixReceiptService";
import { ConversationHeader } from "../chat/ConversationHeader";
import { MessageTimeline } from "../chat/MessageTimeline";
import { TypingIndicator } from "../chat/TypingIndicator";
import { MessageComposer } from "../chat/MessageComposer";
import { PermissionNotice } from "../chat/PermissionNotice";
import { EmptyState } from "../ui";
import { ACKNOWLEDGEMENT_COPY, CHAT_COPY } from "../../config/chatCopy";

export function ChatArea(): JSX.Element {
    const {
        activeChannelId,
        activeConversation,
        conversationsState,
        messages,
        sendMessage,
        hasEarlierMessages,
        isLoadingEarlierMessages,
        loadEarlierMessages,
        readUpToId,
    } = useChat();
    const { currentUser, canPostInChannel } = usePermissions();

    // Role-derived answer, used where the room cannot supply one of its own.
    // Least privilege while the conversation is still resolving (AS-1).
    const readOnlyForEmployees = activeConversation?.readOnlyForEmployees ?? true;
    const { canPost, reason, change } = usePostingPermission(activeChannelId, {
        fallbackCanPost: canPostInChannel(readOnlyForEmployees),
        readOnlyForEmployees,
    });

    // FR-11 / ST-5: typing is never reported where the user may not post.
    const { typingUsers, reportTyping, reportStopped } = useTyping(activeChannelId, canPost);

    // FR-21: reading a message records that it has been read.
    const reportRead = useReadReporting(activeChannelId);

    // FR-19 / GW-2: the issuer inspects the acknowledgement of one message.
    const [ackEventId, setAckEventId] = useState<string | null>(null);
    const { data: acknowledgement, state: ackState } = useAcknowledgement(
        activeChannelId,
        ackEventId,
        currentUser.id,
    );

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
    if (!activeChannelId || (!activeConversation && conversationsState !== "loading")) {
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
                name={activeConversation?.name ?? ""}
                type={activeConversation?.type ?? "group"}
                memberCount={activeConversation?.memberCount ?? null}
                topic={activeConversation?.topic}
                loading={conversationsState === "loading" || !activeConversation}
            />

            <MessageTimeline
                messages={messages}
                currentUserId={currentUser.id}
                hasEarlier={hasEarlierMessages}
                isLoadingEarlier={isLoadingEarlierMessages}
                onLoadEarlier={loadEarlierMessages}
                readUpToId={readUpToId}
                onMessageRead={reportRead}
                onShowAcknowledgement={setAckEventId}
            />

            {/* FR-19 / FR-20 / GW-2: who has read this directive, and who has not. */}
            {ackEventId && (
                <div className="svr-ack-panel">
                    <AcknowledgementSummary
                        summary={acknowledgement}
                        state={ackState}
                        semantic={MatrixReceiptService.getInstance().getSemantic()}
                    />
                    <button
                        type="button"
                        className="svr-ack-panel__close"
                        onClick={() => setAckEventId(null)}
                    >
                        {ACKNOWLEDGEMENT_COPY.close}
                    </button>
                </div>
            )}

            <TypingIndicator typingUsers={typingUsers} />

            {/* SUX-9: the change is stated where it takes effect, in one sentence. */}
            {change && (
                <p className="svr-permission-change" role="status" aria-live="polite">
                    {change}
                </p>
            )}

            {canPost ? (
                <MessageComposer
                    onSendMessage={handleSendMessage}
                    conversationId={activeChannelId}
                    onTyping={reportTyping}
                    onStoppedTyping={reportStopped}
                />
            ) : (
                <PermissionNotice message={reason ?? CHAT_COPY.readOnlyConversation} />
            )}
        </div>
    );
}
