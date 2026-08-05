/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * ChatArea.tsx — Composition Root for Chat UI.
 *
 * Blueprint §6:
 * Telegram-style chat panel assembling channel header, channel switcher,
 * MessageTimeline, TypingIndicator, and conditionally mounted MessageComposer.
 */

import React, { useCallback, useMemo, type JSX } from "react";
import "../chat/ChatArea.css";
import { useChat } from "../../context/ChatContext";
import { usePermissions } from "../../context/PermissionContext";
import { useUsers } from "../../providers/useSovereignData";
import { MessageTimeline } from "../chat/MessageTimeline";
import { TypingIndicator } from "../chat/TypingIndicator";
import { MessageComposer } from "../chat/MessageComposer";

export function ChatArea(): JSX.Element {
    const { activeChannelId, activeChannel, messages, sendMessage } = useChat();
    const { currentUser, canPostInChannel } = usePermissions();
    const { data: users } = useUsers();

    // Map user Initials for MessageTimeline avatar circles
    const userInitialsMap = useMemo(() => {
        const map: Record<string, string> = {};
        users.forEach((u) => {
            map[u.id] = u.avatarInitials;
        });
        return map;
    }, [users]);

    // Handle sending message from composer bar
    const handleSendMessage = useCallback(
        (text: string) => {
            if (!text.trim() || !currentUser) return;
            sendMessage(text);
        },
        [currentUser, sendMessage]
    );

    // Permission decision: can post in this channel?
    const isReadOnlyChannel = activeChannel?.readOnlyForEmployees ?? true;
    const isAllowedToPost = canPostInChannel(isReadOnlyChannel);

    return (
        <div id="sovereign-chat-area" className="svr-chat-root">
            {/*
              * Header. The channel switcher that used to sit here has been
              * replaced by the conversation list in the application frame
              * (NAV-2); the header now describes the conversation rather than
              * doubling as navigation. It becomes CMP-30 in the next commit.
              */}
            <div className="svr-chat-header">
                <div className="svr-chat-header-info">
                    <span className="svr-chat-header-name">{activeChannel?.name ?? ""}</span>
                    {activeChannel?.description && (
                        <span className="svr-chat-header-desc">{activeChannel.description}</span>
                    )}
                </div>
            </div>

            {/* Scrollable Message Timeline */}
            <MessageTimeline
                messages={messages}
                currentUserId={currentUser.id}
                userInitialsMap={userInitialsMap}
            />

            {/* Typing Indicator */}
            <TypingIndicator />

            {/* Conditional Composer Bar (Unmounted if employee in read-only channel) */}
            {isAllowedToPost ? (
                <MessageComposer onSendMessage={handleSendMessage} conversationId={activeChannelId} />
            ) : (
                <div
                    style={{
                        padding: "10px 16px",
                        backgroundColor: "#17212b",
                        borderTop: "1px solid #2b3a4a",
                        color: "#7d8e9e",
                        fontSize: "13px",
                        textAlign: "center",
                    }}
                >
                    🔒 Ushbu rasmiy kanalda faqat Rahbarlar xabar yozishi mumkin.
                </div>
            )}
        </div>
    );
}
