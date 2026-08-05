/*
 * Sovereign Messenger — Sprint 2, Phase 6.2
 * useMessages.ts — Message Provider Hook.
 *
 * Implements Dependency Inversion:
 * When SOVEREIGN_MODE=true (isDemoMode()): uses DemoMessageService.
 * When SOVEREIGN_MODE=false (!isDemoMode()): uses MatrixMessageService -> MatrixTimelineService.
 */

import { useState, useEffect, useCallback } from "react";
import type { MessageService, SovereignMessage } from "../services/MessageService";
import { DemoMessageService } from "../services/DemoMessageService";
import { MatrixMessageService } from "../services/MatrixMessageService";
import { isDemoMode } from "../config/SovereignConfig";

const defaultDemoService = new DemoMessageService();
const defaultMatrixService = new MatrixMessageService();

export function useMessages(
    channelId?: string,
    messageService?: MessageService
) {
    const [messages, setMessages] = useState<SovereignMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const activeService = messageService || (isDemoMode() ? defaultDemoService : defaultMatrixService);

    useEffect(() => {
        if (!channelId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);

        // Subscribe to timeline updates from active transport service
        const unsubscribe = activeService.subscribeToTimeline(channelId, (updatedMessages) => {
            setMessages(updatedMessages);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [channelId, activeService]);

    const sendMessage = useCallback(
        async (content: string, senderId: string, senderName: string, senderRole: string) => {
            if (!channelId || !content.trim()) return;
            await activeService.sendMessage(channelId, content, senderId, senderName, senderRole);
        },
        [channelId, activeService]
    );

    /**
     * Send to an explicitly named conversation rather than the one this hook
     * is bound to.
     *
     * Required by the outbox: a message queued in one conversation must be
     * delivered to THAT conversation when it is eventually sent, never to
     * whichever conversation happens to be open at the time. Binding the send
     * to the active channel would misdeliver official correspondence.
     */
    const sendToConversation = useCallback(
        async (
            conversationId: string,
            content: string,
            senderId: string,
            senderName: string,
            senderRole: string,
        ) => {
            if (!conversationId || !content.trim()) return;
            await activeService.sendMessage(conversationId, content, senderId, senderName, senderRole);
        },
        [activeService]
    );

    return {
        messages,
        sendMessage,
        sendToConversation,
        isLoading,
    };
}
