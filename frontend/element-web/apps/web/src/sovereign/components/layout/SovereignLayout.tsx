/*
 * Sovereign Messenger — Sprint 1, Step 6 / Step 8 · Sprint 3, Milestone 3
 * SovereignLayout.tsx — Root layout shell.
 *
 * Blueprint §6 Split Layout Architecture:
 * Contains permanently visible ChatArea on the left and WorkspaceArea on the right.
 *
 * Milestone 3: the layout resolves the user's organisational position and the
 * modules that position enables, and passes both down. It holds navigation
 * state only — no data access, no permission logic of its own.
 */

import React, { useState, useCallback, useEffect, useMemo, type JSX } from "react";

// Sprint 3 design tokens (PRD Appendix A). Imported at the layout root so the
// token custom properties are available to every Sovereign surface.
import "../../styles/tokens.css";
import "./SovereignLayout.css";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatArea } from "./ChatArea";
import { WorkspaceArea } from "./WorkspaceArea";
import { RightPanel } from "./RightPanel";
import { usePermissions } from "../../context/PermissionContext";
import { useChat } from "../../context/ChatContext";
import { useChannels, useConversations } from "../../providers/useSovereignData";
import { useConnectionState } from "../../hooks/useConnectionState";
import { useDrafts } from "../../hooks/useDrafts";
import { useOrganisation } from "../../hooks/useOrganisation";
import { orgNodeName } from "../../services/OrganisationService";
import { scopeModulesToNode } from "../../config/workspaceModules";
import { SessionLifecycleService } from "../../services/SessionLifecycleService";
import { ConversationList } from "../navigation/ConversationList";
import { ConnectionBanner } from "../ui";

export function SovereignLayout(): JSX.Element {
    /*
     * ORG-4: the user's position decides their default context, so the active
     * node starts undefined and resolves to that position rather than to a
     * department named in code.
     */
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>(undefined);
    const [activeModuleId, setActiveModuleId] = useState<string>("channels");
    const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

    const { getAllowedModules, currentUser } = usePermissions();
    const { activeChannelId, setActiveChannelId } = useChat();
    const { data: { channels, groups } } = useChannels();
    const { data: conversations, state: conversationsState } = useConversations();
    const connectionState = useConnectionState();
    const draftConversationIds = useDrafts();

    const { data: organisation, state: organisationState } = useOrganisation({
        departmentHint: currentUser.department,
        currentNodeId: activeNodeId,
    });

    // Observe sign-out so locally held drafts and outbox records do not
    // outlive the session on a shared workstation. Idempotent.
    useEffect(() => {
        SessionLifecycleService.getInstance().initialize();
    }, []);

    /*
     * IA-9 / ORG-6: role first (a module the user may not hold is never
     * offered), then the modules this organisational node enables.
     */
    const modules = useMemo(
        () => scopeModulesToNode(getAllowedModules(), organisation.enabledModuleIds),
        [getAllowedModules, organisation.enabledModuleIds],
    );

    /*
     * PR-7 / NFR-8: the department shown in the frame is the name the
     * organisation model gives it, not the internal reference the identity
     * data carries.
     */
    const departmentLabel = useMemo(() => {
        const bolim = organisation.path.find((node) => node.type === "Bolim");
        return bolim ? orgNodeName(bolim, organisation.language) : null;
    }, [organisation.path, organisation.language]);

    /*
     * Moving to a node that does not enable the current module would otherwise
     * leave the workspace showing a module that is no longer in the list.
     */
    useEffect(() => {
        if (modules.length === 0) return;
        if (modules.some((module) => module.id === activeModuleId)) return;
        setActiveModuleId(modules[0].id);
    }, [modules, activeModuleId]);

    const handleSelectModule = useCallback(
        (modId: string) => {
            setActiveModuleId(modId);

            // Keep the conversation surface consistent with the category the
            // user just opened, where that category has conversations.
            if (modId === "groups" && groups.length > 0) {
                setActiveChannelId(groups[0].id);
            } else if (modId === "channels" && channels.length > 0) {
                setActiveChannelId(channels[0].id);
            }
        },
        [channels, groups, setActiveChannelId],
    );

    return (
        <div id="sovereign-layout" className="svr-layout">
            {/* Column 1 — full height */}
            <Sidebar
                tree={organisation.tree}
                organisationState={organisationState}
                activeNodeId={organisation.currentId}
                onSelectNode={setActiveNodeId}
                activeModuleId={activeModuleId}
                onSelectModule={handleSelectModule}
                modules={modules}
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
                language={organisation.language}
            />

            {/* Row 1 — CMP-18 application header, spanning the working columns */}
            <Topbar
                path={organisation.path}
                onSelectNode={setActiveNodeId}
                code={organisation.code}
                connectionState={connectionState}
                currentUser={currentUser}
                departmentLabel={departmentLabel}
                language={organisation.language}
            />

            {/*
              * Column 2 — NAV-2 conversation navigation. Replaces the
              * selection control that previously sat inside the chat surface.
              */}
            <ConversationList
                conversations={conversations}
                state={conversationsState}
                activeConversationId={activeChannelId}
                onSelect={setActiveChannelId}
                draftConversationIds={draftConversationIds}
            />

            {/*
              * Column 3, row 2 — ChatArea + WorkspaceArea side by side.
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

            {/* Column 4 — full height */}
            <RightPanel />
        </div>
    );
}
