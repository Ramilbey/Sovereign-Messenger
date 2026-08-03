/*
 * Sovereign Messenger — Sprint 1, Step 4 Refactoring
 * ModulePlaceholderView.tsx — Placeholder component for active workspace modules.
 *
 * Imports module metadata from workspaceModules config.
 */

import React, { type JSX } from "react";
import { TERGOV_WORKSPACE_MODULES } from "../../config/workspaceModules";

interface Props {
    activeModuleId: string;
}

export function ModulePlaceholderView({ activeModuleId }: Props): JSX.Element {
    const currentModule = TERGOV_WORKSPACE_MODULES.find((m) => m.id === activeModuleId) || {
        id: activeModuleId,
        label: activeModuleId,
        icon: "📂",
        category: "universal",
    };

    return (
        <div id={`module-view-${activeModuleId}`} className="svr-module-placeholder-view">
            <div className="svr-module-placeholder-header">
                <span className="svr-module-placeholder-icon">{currentModule.icon}</span>
                <span className="svr-module-placeholder-title">{currentModule.label}</span>
            </div>
            <div className="svr-module-placeholder-body">
                <p>
                    <strong>{currentModule.label}</strong> moduli ochildi.
                </p>
                <p className="svr-module-placeholder-sub">
                    (Sprint 1, Step 4 — Modul navigation skeleti. Fake ma&apos;lumotlar Step 5&apos;da yuklanadi).
                </p>
            </div>
        </div>
    );
}
