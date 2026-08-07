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
 * NAV-4 / SR-2: the global search entry point sits here, and the same search
 * is reachable by keyboard from anywhere in the application.
 */

import React, { memo, type JSX } from "react";

import { Breadcrumb } from "../navigation/Breadcrumb";
import { Avatar, Badge, ConnectionStatus, IconButton } from "../ui";
import { SEARCH_COPY } from "../../config/searchCopy";
import { NOTIFICATION_COPY } from "../../config/notificationCopy";
import { hasUnread, type UnreadSummary } from "../../types/notification";
import { FRAME_COPY } from "../../config/navigationCopy";
import type { ConnectionState } from "../../services/ConnectionStateService";
import type { OrgLanguage, OrgNode } from "../../types/organisation";
import type { SovereignUser } from "../../providers/useSovereignData";
import { ROLE_LABELS } from "../../config/roleCopy";
import "./frame.css";

interface TopbarProps {
    /** NAV-4: opens global search. */
    onOpenSearch: () => void;
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
    /** NT-3: opens the notification centre. */
    onOpenNotifications: () => void;
    /** NT-1: what is waiting across the whole organisation. */
    unread: UnreadSummary;
}

export const Topbar = memo(function Topbar({
    path,
    onSelectNode,
    code,
    connectionState,
    currentUser,
    departmentLabel,
    onOpenSearch,
    onOpenNotifications,
    unread,
    language = "uz",
}: TopbarProps): JSX.Element {
    return (
        <header id="sovereign-topbar" className="svr-topbar" aria-label={FRAME_COPY.headerLabel}>
            {/* UI-9 / UI-11: institutional identity and organisational context. */}
            <div className="svr-topbar__identity">
                <span className="svr-topbar__emblem" aria-hidden="true" />
                {/* A11Y-6: the product name is the document's top-level heading. */}
                <h1 className="svr-topbar__product">{FRAME_COPY.productName}</h1>
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
                {/* NAV-4 / SR-2: present in the header, and reachable by
                    keyboard from anywhere (the shortcut is bound at the frame). */}
                <IconButton
                    icon="search"
                    label={`${SEARCH_COPY.open} (${SEARCH_COPY.shortcutHint})`}
                    variant="ghost"
                    onClick={onOpenSearch}
                />

                {/*
                  * NT-1 / NT-3: the organisation-level total, and the way in
                  * to what produced it. The control states what is waiting, so
                  * the badge is not the only carrier (A11Y-5, A11Y-6).
                  */}
                <span className="svr-topbar__notifications">
                    <IconButton
                        icon="bell"
                        label={NOTIFICATION_COPY.openWith(unread.unread, unread.mentions)}
                        variant="ghost"
                        onClick={onOpenNotifications}
                    />
                    {hasUnread(unread) && (
                        <Badge
                            count={unread.mentions > 0 ? unread.mentions : unread.unread}
                            tone={unread.mentions > 0 ? "mention" : "unread"}
                            label={NOTIFICATION_COPY.aggregateLabel(unread.unread, unread.mentions)}
                            className="svr-topbar__notifications-badge"
                        />
                    )}
                </span>

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
