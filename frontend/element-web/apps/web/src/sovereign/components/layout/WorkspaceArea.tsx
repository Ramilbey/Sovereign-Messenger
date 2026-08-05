/*
 * Sovereign Messenger — Step 8 · Sprint 3, Milestone 3
 * WorkspaceArea.tsx — Module Host
 *
 * IA-9: modules are scoped to the current organisational position; the host
 * renders whichever module the frame has selected.
 * UI-15: at standard width it overlays the conversation column rather than
 * compressing it, so the primary surface keeps its width (UX-2).
 */

import React, { type JSX } from "react";

import { ModuleWorkspaceView } from "../views/ModuleWorkspaceView";
import { IconButton } from "../ui";
import { FRAME_COPY } from "../../config/navigationCopy";

interface WorkspaceAreaProps {
    activeModuleId: string;
    overlay?: boolean;
    onClose?: () => void;
}

export function WorkspaceArea({
    activeModuleId,
    overlay = false,
    onClose,
}: WorkspaceAreaProps): JSX.Element {
    return (
        <section
            id="sovereign-workspace-area"
            className={`svr-workspace-area${overlay ? " is-overlay" : ""}`}
        >
            {onClose && (
                <div className="svr-workspace-area__controls">
                    <IconButton
                        icon="close"
                        label={FRAME_COPY.closePanel}
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    />
                </div>
            )}

            <ModuleWorkspaceView activeModuleId={activeModuleId} />
        </section>
    );
}
