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
import { CHAT_COPY } from "../config/chatCopy";


export interface ChatContextValue {
    /**
     * EDGE-7: the conversation the user was in is no longer available, stated
     * once. Null when there is nothing to report.
     */
    removalNotice: string | null;
    dismissRemovalNotice: () => void;
    activeChannelId: string;
    setActiveChannelId: (channelId: string) => void;
    /** The conversation now open, with the metadata its header needs (FR-44). */
    activeConversation: SovereignConversation | null;
    /** Every conversation the user belongs to, of all three types (IA-6). */
    conversations: SovereignConversation[];
    conversationsState: ResourceState;
    messages: SovereignMessage[];
    sendMessage: (content: string) => void;
    /** FR-36: earlier history, loaded in segments (EDGE-2). */
    hasEarlierMessages: boolean;
    isLoadingEarlierMessages: boolean;
    loadEarlierMessages: () => void;
    /** FR-37: the message the reader had read up to on entering. */
    readUpToId: string | null;
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
    const [removalNotice, setRemovalNotice] = useState<string | null>(null);
    const { data: conversations, state: conversationsState } = useConversations();

    /*
     * EDGE-7: a conversation the user is reading can be removed under them —
     * they are taken out of it, or it is made inaccessible. Moving them
     * silently to another conversation would leave them writing into the
     * wrong one; leaving them where they were would leave them on a broken
     * screen. They are moved, and told once why.
     */
    const known = React.useRef<Map<string, string>>(new Map());

    React.useEffect(() => {
        conversations.forEach((conversation) => known.current.set(conversation.id, conversation.name));

        if (conversationsState !== "ready" || conversations.length === 0) return;
        if (conversations.some((c) => c.id === activeChannelId)) return;

        const name = known.current.get(activeChannelId);
        if (name) setRemovalNotice(CHAT_COPY.conversationRemoved(name));

        setActiveChannelId(conversations[0].id);
    }, [conversations, conversationsState, activeChannelId]);

    const dismissRemovalNotice = useCallback(() => setRemovalNotice(null), []);

    // Sending goes through the outbox; this hook supplies the timeline only.
    const {
        messages,
        hasEarlier: hasEarlierMessages,
        isLoadingEarlier: isLoadingEarlierMessages,
        loadEarlier: loadEarlierMessages,
        readUpToId,
    } = useMessages(activeChannelId);
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
            removalNotice,
            dismissRemovalNotice,
            conversations,
            conversationsState,
            messages,
            sendMessage: handleSendMessage,
            hasEarlierMessages,
            isLoadingEarlierMessages,
            loadEarlierMessages,
            readUpToId,
        }),
        [
            activeChannelId,
            activeConversation,
            removalNotice,
            dismissRemovalNotice,
            conversations,
            conversationsState,
            messages,
            handleSendMessage,
            hasEarlierMessages,
            isLoadingEarlierMessages,
            loadEarlierMessages,
            readUpToId,
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
