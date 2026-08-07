/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * useNotifications.ts — Unread Model and Notification Centre
 *
 * NT-1 … NT-5: the surfaces that show what is waiting — the conversation list,
 * the module list, the hierarchy, and the notification centre — all read it
 * through here, so no two of them can disagree about the same number.
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { MatrixNotificationService } from "../services/MatrixNotificationService";
import { isDemoMode } from "../config/SovereignConfig";
import { ready, unavailable, type SovereignResource } from "../types/resource";
import type { NotificationEntry, NotificationLevel } from "../types/notification";

/** Stable empty result, so a surface with nothing waiting keeps its identity. */
const EMPTY_FEED: NotificationEntry[] = [];

/**
 * NT-3: recent mentions, direct messages, and official channel activity.
 *
 * FR-1: Demo Mode carries no notification state of its own and does not consult
 * the platform, so the centre presents its unavailable state there rather than
 * a fabricated feed.
 */
export function useNotificationFeed(): SovereignResource<NotificationEntry[]> {
    const demo = isDemoMode();
    const [version, setVersion] = useState(0);

    useEffect(() => {
        if (demo) return;
        return MatrixNotificationService.getInstance().subscribe(() => setVersion((v) => v + 1));
    }, [demo]);

    const entries = useMemo(() => {
        if (demo) return EMPTY_FEED;

        void version;
        return MatrixNotificationService.getInstance().getFeed();
    }, [demo, version]);

    return demo ? unavailable(EMPTY_FEED) : ready(entries);
}

export interface NotificationActions {
    /** NT-4: mark one entry read. */
    markRead: (entry: NotificationEntry) => void;
    /** NT-4: mark every entry the centre is showing read. */
    markAllRead: () => void;
}

export function useNotificationActions(): NotificationActions {
    const demo = isDemoMode();

    const markRead = useCallback(
        (entry: NotificationEntry) => {
            if (demo) return;
            void MatrixNotificationService.getInstance().markRead(entry);
        },
        [demo],
    );

    const markAllRead = useCallback(() => {
        if (demo) return;
        void MatrixNotificationService.getInstance().markAllRead();
    }, [demo]);

    return { markRead, markAllRead };
}

export interface NotificationLevelApi {
    level: NotificationLevel;
    /** NT-5: written to the platform, so it follows the user everywhere (NT-8). */
    setLevel: (level: NotificationLevel) => void;
    /** ERR-*: the last attempt could not be applied; the control says so. */
    failed: boolean;
    /** True while the change is in flight, so the control cannot be double-set. */
    pending: boolean;
}

/** NT-5 / FR-52: the notification level of one conversation. */
export function useNotificationLevel(conversationId: string): NotificationLevelApi {
    const demo = isDemoMode();
    const [version, setVersion] = useState(0);
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (demo) return;
        return MatrixNotificationService.getInstance().subscribe(() => setVersion((v) => v + 1));
    }, [demo]);

    const level = useMemo<NotificationLevel>(() => {
        if (demo || !conversationId) return "all";

        void version;
        return MatrixNotificationService.getInstance().getLevel(conversationId);
    }, [demo, conversationId, version]);

    const setLevel = useCallback(
        (next: NotificationLevel) => {
            if (demo || !conversationId) return;

            setPending(true);
            setFailed(false);

            MatrixNotificationService.getInstance()
                .setLevel(conversationId, next)
                .catch(() => setFailed(true))
                .finally(() => setPending(false));
        },
        [demo, conversationId],
    );

    return { level, setLevel, failed, pending };
}
