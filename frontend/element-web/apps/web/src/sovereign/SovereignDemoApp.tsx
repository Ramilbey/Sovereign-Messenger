/*
 * Sovereign Messenger — Sprint 1, Step 7 Architectural Foundation
 * SovereignDemoApp.tsx — Root component for SOVEREIGN_MODE.
 *
 * Wraps main layout shell with PermissionProvider, ChatProvider & PolicyModal.
 */

import React, { useState, type JSX } from "react";
import { DemoLogin, type DemoUser } from "./pages/DemoLogin";
import { SovereignLayout } from "./components/layout/SovereignLayout";
import { PermissionProvider } from "./context/PermissionContext";
import { ChatProvider } from "./context/ChatContext";
import { PolicyModal } from "./components/policy/PolicyModal";

type SessionState = DemoUser | null;

export function SovereignDemoApp(): JSX.Element {
    const [currentUser, setCurrentUser] = useState<SessionState>(null);

    // ── Login screen ──────────────────────────────────────────────────────────
    if (currentUser === null) {
        return <DemoLogin onLogin={(user) => setCurrentUser(user)} />;
    }

    // ── Main app shell with PermissionProvider & ChatProvider ───────────────
    return (
        <PermissionProvider currentUser={currentUser}>
            <ChatProvider>
                <div id="sovereign-app">
                    <PolicyModal />

                    {/* Temporary logout overlay */}
                    <button
                        id="sovereign-logout-btn"
                        onClick={() => setCurrentUser(null)}
                        style={{
                            position: "fixed",
                            bottom: "12px",
                            right: "12px",
                            zIndex: 9999,
                            padding: "6px 14px",
                            background: "#eee",
                            border: "1px solid #999",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                        }}
                    >
                        Chiqish ({currentUser.displayName} — {currentUser.role})
                    </button>

                    <SovereignLayout />
                </div>
            </ChatProvider>
        </PermissionProvider>
    );
}
