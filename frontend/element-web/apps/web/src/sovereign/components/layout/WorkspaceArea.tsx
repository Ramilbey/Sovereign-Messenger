/*
 * Sovereign Messenger — Step 8
 * WorkspaceArea.tsx — Active workspace content panel container.
 *
 * Displays the selected module view via ModuleWorkspaceView dispatcher.
 */

import React, { type JSX } from "react";
import { ModuleWorkspaceView } from "../views/ModuleWorkspaceView";

interface WorkspaceAreaProps {
    activeModuleId: string;
}

export function WorkspaceArea({ activeModuleId }: WorkspaceAreaProps): JSX.Element {
    return (
        <div id="sovereign-workspace-area" className="svr-workspace-area" style={{ height: "100%", overflow: "hidden" }}>
            <ModuleWorkspaceView activeModuleId={activeModuleId} />
        </div>
    );
}
