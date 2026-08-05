/*
 * Sovereign Messenger — Sprint 1, Step 6 · Sprint 3, Milestone 3
 * Sidebar.tsx — CMP-14 Organisation Sidebar
 *
 * NAV-1: presents the hierarchy and the module list for the current position,
 * and is collapsible. The sidebar owns the shell only — the tree and the
 * module list are separate components, so neither grows into the other.
 */

import React, { type JSX } from "react";

import { GovernmentNavigation } from "../navigation/GovernmentNavigation";
import { WorkspaceNavigation } from "../navigation/WorkspaceNavigation";
import { IconButton } from "../ui";
import { NAVIGATION_COPY } from "../../config/navigationCopy";
import type { WorkspaceModuleItem } from "../../config/workspaceModules";
import type { OrgLanguage, OrgNode } from "../../services/OrganisationService";
import type { ResourceState } from "../../types/resource";
import "../navigation/navigation.css";

interface SidebarProps {
    /** IA-4: the branch of the hierarchy this user may see. */
    tree: OrgNode | null;
    organisationState: ResourceState;
    activeNodeId: string;
    onSelectNode: (nodeId: string) => void;
    activeModuleId: string;
    onSelectModule: (moduleId: string) => void;
    modules?: WorkspaceModuleItem[];
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
    language?: OrgLanguage;
}

export function Sidebar({
    tree,
    organisationState,
    activeNodeId,
    onSelectNode,
    activeModuleId,
    onSelectModule,
    modules,
    collapsed = false,
    onToggleCollapsed,
    language = "uz",
}: SidebarProps): JSX.Element {
    return (
        <div
            id="sovereign-sidebar"
            className={`svr-sidebar${collapsed ? " is-collapsed" : ""}`}
            /* A11Y-6: the sidebar is a named landmark. */
            role="complementary"
            aria-label={NAVIGATION_COPY.sidebarLabel}
        >
            {onToggleCollapsed && (
                <div className="svr-sidebar__controls">
                    <IconButton
                        icon="menu"
                        label={collapsed ? NAVIGATION_COPY.sidebarExpand : NAVIGATION_COPY.sidebarCollapse}
                        variant="ghost"
                        size="sm"
                        aria-expanded={!collapsed}
                        aria-controls="sovereign-gov-nav"
                        onClick={onToggleCollapsed}
                    />
                </div>
            )}

            <div className="svr-sidebar__scroll">
                <GovernmentNavigation
                    tree={tree}
                    state={organisationState}
                    activeNodeId={activeNodeId}
                    onSelectNode={onSelectNode}
                    collapsed={collapsed}
                    language={language}
                />

                <div className="svr-sidebar__divider" role="presentation" />

                <WorkspaceNavigation
                    activeModuleId={activeModuleId}
                    onSelectModule={onSelectModule}
                    modules={modules}
                    collapsed={collapsed}
                />
            </div>
        </div>
    );
}
