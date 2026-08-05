/*
 * Sovereign Messenger — Sprint 1, Step 7 Architectural Foundation
 * ChatContext.tsx — Dedicated Chat Domain Context.
 *
 * Prevents SovereignLayout from becoming a "God Component".
 * Manages active channel selection, active channel metadata, and message sending.
 */

import React, { createContext, useContext, useState, useMemo, useCallback, type ReactNode, type JSX } from "react";
import { usePermissions } from "./PermissionContext";
import { useOutbox } from "../hooks/useOutbox";
import type { ResourceState } from "../types/resource";
import { useConversations, useMessages, type SovereignMessage } from "../providers/useSovereignData";
import type { SovereignConversation } from "../types/conversation";


export interface ChatContextValue {
    activeChannelId: string;
    setActiveChannelId: (channelId: string) => void;
    /** The conversation now open, with the metadata its header needs (FR-44). */
    activeConversation: SovereignConversation | null;
    /** Every conversation the user belongs to, of all three types (IA-6). */
    conversations: SovereignConversation[];
    conversationsState: ResourceState;
    messages: SovereignMessage[];
    sendMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

interface ChatProviderProps {
    defaultChannelId?: string;
    children: ReactNode;
}

export function ChatProvider({
    defaultChannelId = "channel_elonlar",
    children,
}: ChatProviderProps): JSX.Element {
    const [activeChannelId, setActiveChannelId] = useState<string>(defaultChannelId);
    const { data: conversations, state: conversationsState } = useConversations();

    React.useEffect(() => {
        if (conversations.length > 0 && !conversations.some((c) => c.id === activeChannelId)) {
            setActiveChannelId(conversations[0].id);
        }
    }, [conversations, activeChannelId]);

    // Sending goes through the outbox; this hook supplies the timeline only.
    const { messages } = useMessages(activeChannelId);
    const { currentUser } = usePermissions();

    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === activeChannelId) ?? null,
        [conversations, activeChannelId],
    );

    /*
     * SUX-6 / ST-38: a message is recorded durably before it is sent, so it
     * survives a reload and can be re-sent if the SDK abandons it on a
     * connection error. The outbox is bound to a conversation-explicit send,
     * so a message always reaches the conversation it was written in.
     */
    const outboxSender = useMemo(
        () =>
            currentUser
                ? {
                      id: currentUser.id,
                      displayName: currentUser.displayName,
                      role: currentUser.role,
                  }
                : null,
        [currentUser],
    );
    const { submit } = useOutbox(outboxSender);

    const handleSendMessage = useCallback(
        async (content: string) => {
            if (!currentUser) return;

            try {
                // The active conversation is captured at submit time and
                // recorded with the message; it is not re-derived at send time.
                await submit(activeChannelId, content);
            } catch (error: unknown) {
                // Transport-level failures (send rejected, network drop) must not
                // surface as an unhandled promise rejection — ChatArea's composer
                // does not await this call (ERR-1).
                const detail = error instanceof Error ? error.message : String(error);
                console.error("[ChatContext] Failed to send message:", detail);
            }
        },
        [currentUser, submit, activeChannelId],
    );

    const value = useMemo<ChatContextValue>(
        () => ({
            activeChannelId,
            setActiveChannelId,
            activeConversation,
            conversations,
            conversationsState,
            messages,
            sendMessage: handleSendMessage,
        }),
        [
            activeChannelId,
            activeConversation,
            conversations,
            conversationsState,
            messages,
            handleSendMessage,
        ],
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
}
