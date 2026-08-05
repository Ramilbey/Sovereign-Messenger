/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * useReceipts.ts — Read Markers and Acknowledgement
 *
 * FR-19 … FR-21, GW-2, GW-3.
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { MatrixReceiptService } from "../services/MatrixReceiptService";
import { isDemoMode } from "../config/SovereignConfig";
import { ready, loading, unavailable, type SovereignResource } from "../types/resource";
import type { AcknowledgementSummary } from "../types/receipt";

const EMPTY: AcknowledgementSummary = { totalRecipients: 0, readers: [], pending: [] };

/**
 * FR-21: marks a message read when it becomes visible and the window has
 * focus. Returns the reporter the timeline calls as messages come into view.
 */
export function useReadReporting(conversationId: string): (eventId: string) => void {
    const demo = isDemoMode();
    const service = MatrixReceiptService.getInstance();

    return useCallback(
        (eventId: string) => {
            if (demo || !conversationId || !eventId) return;
            /*
             * FR-21: only while the window has focus. A conversation left open
             * on an unattended workstation must not report that its directives
             * have been read.
             */
            if (typeof document !== "undefined" && document.hasFocus && !document.hasFocus()) return;

            void service.markRead(conversationId, eventId);
        },
        [demo, conversationId, service],
    );
}

/** FR-19 / FR-20 / GW-2: who has read a message and who has not. */
export function useAcknowledgement(
    conversationId: string,
    eventId: string | null,
    senderId: string,
): SovereignResource<AcknowledgementSummary> {
    const demo = isDemoMode();
    const service = MatrixReceiptService.getInstance();
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (demo || !eventId) return;
        return service.subscribe(() => setVersion((v) => v + 1));
    }, [demo, eventId, service]);

    return useMemo(() => {
        /*
         * FR-1: Demo Mode records no read positions, so the surface says the
         * acknowledgement state is unavailable rather than reporting that
         * nobody has read a demonstration directive.
         */
        if (demo) return unavailable(EMPTY);
        if (!eventId) return loading(EMPTY);

        void version;
        return ready(service.getAcknowledgement(conversationId, eventId, senderId), false);
    }, [demo, conversationId, eventId, senderId, version, service]);
}
