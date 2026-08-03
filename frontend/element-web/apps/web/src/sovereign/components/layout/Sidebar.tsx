/*
 * Sovereign Messenger — Sprint 1, Step 6
 * Sidebar.tsx — Left navigation panel with role-filtered Workspace Navigation.
 */

import React, { type JSX } from "react";
import { GovernmentNavigation } from "../navigation/GovernmentNavigation";
import { WorkspaceNavigation } from "../navigation/WorkspaceNavigation";
import type { WorkspaceModuleItem } from "../../config/workspaceModules";

interface SidebarProps {
    activeWorkspaceId?: string;
    onSelectWorkspace?: (workspaceId: string) => void;
    activeModuleId: string;
    onSelectModule: (moduleId: string) => void;
    modules?: WorkspaceModuleItem[];
}

export function Sidebar({
    activeWorkspaceId = "tergov",
    onSelectWorkspace,
    activeModuleId,
    onSelectModule,
    modules,
}: SidebarProps): JSX.Element {
    return (
        <div id="sovereign-sidebar" className="svr-sidebar">
            {/* Step 3: Government Navigation */}
            <GovernmentNavigation
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={onSelectWorkspace}
            />

            <div className="svr-sidebar-divider" />

            {/* Step 4 & 6: Role-filtered Workspace Navigation */}
            <WorkspaceNavigation
                activeModuleId={activeModuleId}
                onSelectModule={onSelectModule}
                modules={modules}
            />
        </div>
    );
}
