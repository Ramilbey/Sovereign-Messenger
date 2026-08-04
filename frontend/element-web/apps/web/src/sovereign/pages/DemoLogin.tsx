/*
 * Sovereign Messenger — Sprint 1, Step 5
 * DemoLogin.tsx — Demo profile selection screen.
 *
 * Blueprint §9: Uses useUsers() hook to fetch user profiles.
 */

import React, { type JSX } from "react";
import { useUsers, type SovereignUser } from "../providers/useSovereignData";

export type DemoUser = SovereignUser;

interface Props {
    /** Called when a user profile is selected. Parent will store the selection. */
    onLogin: (user: DemoUser) => void;
}

/**
 * Role label map — Uzbek display names per role.
 */
const ROLE_LABELS: Record<DemoUser["role"], string> = {
    Manager: "Rahbar",
    Employee: "Xodim",
    NationalAdmin: "Milliy Administrator",
};

/**
 * DemoLogin — renders a list of demo users from useUsers().
 * Selecting a user calls onLogin(user), which causes SovereignDemoApp
 * to transition from the login screen to the main application shell.
 */
export function DemoLogin({ onLogin }: Props): JSX.Element {
    // Demo Mode always resolves to the demonstration dataset (ADR-004).
    const { data: users } = useUsers();

    return (
        <div
            id="sovereign-demo-login"
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0e1621",
                fontFamily: "sans-serif",
            }}
        >
            <div
                style={{
                    background: "#17212b",
                    border: "1px solid #2b3a4a",
                    borderRadius: "12px",
                    padding: "32px",
                    width: "360px",
                }}
            >
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "28px" }}>
                    <div
                        style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#ffffff",
                            marginBottom: "6px",
                        }}
                    >
                        🏛 Sovereign Messenger
                    </div>
                    <div style={{ fontSize: "13px", color: "#7d8e9e" }}>
                        Demo profil tanlang (Sprint 1)
                    </div>
                </div>

                {/* User list */}
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                    {users.map((user) => (
                        <li key={user.id} style={{ marginBottom: "10px" }}>
                            <button
                                id={`demo-login-${user.id}`}
                                onClick={() => onLogin(user)}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "14px",
                                    background: "#1e2d3d",
                                    border: "1px solid #2b3a4a",
                                    borderRadius: "10px",
                                    padding: "12px 14px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    color: "#ffffff",
                                }}
                            >
                                {/* Avatar */}
                                <div
                                    aria-hidden="true"
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background: "#2b5278",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "700",
                                        fontSize: "14px",
                                        flexShrink: 0,
                                    }}
                                >
                                    {user.avatarInitials}
                                </div>

                                {/* Name + role */}
                                <div>
                                    <div style={{ fontWeight: "600", fontSize: "14px" }}>
                                        {user.displayName}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#5288c1" }}>
                                        {ROLE_LABELS[user.role]}
                                        {user.department ? ` — ${user.department}` : ""}
                                    </div>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
