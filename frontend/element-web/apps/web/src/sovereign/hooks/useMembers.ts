/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * useMembers.ts — Conversation Membership
 *
 * FR-45 / COM-4: the participants of a conversation, with their roles.
 *
 * ES-1: the surface carries the same four states as any other. Membership
 * arrives with the room, so a conversation whose room the client has not yet
 * seen is `loading` rather than reported as having no members — an empty
 * member list would say the conversation has nobody in it, which is never true
 * of a conversation the user is looking at.
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useEffect, useMemo, useState } from "react";

import { MatrixRoomService } from "../services/MatrixRoomService";
import { isDemoMode } from "../config/SovereignConfig";
import { ready, loading, unavailable, type SovereignResource } from "../types/resource";
import type { SovereignMember } from "../types/member";

/** Stable empty result, so a loading surface does not change identity. */
const EMPTY: SovereignMember[] = [];

export function useMembers(conversationId: string): SovereignResource<SovereignMember[]> {
    const demo = isDemoMode();

    const [members, setMembers] = useState<SovereignMember[]>(EMPTY);
    const [settled, setSettled] = useState<boolean>(false);

    useEffect(() => {
        if (demo || !conversationId) {
            setMembers(EMPTY);
            setSettled(true);
            return;
        }

        setSettled(false);
        const service = MatrixRoomService.getInstance();

        const read = (): void => {
            setMembers(service.getMembers(conversationId));
            setSettled(true);
        };

        read();

        // EDGE-6: membership changes during a session — someone joins, is
        // invited, or leaves — and the list reflects that without a reload.
        return service.subscribe(read);
    }, [conversationId, demo]);

    return useMemo(() => {
        /*
         * FR-1: Demo Mode has no conversation membership in its dataset, so
         * the surface states that rather than presenting the demonstration
         * staff list as though those people were in this conversation.
         */
        if (demo) return unavailable(EMPTY);
        if (!settled) return loading(EMPTY);
        return ready(members);
    }, [demo, settled, members]);
}
