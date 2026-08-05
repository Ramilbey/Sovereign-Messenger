/*
 * Sovereign Messenger — Sprint 1, Step 6 / Step 8
 * SovereignLayout.tsx — Root layout shell with PermissionContext integration.
 *
 * Blueprint §6 Split Layout Architecture:
 * Contains permanently visible ChatArea on the left and WorkspaceArea on the right.
 */

import React, { useState, useCallback, useEffect, type JSX } from "react";

// Sprint 3 design tokens (PRD Appendix A). Imported at the layout root so the
// token custom properties are available to every Sovereign surface. Defining a
// custom property has no rendering effect until it is referenced, so this is
// visually inert until surfaces are migrated onto the tokens.
import "../../styles/tokens.css";
import "./SovereignLayout.css";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatArea } from "./ChatArea";
import { WorkspaceArea } from "./WorkspaceArea";
import { RightPanel } from "./RightPanel";
import { usePermissions } from "../../context/PermissionContext";
import { useChat } from "../../context/ChatContext";
import { useChannels } from "../../providers/useSovereignData";
import { useConnectionState } from "../../hooks/useConnectionState";
import { SessionLifecycleService } from "../../services/SessionLifecycleService";
import { ConnectionBanner } from "../ui";

export function SovereignLayout(): JSX.Element {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("tergov");
    const [activeModuleId, setActiveModuleId] = useState<string>("channels");
    const { getAllowedModules } = usePermissions();
    const { setActiveChannelId } = useChat();
    const { data: { channels, groups } } = useChannels();
    const connectionState = useConnectionState();

    // Observe sign-out so locally held drafts and outbox records do not
    // outlive the session on a shared workstation. Idempotent.
    useEffect(() => {
        SessionLifecycleService.getInstance().initialize();
    }, []);

    const allowedModules = getAllowedModules();

    const handleSelectModule = useCallback(
        (modId: string) => {
            setActiveModuleId(modId);

            // Automatically synchronize active channel in ChatArea based on selected navigation category
            if (modId === "groups" && groups.length > 0) {
                setActiveChannelId(groups[0].id); // Default to 'group_umumiy'
            } else if (modId === "channels" && channels.length > 0) {
                setActiveChannelId(channels[0].id); // Default to 'channel_elonlar'
            }
        },
        [channels, groups, setActiveChannelId]
    );

    return (
        <div id="sovereign-layout" className="svr-layout">
            {/* Column 1 — full height */}
            <Sidebar
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={(wsId) => setActiveWorkspaceId(wsId)}
                activeModuleId={activeModuleId}
                onSelectModule={handleSelectModule}
                modules={allowedModules}
            />

            {/* Column 2, row 1 */}
            <Topbar />

            {/*
              * Column 2, row 2 — ChatArea + WorkspaceArea side by side.
              * SUX-16: connection state appears in one consistent location,
              * directly above the working area. SUX-5: it is non-blocking —
              * the content below stays readable and interactive.
              */}
            <div className="svr-main">
                <ConnectionBanner state={connectionState} />
                <div className="svr-main-content">
                    <ChatArea />
                    <WorkspaceArea activeModuleId={activeModuleId} />
                </div>
            </div>

            {/* Column 3 — full height */}
            <RightPanel />
        </div>
    );
}
