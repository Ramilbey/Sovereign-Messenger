/*
 * Sovereign Messenger — Sprint 1, Step 6 / Step 8
 * SovereignLayout.tsx — Root layout shell with PermissionContext integration.
 *
 * Blueprint §6 Split Layout Architecture:
 * Contains permanently visible ChatArea on the left and WorkspaceArea on the right.
 */

import React, { useState, useCallback, type JSX } from "react";

import "./SovereignLayout.css";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatArea } from "./ChatArea";
import { WorkspaceArea } from "./WorkspaceArea";
import { RightPanel } from "./RightPanel";
import { usePermissions } from "../../context/PermissionContext";
import { useChat } from "../../context/ChatContext";
import { useChannels } from "../../providers/useSovereignData";

export function SovereignLayout(): JSX.Element {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("tergov");
    const [activeModuleId, setActiveModuleId] = useState<string>("channels");
    const { getAllowedModules } = usePermissions();
    const { setActiveChannelId } = useChat();
    const { channels, groups } = useChannels();

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

            {/* Column 2, row 2 — contains ChatArea + WorkspaceArea side by side */}
            <div className="svr-main">
                <ChatArea />
                <WorkspaceArea activeModuleId={activeModuleId} />
            </div>

            {/* Column 3 — full height */}
            <RightPanel />
        </div>
    );
}
