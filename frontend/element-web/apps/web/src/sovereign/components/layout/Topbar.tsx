/*
 * Sovereign Messenger — Sprint 1, Step 2 · Sprint 3, Milestone 3
 * Topbar.tsx — CMP-18 Application Header
 *
 * UX-1: the frame answers "where am I in the organisation?" and "what is the
 * state of the system?" without the user navigating anywhere.
 *
 * UI-9 / UI-11: carries the institutional identity and a designated region for
 * organisational and sensitivity context.
 * ORG-7: the current node's display name and code are visible in the frame.
 * PR-7: the current user's identity, role, and department are always visible.
 * SUX-16: connection state occupies one consistent location.
 * NAV-5: breadcrumbs are navigable at every level.
 *
 * UI-8 (State Emblem): the emblem is a controlled state symbol governed by
 * usage rules and is supplied by deployment configuration. Its region is
 * reserved here and rendered only when the deployment provides the asset —
 * an improvised substitute would misrepresent state identity. Sourcing and
 * approving the asset is branding deliverable D-2.
 *
 * NAV-4 (global search): the header reserves the search region. The control
 * arrives with the search capability in Milestone 5; presenting a search field
 * that cannot search would be a surface that does not tell the truth.
 */

import React, { memo, type JSX } from "react";

import { Breadcrumb } from "../navigation/Breadcrumb";
import { Avatar, ConnectionStatus } from "../ui";
import { FRAME_COPY } from "../../config/navigationCopy";
import type { ConnectionState } from "../../services/ConnectionStateService";
import type { OrgLanguage, OrgNode } from "../../services/OrganisationService";
import type { SovereignUser } from "../../providers/useSovereignData";
import { ROLE_LABELS } from "../../config/roleCopy";
import "./frame.css";

interface TopbarProps {
    /** NAV-5: root → current node, inclusive. */
    path: OrgNode[];
    onSelectNode: (nodeId: string) => void;
    /** ORG-7: identifying code of the current node, where the model declares one. */
    code: string | null;
    connectionState: ConnectionState;
    currentUser: SovereignUser;
    /**
     * PR-7: the department as the organisation model names it. The identity
     * data carries an internal reference rather than a display name, and
     * NFR-8 forbids showing an internal identifier to a user.
     */
    departmentLabel: string | null;
    language?: OrgLanguage;
}

export const Topbar = memo(function Topbar({
    path,
    onSelectNode,
    code,
    connectionState,
    currentUser,
    departmentLabel,
    language = "uz",
}: TopbarProps): JSX.Element {
    return (
        <header id="sovereign-topbar" className="svr-topbar" aria-label={FRAME_COPY.headerLabel}>
            {/* UI-9 / UI-11: institutional identity and organisational context. */}
            <div className="svr-topbar__identity">
                <span className="svr-topbar__emblem" aria-hidden="true" />
                <span className="svr-topbar__product">{FRAME_COPY.productName}</span>
                {code && (
                    <span className="svr-topbar__code" title={FRAME_COPY.organisationCode}>
                        <span className="svr-visually-hidden">{`${FRAME_COPY.organisationCode}: `}</span>
                        {code}
                    </span>
                )}
            </div>

            <div className="svr-topbar__context">
                <Breadcrumb path={path} onSelectNode={onSelectNode} language={language} />
            </div>

            <div className="svr-topbar__system">
                <ConnectionStatus state={connectionState} />

                {/* PR-7: identity, role, and department, always visible. */}
                <div className="svr-topbar__user">
                    <Avatar name={currentUser.displayName} id={currentUser.id} size="sm" />
                    <span className="svr-topbar__user-text">
                        <span className="svr-topbar__user-name">{currentUser.displayName}</span>
                        <span className="svr-topbar__user-role">
                            {ROLE_LABELS[currentUser.role]}
                            {departmentLabel ? ` · ${departmentLabel}` : ""}
                        </span>
                    </span>
                </div>
            </div>
        </header>
    );
});
