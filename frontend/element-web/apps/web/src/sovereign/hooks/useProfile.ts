/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * useProfile.ts — Person Profiles
 *
 * PR-1 … PR-9. One hook behind one profile surface, so a profile opened from
 * the member list, from a message, or from search is assembled the same way
 * (AC-15).
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { MatrixProfileService } from "../services/MatrixProfileService";
import { MatrixPresenceService } from "../services/MatrixPresenceService";
import { isDemoMode } from "../config/SovereignConfig";
import { failed, loading, ready, unavailable, type SovereignResource } from "../types/resource";
import type {
    SharedConversation,
    SharedFile,
    SovereignDevice,
    SovereignProfile,
} from "../types/profile";

export interface ProfileView {
    profile: SovereignProfile | null;
    sharedConversations: SharedConversation[];
    sharedFiles: SharedFile[];
}

const EMPTY_VIEW: ProfileView = { profile: null, sharedConversations: [], sharedFiles: [] };

/**
 * PR-1 / PR-3: a person, and what the reader shares with them.
 *
 * FR-1: Demo Mode holds no profile data of its own, so the surface presents its
 * unavailable state there rather than a fabricated person.
 */
export function useProfile(userId: string | null): SovereignResource<ProfileView> {
    const demo = isDemoMode();
    const [version, setVersion] = useState(0);

    // FR-13: availability is part of a profile, so the profile follows it.
    useEffect(() => {
        if (demo || !userId) return;
        return MatrixPresenceService.getInstance().subscribe(() => setVersion((v) => v + 1));
    }, [demo, userId]);

    return useMemo(() => {
        if (!userId) return unavailable(EMPTY_VIEW);
        if (demo) return unavailable(EMPTY_VIEW);

        void version;
        const service = MatrixProfileService.getInstance();
        const profile = service.getProfile(userId);
        if (!profile) return unavailable(EMPTY_VIEW);

        return ready(
            {
                profile,
                sharedConversations: service.getSharedConversations(userId),
                sharedFiles: service.getSharedFiles(userId),
            },
            false,
        );
    }, [demo, userId, version]);
}

/** PR-8: the account's own sessions, read-only. */
export function useSessions(enabled: boolean): SovereignResource<SovereignDevice[]> {
    const demo = isDemoMode();
    const [state, setState] = useState<SovereignResource<SovereignDevice[]>>(() => loading([]));

    useEffect(() => {
        if (!enabled) return;
        if (demo) {
            setState(unavailable([]));
            return;
        }

        let live = true;
        setState(loading([]));

        MatrixProfileService.getInstance()
            .getDevices()
            .then((devices) => {
                if (live) setState(ready(devices));
            })
            .catch(() => {
                // ES-5: a failure is reported as one, with a retry offered by
                // the surface, rather than presented as "no sessions".
                if (live) setState(failed([]));
            });

        return () => {
            live = false;
        };
    }, [demo, enabled]);

    return state;
}

export interface ProfileEditing {
    /** PR-4: the user's own display name. */
    setDisplayName: (name: string) => Promise<void>;
    /** PR-4: the user's own status message. */
    setStatusMessage: (message: string) => Promise<void>;
    /** PR-4: the user's own avatar, already transferred to the platform. */
    setAvatar: (contentUri: string) => Promise<void>;
}

export function useProfileEditing(): ProfileEditing {
    const demo = isDemoMode();
    const service = MatrixProfileService.getInstance();

    return useMemo<ProfileEditing>(
        () => ({
            setDisplayName: async (name) => {
                if (demo) return;
                await service.setDisplayName(name);
            },
            setStatusMessage: async (message) => {
                if (demo) return;
                await service.setStatusMessage(message);
            },
            setAvatar: async (contentUri) => {
                if (demo) return;
                await service.setAvatar(contentUri);
            },
        }),
        [demo, service],
    );
}

/** PR-3: open, or open a new, direct conversation with this person. */
export function useStartDirectConversation(): (userId: string) => Promise<string | null> {
    const demo = isDemoMode();

    return useCallback(
        async (userId: string) => {
            if (demo) return null;
            return MatrixProfileService.getInstance().startDirectConversation(userId);
        },
        [demo],
    );
}
