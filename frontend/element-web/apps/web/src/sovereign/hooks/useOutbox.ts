/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * useOutbox.ts — Outbox Hook
 *
 * Wires OutboxService to a conversation-explicit send function and exposes a
 * submit call to the context layer.
 *
 * Two reasons this hook exists rather than the context talking to the service:
 *
 *  1. Correctness. The send handler must honour the conversation id it is
 *     given. Wiring it here, next to sendToConversation, makes the correct
 *     binding the obvious one — the previous arrangement closed over the
 *     active channel and could deliver a queued message to the wrong room.
 *
 *  2. Layering. Blueprint section 8 keeps service access out of contexts;
 *     hooks are the boundary that talks to services.
 */

import { useCallback, useEffect, useMemo } from "react";

import { OutboxService } from "../services/OutboxService";
import { useMessages } from "./useMessages";

export interface OutboxSender {
    id: string;
    displayName: string;
    role: string;
}

/**
 * Returns a submit function that records the message durably and sends it to
 * the named conversation.
 *
 * @param sender identity attributed to outgoing messages, or null when the
 *               current user is not yet resolved
 */
export function useOutbox(sender: OutboxSender | null): {
    submit: (conversationId: string, content: string) => Promise<void>;
} {
    const outbox = useMemo(() => OutboxService.getInstance(), []);
    const { sendToConversation } = useMessages();

    useEffect(() => {
        if (!sender) return;

        // The handler receives the conversation id and passes it straight
        // through; it never substitutes an ambient "current conversation".
        outbox.start((conversationId, content) =>
            sendToConversation(conversationId, content, sender.id, sender.displayName, sender.role),
        );

        // Every registration has a matching cleanup.
        return () => {
            outbox.stop();
        };
    }, [outbox, sender, sendToConversation]);

    const submit = useCallback(
        async (conversationId: string, content: string) => {
            await outbox.submit(conversationId, content);
        },
        [outbox],
    );

    return { submit };
}
