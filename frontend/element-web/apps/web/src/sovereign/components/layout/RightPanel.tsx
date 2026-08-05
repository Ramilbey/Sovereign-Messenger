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

import React, { type JSX } from "react";

import { usePermissions } from "../../context/PermissionContext";
import { useUsers, useOrganization } from "../../providers/useSovereignData";
import { useFramePreferences } from "../../hooks/useFramePreferences";
import { Avatar, EmptyState, IconButton } from "../ui";
import { SURFACE_COPY } from "../../config/stateCopy";
import { FRAME_COPY } from "../../config/navigationCopy";
import { roleLabel } from "../../config/roleCopy";
import "./panel.css";

interface RightPanelProps {
    /** UI-15: rendered as an overlay rather than a column at standard width. */
    overlay?: boolean;
    onClose?: () => void;
}

export function RightPanel({ overlay = false, onClose }: RightPanelProps): JSX.Element {
    const { currentUser } = usePermissions();
    const { data: users, state: usersState } = useUsers();
    const { data: org } = useOrganization(currentUser.department);
    const { preferences, update } = useFramePreferences();

    const staffReady = usersState === "ready";

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
                <div className="svr-panel-identity">
                    <Avatar name={currentUser.displayName} id={currentUser.id} size="lg" />
                    <div className="svr-panel-identity__text">
                        <p className="svr-panel-identity__name">{currentUser.displayName}</p>
                        <p className="svr-panel-identity__role">{roleLabel(currentUser.role)}</p>
                    </div>
                </div>
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
             * FR-17: the departmental staff panel presents real colleagues with
             * real presence. That data arrives with the presence capability in
             * Milestone 4; until then the surface states its position honestly
             * rather than inventing staff (FR-1, ES-2).
             */}
            <section className="svr-panel-section">
                <h2 className="svr-panel-section__heading">{FRAME_COPY.panelStaff}</h2>

                {staffReady ? (
                    <ul className="svr-panel-staff">
                        {users.map((user) => (
                            <li key={user.id} className="svr-panel-staff__item">
                                <span className="svr-panel-staff__name">{user.displayName}</span>
                                <span className="svr-panel-staff__status">{user.statusLabel}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <EmptyState
                        variant={usersState === "unavailable" ? "unavailable" : "empty"}
                        title={
                            usersState === "unavailable"
                                ? (SURFACE_COPY.members.unavailable ?? SURFACE_COPY.members.empty)
                                : SURFACE_COPY.members.empty
                        }
                    />
                )}
            </section>

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
