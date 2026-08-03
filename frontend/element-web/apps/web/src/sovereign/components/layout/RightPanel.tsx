/*
 * Sovereign Messenger — Step 8
 * RightPanel.tsx — Contextual right panel displaying user profile & team status.
 *
 * Blueprint §6: "Right Panel: a'zolar ro'yxati / fayl/hujjatlar (kontekstga qarab)"
 */

import React, { type JSX } from "react";
import { usePermissions } from "../../context/PermissionContext";
import { useUsers, useOrganization } from "../../providers/useSovereignData";

export function RightPanel(): JSX.Element {
    const { currentUser } = usePermissions();
    const users = useUsers();
    const org = useOrganization();

    const onlineCount = users.filter((u) => u.status === "online").length;

    return (
        <div id="sovereign-right-panel" className="svr-right-panel" style={{ padding: "16px", color: "#ffffff" }}>
            {/* Active User Card */}
            <div style={{ background: "#17212b", border: "1px solid #2b3a4a", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: "#7d8e9e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Joriy Foydalanuvchi
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#2b5278", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "13px" }}>
                        {currentUser.avatarInitials}
                    </div>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: "600" }}>{currentUser.displayName}</div>
                        <div style={{ fontSize: "12px", color: "#5288c1" }}>{currentUser.role}</div>
                    </div>
                </div>
            </div>

            {/* Organization Info */}
            <div style={{ background: "#17212b", border: "1px solid #2b3a4a", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: "#7d8e9e", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Tashkilot
                </div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>{org.workspaceName}</div>
                <div style={{ fontSize: "12px", color: "#7d8e9e", marginTop: "4px" }}>
                    {org.region} • {org.department}
                </div>
            </div>

            {/* Quick Online Team Status */}
            <div style={{ background: "#17212b", border: "1px solid #2b3a4a", borderRadius: "10px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#7d8e9e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Xodimlar Statusi
                    </span>
                    <span style={{ fontSize: "11px", color: "#4caf50", fontWeight: "600" }}>
                        {onlineCount} online
                    </span>
                </div>

                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {users.slice(0, 5).map((user) => (
                        <li key={user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", fontSize: "12px" }}>
                            <span style={{ color: "#ffffff" }}>{user.displayName}</span>
                            <span style={{ color: user.status === "online" ? "#4caf50" : "#7d8e9e", fontSize: "11px" }}>
                                {user.statusLabel}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
