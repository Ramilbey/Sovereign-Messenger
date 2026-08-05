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

import { useEffect, useState } from "react";

import { MatrixRoomService } from "../services/MatrixRoomService";
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

        const service = MatrixRoomService.getInstance();
        const read = (): void => setRoomAnswer(service.canSendMessage(conversationId));

        read();

        /*
         * The service owns which platform events mean "room state may have
         * changed" — including the power level change that grants or withdraws
         * posting rights, and the membership change that follows an
         * organisational reassignment (EDGE-14). Blueprint §8: no hook reads
         * the platform SDK.
         */
        return service.subscribe(read);
    }, [conversationId, demo]);

    const canPost = roomAnswer ?? fallbackCanPost;

    /*
     * SUX-9: report the transition, so the surface can say what changed rather
     * than silently swapping the composer for a notice.
     *
     * Held in state and adjusted during render — the pattern React documents
     * for deriving state from changed inputs. A ref written inside useMemo
     * would be a side effect in a computation React may run more than once,
     * and the second run would swallow the very transition being reported.
     */
    const [tracked, setTracked] = useState<{
        conversationId: string;
        canPost: boolean;
        /** Whether the recorded answer came from the room rather than the role. */
        known: boolean;
        change: string | null;
    }>({ conversationId, canPost, known: roomAnswer !== null, change: null });

    const known = roomAnswer !== null;

    if (
        tracked.conversationId !== conversationId ||
        tracked.canPost !== canPost ||
        tracked.known !== known
    ) {
        /*
         * A change is announced only between two answers the room actually
         * gave, within one conversation.
         *
         * Before the room has loaded, the role-derived fallback applies. When
         * the room's own answer then arrives it frequently differs — an
         * employee's least-privilege fallback resolving to real posting rights
         * is the common case on first load. Announcing that as a change would
         * tell a user their permissions had just been altered when nothing had
         * happened but data arriving, which in a government system is a
         * misstatement about authority, not a cosmetic glitch.
         */
        const sameConversation = tracked.conversationId === conversationId;
        const rightsChanged = sameConversation && tracked.known && known && tracked.canPost !== canPost;

        setTracked({
            conversationId,
            canPost,
            known,
            change: rightsChanged
                ? canPost
                    ? CHAT_COPY.postingGranted
                    : CHAT_COPY.postingRevoked
                : null,
        });
    }

    return {
        canPost,
        reason: canPost
            ? null
            : readOnlyForEmployees
              ? CHAT_COPY.readOnlyChannel
              : CHAT_COPY.readOnlyConversation,
        change: tracked.change,
    };
}
