/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * ModulePlaceholderView.tsx — Module Unavailable State
 *
 * Implements FR-2: a module with no authoritative data source in the current
 * release presents a defined "not yet available" state naming the module. It
 * does not present substitute content.
 *
 * ES-2: this is the *unavailable* state, visually distinct from *empty*. The
 * module is not broken and is not waiting for data — it is simply not part of
 * this release.
 */

import React, { memo, type JSX } from "react";

import { EmptyState } from "../ui";
import { TERGOV_WORKSPACE_MODULES } from "../../config/workspaceModules";
import { SURFACE_COPY } from "../../config/stateCopy";

interface Props {
    activeModuleId: string;
}

export const ModulePlaceholderView = memo(function ModulePlaceholderView({
    activeModuleId,
}: Props): JSX.Element {
    const currentModule = TERGOV_WORKSPACE_MODULES.find((m) => m.id === activeModuleId);
    const label = currentModule?.label ?? activeModuleId;

    return (
        <div id={`module-view-${activeModuleId}`} className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-title">{label}</span>
            </div>

            <div className="svr-module-state">
                <EmptyState
                    variant="unavailable"
                    icon="lock"
                    title={label}
                    description={SURFACE_COPY.tasks.unavailable}
                />
            </div>
        </div>
    );
});
