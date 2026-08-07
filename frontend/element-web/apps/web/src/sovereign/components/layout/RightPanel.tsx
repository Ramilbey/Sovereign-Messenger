/*
 * Sovereign Messenger — Step 8 · Sprint 3, Milestone 3
 * RightPanel.tsx — CMP-53 Supporting Panel
 *
 * Blueprint §6: "Right Panel: a'zolar ro'yxati / fayl/hujjatlar (kontekstga qarab)"
 *
 * UX-2: a supporting surface. It is secondary to the conversation column and
 * never competes with it for width — at standard it overlays rather than
 * compresses (UI-15), and at compact it is not present at all (UI-16).
 * UI-19: hosts the message density control.
 */

import React, { useMemo, type JSX } from "react";

import { usePermissions } from "../../context/PermissionContext";
import { useChat } from "../../context/ChatContext";
import { useMembers } from "../../hooks/useMembers";
import { usePresenceFor } from "../../hooks/usePresence";
import { useOrganization } from "../../providers/useSovereignData";
import { useFramePreferences } from "../../hooks/useFramePreferences";
import { useProfileViewer } from "../../context/ProfileContext";
import { Avatar, IconButton } from "../ui";
import { MemberList } from "../chat/MemberList";
import { FRAME_COPY } from "../../config/navigationCopy";
import { roleLabel } from "../../config/roleCopy";
import { PROFILE_COPY } from "../../config/profileCopy";
import "./panel.css";

interface RightPanelProps {
    /** UI-15: rendered as an overlay rather than a column at standard width. */
    overlay?: boolean;
    onClose?: () => void;
}

export function RightPanel({ overlay = false, onClose }: RightPanelProps): JSX.Element {
    const { currentUser } = usePermissions();
    const { activeChannelId } = useChat();
    const { data: members, state: membersState } = useMembers(activeChannelId);
    const memberIds = useMemo(() => members.map((member) => member.id), [members]);
    const presence = usePresenceFor(memberIds);
    const { data: org } = useOrganization(currentUser.department);
    const { preferences, update } = useFramePreferences();
    // PR-2: every person on this panel leads to the same profile.
    const { openProfile } = useProfileViewer();

    return (
        <aside
            id="sovereign-right-panel"
            className={`svr-right-panel${overlay ? " is-overlay" : ""}`}
            aria-label={FRAME_COPY.panelLabel}
        >
            {onClose && (
                <div className="svr-panel-section__controls">
                    <IconButton
                        icon="close"
                        label={FRAME_COPY.closePanel}
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    />
                </div>
            )}

            {/* PR-7: the signed-in user's identity and official role. */}
            <section className="svr-panel-section">
                <h2 className="svr-panel-section__heading">{FRAME_COPY.panelCurrentUser}</h2>
                {/* PR-4: the user reaches their own profile from the frame. */}
                <button
                    type="button"
                    className="svr-panel-identity"
                    aria-label={PROFILE_COPY.open(currentUser.displayName)}
                    onClick={() => openProfile(currentUser.id)}
                >
                    <Avatar name={currentUser.displayName} id={currentUser.id} size="lg" />
                    <div className="svr-panel-identity__text">
                        <p className="svr-panel-identity__name">{currentUser.displayName}</p>
                        <p className="svr-panel-identity__role">{roleLabel(currentUser.role)}</p>
                    </div>
                </button>
            </section>

            {/* ORG-7: the organisational identity of the current position. */}
            <section className="svr-panel-section">
                <h2 className="svr-panel-section__heading">{FRAME_COPY.panelOrganisation}</h2>
                <p className="svr-panel-value">{org.workspaceName}</p>
                <p className="svr-panel-meta">
                    {[org.region, org.department].filter(Boolean).join(" · ")}
                </p>
            </section>

            {/*
             * FR-45 / COM-4: the participants of the open conversation, read
             * from its real membership.
             *
             * FR-17's departmental staff overview, ordered by availability, is
             * the presence capability delivered in Milestone 4. Ordering by an
             * availability nobody reports would be ordering by nothing.
             */}
            <MemberList
                members={members}
                state={membersState}
                presence={presence}
                onSelectMember={openProfile}
            />

            {/* UI-19: message density, selectable by the user and persisted. */}
            <section className="svr-panel-section">
                <h2 className="svr-panel-section__heading">{FRAME_COPY.panelDisplay}</h2>

                <fieldset className="svr-panel-choice">
                    <legend className="svr-panel-choice__legend">{FRAME_COPY.densityLabel}</legend>

                    {(
                        [
                            ["comfortable", FRAME_COPY.densityComfortable],
                            ["compact", FRAME_COPY.densityCompact],
                        ] as const
                    ).map(([value, label]) => (
                        <label key={value} className="svr-panel-choice__option">
                            <input
                                type="radio"
                                name="svr-density"
                                value={value}
                                checked={preferences.density === value}
                                onChange={() => update({ density: value })}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </fieldset>
            </section>
        </aside>
    );
}
