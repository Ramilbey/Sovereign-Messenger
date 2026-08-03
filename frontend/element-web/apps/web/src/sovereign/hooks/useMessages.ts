/*
 * Sovereign Messenger — Sprint 1, Step 7.1
 * useMessages.ts — Thin React hook consuming MessageService.
 *
 * Implements Dependency Inversion. Accepts optional MessageService parameter,
 * defaulting to DemoMessageService instance.
 */

import { useState, useEffect, useCallback } from "react";
import type { MessageService, SovereignMessage } from "../services/MessageService";
import { DemoMessageService } from "../services/DemoMessageService";

// Default active transport instance for Sprint 1
const defaultDemoService = new DemoMessageService();

export function useMessages(
    channelId?: string,
    messageService: MessageService = defaultDemoService
) {
    const [messages, setMessages] = useState<SovereignMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!channelId) {
            setMessages([]);
            return;
        }

        setIsLoading(true);

        // Subscribe to real-time updates from MessageService implementation
        const unsubscribe = messageService.subscribeToTimeline(channelId, (updatedMessages) => {
            setMessages(updatedMessages);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [channelId, messageService]);

    const sendMessage = useCallback(
        async (content: string, senderId: string, senderName: string, senderRole: string) => {
            if (!channelId || !content.trim()) return;
            await messageService.sendMessage(channelId, content, senderId, senderName, senderRole);
        },
        [channelId, messageService]
    );

    return {
        messages,
        sendMessage,
        isLoading,
    };
}
