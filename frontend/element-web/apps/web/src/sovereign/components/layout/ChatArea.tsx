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
import { useUsers, useChannels } from "../../providers/useSovereignData";
import { MessageTimeline } from "../chat/MessageTimeline";
import { TypingIndicator } from "../chat/TypingIndicator";
import { MessageComposer } from "../chat/MessageComposer";

export function ChatArea(): JSX.Element {
    const { activeChannelId, setActiveChannelId, activeChannel, messages, sendMessage } = useChat();
    const { currentUser, canPostInChannel } = usePermissions();
    const { data: users } = useUsers();
    const { data: { channels, groups } } = useChannels();

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
            {/* Header: Channel icon, name, and quick channel switcher */}
            <div className="svr-chat-header">
                <div className="svr-chat-header-info">
                    <span className="svr-chat-header-icon">{activeChannel?.icon || "📢"}</span>
                    <span className="svr-chat-header-name">{activeChannel?.name || "Kanal"}</span>
                    {activeChannel?.description && (
                        <span className="svr-chat-header-desc">— {activeChannel.description}</span>
                    )}
                </div>

                {/* Channel Switcher Selector */}
                <select
                    id="sovereign-channel-select"
                    value={activeChannelId}
                    onChange={(e) => setActiveChannelId(e.target.value)}
                    style={{
                        backgroundColor: "#0e1621",
                        color: "#5288c1",
                        border: "1px solid #2b3a4a",
                        borderRadius: "8px",
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        outline: "none",
                    }}
                >
                    <optgroup label="📢 Rasmiy Kanallar">
                        {channels.map((c) => (
                            <option key={c.id} value={c.id}>
                                📢 {c.name}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="💬 Guruhlar">
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                💬 {g.name}
                            </option>
                        ))}
                    </optgroup>
                </select>
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
