/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * useConnectionState.ts — Connection State Hook
 *
 * Exposes ConnectionStateService to the interface layer. Per Blueprint
 * section 8, hooks never import the Matrix SDK directly; they consume a
 * service, which is the only layer permitted to.
 */

import { useEffect, useState } from "react";

import {
    ConnectionStateService,
    type ConnectionState,
} from "../services/ConnectionStateService";

/** Current connection state, updating as the platform's sync state changes. */
export function useConnectionState(): ConnectionState {
    const service = ConnectionStateService.getInstance();
    const [state, setState] = useState<ConnectionState>(() => service.getState());

    useEffect(() => {
        return service.subscribe(setState);
    }, [service]);

    return state;
}
