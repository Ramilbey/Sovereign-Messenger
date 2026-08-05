/*
 * Sovereign Messenger — Sprint 2, Phase 6.2
 * useMessages.ts — Message Provider Hook.
 *
 * Implements Dependency Inversion:
 * When SOVEREIGN_MODE=true (isDemoMode()): uses DemoMessageService.
 * When SOVEREIGN_MODE=false (!isDemoMode()): uses MatrixMessageService -> MatrixTimelineService.
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
    /** FR-36: whether earlier messages remain to be loaded. */
    const [hasEarlier, setHasEarlier] = useState<boolean>(false);
    const [isLoadingEarlier, setIsLoadingEarlier] = useState<boolean>(false);
    /** FR-37: the message the user had read up to when they arrived. */
    const [readUpToId, setReadUpToId] = useState<string | null>(null);

    const activeService = messageService || (isDemoMode() ? defaultDemoService : defaultMatrixService);

    /*
     * EDGE-17: a superseded conversation's arriving messages must never
     * overwrite the timeline the user is now looking at.
     */
    const currentChannel = useRef<string | undefined>(channelId);

    useEffect(() => {
        currentChannel.current = channelId;

        if (!channelId) {
            setMessages([]);
            setHasEarlier(false);
            setReadUpToId(null);
            return;
        }

        setIsLoading(true);

        /*
         * FR-37 / CMP-27: the read position is captured once, on entry. The
         * divider is "where you left off" and must not creep down the timeline
         * as the messages below it are read (a persistent divider).
         */
        setReadUpToId(activeService.getReadUpToId(channelId));

        // Subscribe to timeline updates from active transport service
        const unsubscribe = activeService.subscribeToTimeline(channelId, (updatedMessages) => {
            if (currentChannel.current !== channelId) return;
            setMessages(updatedMessages);
            setHasEarlier(activeService.hasEarlier(channelId));
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [channelId, activeService]);

    /** FR-36: loads one page of earlier messages. */
    const loadEarlier = useCallback(async () => {
        if (!channelId || isLoadingEarlier) return;

        setIsLoadingEarlier(true);
        try {
            const more = await activeService.loadEarlier(channelId);
            if (currentChannel.current === channelId) {
                setHasEarlier(more && activeService.hasEarlier(channelId));
            }
        } finally {
            setIsLoadingEarlier(false);
        }
    }, [channelId, activeService, isLoadingEarlier]);

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
        hasEarlier,
        isLoadingEarlier,
        loadEarlier,
        readUpToId,
    };
}
