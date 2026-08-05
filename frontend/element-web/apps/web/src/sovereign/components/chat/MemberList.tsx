/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * MemberList.tsx — Conversation Participants
 *
 * FR-45: a user can view the full participant list of any conversation they
 * belong to, with roles.
 * COM-4: conversation membership is visible to all participants.
 *
 * ES-1: the four states come from the shared boundary, so this surface cannot
 * omit one or invent its own copy.
 */

import React, { memo, type JSX } from "react";

import { MemberListItem } from "./MemberListItem";
import { ModuleStateBoundary } from "../views/ModuleStateBoundary";
import { MEMBER_COPY } from "../../config/chatCopy";
import type { SovereignMember } from "../../types/member";
import type { SovereignPresence } from "../../types/presence";
import type { ResourceState } from "../../types/resource";

interface MemberListProps {
    members: SovereignMember[];
    state: ResourceState;
    /** FR-13: availability per participant, where reported. */
    presence?: ReadonlyMap<string, SovereignPresence>;
    onSelectMember?: (memberId: string) => void;
    onRetry?: () => void;
}

export const MemberList = memo(function MemberList({
    members,
    state,
    presence,
    onSelectMember,
    onRetry,
}: MemberListProps): JSX.Element {
    return (
        <section className="svr-member-list" aria-label={MEMBER_COPY.listLabel}>
            <h3 className="svr-member-list__heading">
                {MEMBER_COPY.listLabel}
                {state === "ready" && (
                    <span className="svr-member-list__count">{members.length}</span>
                )}
            </h3>

            <ModuleStateBoundary state={state} surface="members" onRetry={onRetry} loadingRows={4}>
                <ul className="svr-member-list__items">
                    {members.map((member) => (
                        <MemberListItem
                            key={member.id}
                            member={member}
                            presence={presence?.get(member.id)}
                            onSelect={onSelectMember}
                        />
                    ))}
                </ul>
            </ModuleStateBoundary>
        </section>
    );
});
