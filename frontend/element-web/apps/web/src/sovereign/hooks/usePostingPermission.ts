/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * usePostingPermission.ts — Live Posting Rights
 *
 * SUX-9 / EDGE-13 / AC-29: a change to the user's posting rights takes effect
 * in the interface without a reload, and is explained in one neutral sentence
 * at the point of effect. Permission was previously resolved once when the
 * application mounted, so a change mid-session was invisible until a refresh.
 *
 * SUX-15 / UX-9: in-progress composition is untouched by the change. Drafts
 * are held per conversation and outlive the composer being replaced by a
 * notice, so nothing the user has written is lost when rights are withdrawn.
 *
 * Per Blueprint section 8, this consumes a service; it never reads the SDK.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { MatrixRoomService } from "../services/MatrixRoomService";
import { MatrixClientService } from "../services/MatrixClientService";
import { isDemoMode } from "../config/SovereignConfig";
import { CHAT_COPY } from "../config/chatCopy";

export interface PostingPermission {
    /** COM-2: whether the composer is presented at all. */
    canPost: boolean;
    /** COM-3 / FR-43: one neutral sentence, where posting is not permitted. */
    reason: string | null;
    /**
     * SUX-9: set for the render in which rights changed, so the surface can
     * explain the change at the point of effect. Null when nothing changed.
     */
    change: string | null;
}

interface Options {
    /** The role-derived answer, used where the room cannot supply one. */
    fallbackCanPost: boolean;
    /** Whether this conversation restricts posting to leadership. */
    readOnlyForEmployees: boolean;
}

/**
 * Whether the user may post in a conversation, kept current as room state
 * changes during the session.
 */
export function usePostingPermission(
    conversationId: string,
    { fallbackCanPost, readOnlyForEmployees }: Options,
): PostingPermission {
    const demo = isDemoMode();

    /*
     * The room's own power levels are authoritative where they can be read.
     * `null` means "not knowable" — no client, or no such room — and must not
     * be treated as a refusal, or an unloaded room would silently remove the
     * composer.
     */
    const [roomAnswer, setRoomAnswer] = useState<boolean | null>(() =>
        demo ? null : MatrixRoomService.getInstance().canSendMessage(conversationId),
    );

    useEffect(() => {
        if (demo || !conversationId) {
            setRoomAnswer(null);
            return;
        }

        const read = (): void => {
            setRoomAnswer(MatrixRoomService.getInstance().canSendMessage(conversationId));
        };

        read();

        const client = MatrixClientService.getInstance().getClient();
        if (!client) return;

        // A power level change arrives as a room state event; the membership
        // change that follows a reassignment arrives separately (EDGE-14).
        const events = ["RoomState.events", "RoomState.update", "Room.myMembership"] as const;

        try {
            events.forEach((event) => client.on(event as never, read as never));
        } catch {
            // Graceful fallback: the initial read still applies.
        }

        return () => {
            try {
                events.forEach((event) => client.removeListener(event as never, read as never));
            } catch {
                // Graceful fallback
            }
        };
    }, [conversationId, demo]);

    const canPost = roomAnswer ?? fallbackCanPost;

    /*
     * SUX-9: report the transition once, so the surface can say what changed
     * rather than silently swapping the composer for a notice.
     */
    const previous = useRef<{ conversationId: string; canPost: boolean } | null>(null);
    const change = useMemo(() => {
        const last = previous.current;
        previous.current = { conversationId, canPost };

        if (!last || last.conversationId !== conversationId || last.canPost === canPost) {
            return null;
        }
        return canPost ? CHAT_COPY.postingGranted : CHAT_COPY.postingRevoked;
    }, [conversationId, canPost]);

    return {
        canPost,
        reason: canPost
            ? null
            : readOnlyForEmployees
              ? CHAT_COPY.readOnlyChannel
              : CHAT_COPY.readOnlyConversation,
        change,
    };
}
