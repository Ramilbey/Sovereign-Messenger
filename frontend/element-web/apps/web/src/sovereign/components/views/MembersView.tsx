/*
 * Sovereign Messenger — Step 8
 * MembersView.tsx — Workspace view for Members/Users module.
 * Backed by useUsers() hook.
 */

import React, { memo, type JSX } from "react";
import { useUsers } from "../../providers/useSovereignData";
import "./ModuleViews.css";

const ROLE_LABELS: Record<string, string> = {
    Manager: "Rahbar",
    Employee: "Xodim",
    NationalAdmin: "Milliy Administrator",
};

export const MembersView = memo(function MembersView(): JSX.Element {
    const users = useUsers();

    return (
        <div id="module-view-members" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">👥</span>
                <span className="svr-module-header-title">Xodimlar</span>
                <span className="svr-module-header-count">{users.length} ta xodim</span>
            </div>

            <div className="svr-members-grid">
                {users.map((user) => (
                    <div key={user.id} className="svr-member-card">
                        <div className="svr-member-avatar">{user.avatarInitials}</div>
                        <div>
                            <div className="svr-member-name">{user.displayName}</div>
                            <div className="svr-member-role">
                                {ROLE_LABELS[user.role] || user.role}
                            </div>
                            <div className="svr-member-dept">
                                <span className={`svr-member-status-pill ${user.status}`} />
                                {user.department || "Tergov bo'limi"} • {user.statusLabel}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
