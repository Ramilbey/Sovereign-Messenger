/*
 * Sovereign Messenger — Step 8
 * MembersView.tsx — Workspace view for Members/Users module.
 * TOK-13 / AC-16: institutional iconography, never an emoji.
 * Backed by useUsers() hook.
 */

import React, { memo, type JSX } from "react";
import { useUsers } from "../../providers/useSovereignData";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import { Icon } from "../ui";
import { roleLabel } from "../../config/roleCopy";
import "./ModuleViews.css";

export const MembersView = memo(function MembersView(): JSX.Element {
    const { data: users, state } = useUsers();

    return (
        <div id="module-view-members" className="svr-module-view-root">
            <div className="svr-module-header">
                <Icon name="people" size="md" className="svr-module-header-icon" />
                <span className="svr-module-header-title">Xodimlar</span>
                {state === "ready" && (<span className="svr-module-header-count">{users.length} ta xodim</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="members">
            <div className="svr-members-grid">
                {users.map((user) => (
                    <div key={user.id} className="svr-member-card">
                        <div className="svr-member-avatar">{user.avatarInitials}</div>
                        <div>
                            <div className="svr-member-name">{user.displayName}</div>
                            <div className="svr-member-role">
                                {roleLabel(user.role)}
                            </div>
                            <div className="svr-member-dept">
                                <span className={`svr-member-status-pill ${user.status}`} />
                                {user.department || "Tergov bo'limi"} • {user.statusLabel}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            </ModuleStateBoundary>
        </div>
    );
});
