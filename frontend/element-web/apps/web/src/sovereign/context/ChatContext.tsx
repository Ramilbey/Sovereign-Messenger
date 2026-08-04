/*
 * Sovereign Messenger — Sprint 1, Step 7 Architectural Foundation
 * ChatContext.tsx — Dedicated Chat Domain Context.
 *
 * Prevents SovereignLayout from becoming a "God Component".
 * Manages active channel selection, active channel metadata, and message sending.
 */

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode, type JSX } from "react";
import { usePermissions } from "./PermissionContext";
import { OutboxService } from "../services/OutboxService";
import { useChannels, useMessages, type SovereignChannel, type SovereignMessage } from "../providers/useSovereignData";


export interface ChatContextValue {
    activeChannelId: string;
    setActiveChannelId: (channelId: string) => void;
    activeChannel: SovereignChannel | null;
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
    const { data: { channels, groups } } = useChannels();
    const allChannels = useMemo(() => [...channels, ...groups], [channels, groups]);

    React.useEffect(() => {
        if (allChannels.length > 0 && !allChannels.some((c) => c.id === activeChannelId)) {
            setActiveChannelId(allChannels[0].id);
        }
    }, [allChannels, activeChannelId]);

    const { messages, sendMessage: sendDemoMessage } = useMessages(activeChannelId);
    const { currentUser } = usePermissions();

    const activeChannel = useMemo(
        () => allChannels.find((c) => c.id === activeChannelId) || null,
        [allChannels, activeChannelId],
    );

    /*
     * SUX-6 / ST-38: while disconnected, a composed message is queued rather
     * than lost, and sent automatically in original order once the connection
     * returns (EDGE-11). The outbox decides only WHEN to hand the message to
     * the existing send path — it does not change how messages are sent.
     */
    const outbox = OutboxService.getInstance();

    useEffect(() => {
        if (!currentUser) return;
        outbox.start((_conversationId, content) =>
            sendDemoMessage(content, currentUser.id, currentUser.displayName, currentUser.role),
        );
    }, [outbox, currentUser, sendDemoMessage]);

    const handleSendMessage = useCallback(
        async (content: string) => {
            if (!currentUser) return;

            try {
                await outbox.submit(activeChannelId, content);
            } catch (error: unknown) {
                // Transport-level failures (send rejected, network drop) must not
                // surface as an unhandled promise rejection — ChatArea's composer
                // does not await this call (ERR-1).
                const detail = error instanceof Error ? error.message : String(error);
                console.error("[ChatContext] Failed to send message:", detail);
            }
        },
        [currentUser, outbox, activeChannelId],
    );

    const value = useMemo<ChatContextValue>(
        () => ({
            activeChannelId,
            setActiveChannelId,
            activeChannel,
            messages,
            sendMessage: handleSendMessage,
        }),
        [
            activeChannelId,
            activeChannel,
            messages,
            handleSendMessage,
            setActiveChannelId,
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
