/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * usePresence.ts — Availability
 *
 * FR-13: presence appears consistently wherever a person does, so every such
 * surface reads it through this one hook.
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { MatrixPresenceService } from "../services/MatrixPresenceService";
import { isDemoMode } from "../config/SovereignConfig";
import type { PresenceState, SovereignPresence } from "../types/presence";

const EMPTY: ReadonlyMap<string, SovereignPresence> = new Map();

/**
 * The availability of several people at once — a member list reads them
 * together rather than opening one subscription per person.
 */
export function usePresenceFor(userIds: string[]): ReadonlyMap<string, SovereignPresence> {
    const demo = isDemoMode();
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (demo) return;
        return MatrixPresenceService.getInstance().subscribe(() => setVersion((v) => v + 1));
    }, [demo]);

    return useMemo(() => {
        /*
         * FR-1: Demo Mode carries fixed availability in its own dataset and
         * does not consult the platform. Production reads what the deployment
         * reports, or `unknown` where it reports nothing (R-3).
         */
        if (demo) return EMPTY;

        void version;
        return MatrixPresenceService.getInstance().getPresenceFor(userIds);
    }, [demo, userIds, version]);
}

/** The availability of one person. */
export function usePresence(userId: string): SovereignPresence {
    const ids = useMemo(() => (userId ? [userId] : []), [userId]);
    const map = usePresenceFor(ids);
    return map.get(userId) ?? { userId, state: "unknown", lastActiveAt: null };
}

/** FR-15 / ST-8: the signed-in user's own manual availability. */
export function useManualPresence(): {
    manual: PresenceState | null;
    setManual: (state: PresenceState | null) => void;
} {
    const service = MatrixPresenceService.getInstance();
    const [manual, setState] = useState<PresenceState | null>(() => service.getManualPresence());

    useEffect(() => service.subscribe(() => setState(service.getManualPresence())), [service]);

    const setManual = useCallback(
        (state: PresenceState | null) => void service.setManualPresence(state),
        [service],
    );

    return { manual, setManual };
}
