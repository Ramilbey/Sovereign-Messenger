/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * MemberListItem.tsx — CMP-12 Member List Item
 *
 * FR-45 / COM-4: a person within a conversation, with their name and their
 * organisational role where a source for it exists.
 *
 * States (CMP-12): default, hover, selected, inactive.
 *
 * EDGE-6: a person who has left is shown in an inactive treatment rather than
 * removed, so their historical messages remain attributed to someone the
 * reader can still identify.
 *
 * Presence (FR-13) is delivered with the presence capability in Milestone 4.
 * No availability is shown here, because none is known — an "offline" dot
 * would be an assertion about a colleague that no source supports (FR-1).
 */

import React, { memo, type JSX } from "react";

import { Avatar, Icon } from "../ui";
import { MEMBER_COPY } from "../../config/chatCopy";
import type { SovereignMember } from "../../types/member";

interface MemberListItemProps {
    member: SovereignMember;
    /** CMP-12 selected state, where the surface tracks a selection. */
    isSelected?: boolean;
    /** PR-2: opens the person's profile. Absent until profiles exist (M5). */
    onSelect?: (memberId: string) => void;
}

export const MemberListItem = memo(function MemberListItem({
    member,
    isSelected = false,
    onSelect,
}: MemberListItemProps): JSX.Element {
    const isInactive = member.status === "left";

    const content = (
        <>
            <Avatar
                name={member.displayName}
                id={member.id}
                src={member.avatarUrl}
                size="md"
            />

            <span className="svr-member-item__text">
                <span className="svr-member-item__name">{member.displayName}</span>

                <span className="svr-member-item__meta">
                    {/* GW-11: the official designation, only where it is known. */}
                    {member.role && <span>{member.role}</span>}

                    {/* A11Y-5: membership state is a label, never a colour. */}
                    {member.status === "invited" && <span>{MEMBER_COPY.invited}</span>}
                    {isInactive && <span>{MEMBER_COPY.departed}</span>}

                    {/*
                     * COM-2: who may post is part of understanding an official
                     * channel, where most participants read rather than write.
                     */}
                    {member.status === "joined" && !member.canPost && (
                        <span className="svr-member-item__readonly">
                            <Icon name="lock" size="sm" label={MEMBER_COPY.readOnly} />
                        </span>
                    )}
                </span>
            </span>
        </>
    );

    const className = [
        "svr-member-item",
        isInactive ? "is-inactive" : "",
        isSelected ? "is-selected" : "",
    ]
        .filter(Boolean)
        .join(" ");

    /*
     * UX-8: the row is only a control where it leads somewhere. Until profiles
     * exist there is nowhere to go, so it is presented as information rather
     * than as a button that does nothing when pressed.
     */
    if (!onSelect) {
        return <li className={className}>{content}</li>;
    }

    return (
        <li>
            <button
                type="button"
                className={className}
                aria-current={isSelected ? "true" : undefined}
                onClick={() => onSelect(member.id)}
            >
                {content}
            </button>
        </li>
    );
});
