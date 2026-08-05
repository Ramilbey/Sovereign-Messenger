/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * useTyping.ts — Typing Notifications
 *
 * FR-6 … FR-11 / ST-1 … ST-5.
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MatrixTypingService } from "../services/MatrixTypingService";
import { isDemoMode } from "../config/SovereignConfig";

const NOBODY: string[] = [];

export interface TypingApi {
    /** FR-7: display names of everyone else composing, in stable order. */
    typingUsers: string[];
    /** FR-10: report that this user is composing. */
    reportTyping: () => void;
    /** ST-3: report that they have stopped, on send or on clearing. */
    reportStopped: () => void;
}

/**
 * @param conversationId the conversation being observed
 * @param canPost FR-11 / ST-5: typing is never reported where the user may
 *        not post — announcing composition in a channel one cannot post to
 *        would tell a department someone is drafting a directive they cannot
 *        send.
 */
export function useTyping(conversationId: string, canPost: boolean): TypingApi {
    const demo = isDemoMode();
    const [version, setVersion] = useState(0);
    const service = MatrixTypingService.getInstance();

    // ST-3: the conversation a "stopped" notice belongs to, so leaving one
    // mid-sentence clears it there rather than in whichever is opened next.
    const active = useRef<string>(conversationId);

    useEffect(() => {
        if (demo) return;
        return service.subscribe(() => setVersion((v) => v + 1));
    }, [demo, service]);

    useEffect(() => {
        const previous = active.current;
        active.current = conversationId;

        return () => {
            // Leaving a conversation stops reporting composition in it.
            if (previous && !demo) void service.setTyping(previous, false);
        };
    }, [conversationId, demo, service]);

    const typingUsers = useMemo(() => {
        if (demo || !conversationId) return NOBODY;
        void version;
        return service.getTypingNames(conversationId);
    }, [demo, conversationId, version, service]);

    const reportTyping = useCallback(() => {
        if (demo || !conversationId || !canPost) return;
        void service.setTyping(conversationId, true);
    }, [demo, conversationId, canPost, service]);

    const reportStopped = useCallback(() => {
        if (demo || !conversationId) return;
        void service.setTyping(conversationId, false);
    }, [demo, conversationId, service]);

    return { typingUsers, reportTyping, reportStopped };
}
