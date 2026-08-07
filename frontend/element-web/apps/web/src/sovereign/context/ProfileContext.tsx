/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * ProfileContext.tsx — Opening a Profile
 *
 * PR-2: a profile is openable from any surface where a person appears — a
 * member list, a message, a search result, the application frame.
 * PR-9 / AC-15: it is the same profile in every case. The surfaces ask for a
 * person to be shown; only this provider decides what showing them looks like,
 * so the presentation cannot drift between the places it is opened from.
 */

import React, { createContext, useCallback, useContext, useMemo, useState, type JSX, type ReactNode } from "react";

import { ProfilePanel } from "../components/profile/ProfilePanel";

export interface ProfileViewer {
    /** PR-2: show this person. */
    openProfile: (userId: string) => void;
}

const ProfileContext = createContext<ProfileViewer | null>(null);

interface ProfileProviderProps {
    /** PR-3: how a conversation is opened when the profile leads to one. */
    onOpenConversation: (conversationId: string, eventId?: string) => void;
    children: ReactNode;
}

export function ProfileProvider({ onOpenConversation, children }: ProfileProviderProps): JSX.Element {
    const [userId, setUserId] = useState<string | null>(null);

    const openProfile = useCallback((id: string) => setUserId(id), []);
    const value = useMemo<ProfileViewer>(() => ({ openProfile }), [openProfile]);

    return (
        <ProfileContext.Provider value={value}>
            {children}

            {userId && (
                <ProfilePanel
                    userId={userId}
                    onClose={() => setUserId(null)}
                    onOpenConversation={onOpenConversation}
                />
            )}
        </ProfileContext.Provider>
    );
}

/**
 * PR-2: opens a profile from wherever a person appears.
 *
 * Returns a no-op outside a provider rather than throwing: a surface that shows
 * people is legitimately rendered on its own in tests and in Demo Mode, and it
 * should present the person, not fail.
 */
export function useProfileViewer(): ProfileViewer {
    return useContext(ProfileContext) ?? { openProfile: () => undefined };
}
