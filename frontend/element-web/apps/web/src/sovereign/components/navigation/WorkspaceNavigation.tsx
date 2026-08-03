/*
 * Sovereign Messenger — Sprint 1, Step 4
 * WorkspaceNavigation.tsx — Tergov Workspace navigation list component.
 *
 * Blueprint §3.2 & §6:
 * Receives module definitions from workspaceModules config.
 */

import React, { type JSX } from "react";
import {
    type WorkspaceModuleItem,
    TERGOV_WORKSPACE_MODULES,
} from "../../config/workspaceModules";

interface Props {
    activeModuleId: string;
    onSelectModule: (moduleId: string) => void;
    modules?: WorkspaceModuleItem[];
}

export function WorkspaceNavigation({
    activeModuleId,
    onSelectModule,
    modules = TERGOV_WORKSPACE_MODULES,
}: Props): JSX.Element {
    const universalModules = modules.filter((m) => m.category === "universal");
    const specialModules = modules.filter((m) => m.category === "special");
    const personalModules = modules.filter((m) => m.category === "personal");
    const favoriteModules = modules.filter((m) => m.category === "favorites");
    const settingsModules = modules.filter((m) => m.category === "settings");

    const renderModuleList = (items: WorkspaceModuleItem[]) => (
        <ul className="svr-workspace-nav-list">
            {items.map((item) => {
                const isActive = item.id === activeModuleId;
                return (
                    <li key={item.id} className="svr-workspace-nav-item">
                        <button
                            id={`ws-nav-item-${item.id}`}
                            className={`svr-workspace-nav-btn ${isActive ? "active" : ""}`}
                            onClick={() => onSelectModule(item.id)}
                        >
                            <span className="svr-workspace-nav-icon">{item.icon}</span>
                            <span className="svr-workspace-nav-label">{item.label}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );

    return (
        <div id="sovereign-workspace-nav" className="svr-workspace-nav">
            {/* 1. Universal Modules */}
            {universalModules.length > 0 && (
                <div className="svr-workspace-nav-section">
                    <div className="svr-workspace-nav-section-title">Universal Modullar</div>
                    {renderModuleList(universalModules)}
                </div>
            )}

            {specialModules.length > 0 && <div className="svr-workspace-nav-divider" />}

            {/* 2. Special Investigation Modules */}
            {specialModules.length > 0 && (
                <div className="svr-workspace-nav-section">
                    <div className="svr-workspace-nav-section-title">Tergov Modullari</div>
                    {renderModuleList(specialModules)}
                </div>
            )}

            {personalModules.length > 0 && <div className="svr-workspace-nav-divider" />}

            {/* 3. Personal Chats */}
            {personalModules.length > 0 && (
                <div className="svr-workspace-nav-section">
                    {renderModuleList(personalModules)}
                </div>
            )}

            {favoriteModules.length > 0 && <div className="svr-workspace-nav-divider" />}

            {/* 4. Favorites */}
            {favoriteModules.length > 0 && (
                <div className="svr-workspace-nav-section">
                    {renderModuleList(favoriteModules)}
                </div>
            )}

            {settingsModules.length > 0 && <div className="svr-workspace-nav-divider" />}

            {/* 5. General Settings */}
            {settingsModules.length > 0 && (
                <div className="svr-workspace-nav-section">
                    {renderModuleList(settingsModules)}
                </div>
            )}
        </div>
    );
}
