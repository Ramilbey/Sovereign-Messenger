/*
 * Sovereign Messenger — Sprint 1, Step 6 / Step 8 · Sprint 3, Milestone 3
 * SovereignLayout.tsx — Application Frame
 *
 * Blueprint §6 Split Layout Architecture, made responsive:
 *
 *   UI-14 wide     — sidebar, conversation list, conversation, and one
 *                    supporting panel at once.
 *   UI-15 standard — supporting panels overlay the frame rather than
 *                    compressing the conversation column (UX-2).
 *   UI-16 compact  — one surface at a time, with explicit navigation.
 *
 * The layout holds navigation state only: no data access, no permission logic,
 * no presentation of its own.
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
import { CompactNavigation, type CompactSurface } from "./CompactNavigation";
import { usePermissions } from "../../context/PermissionContext";
import { useChat } from "../../context/ChatContext";
import { useChannels, useConversations } from "../../providers/useSovereignData";
import { useConnectionState } from "../../hooks/useConnectionState";
import { useDrafts } from "../../hooks/useDrafts";
import { useOrganisation } from "../../hooks/useOrganisation";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useFramePreferences } from "../../hooks/useFramePreferences";
import { orgNodeName } from "../../services/OrganisationService";
import { scopeModulesToNode } from "../../config/workspaceModules";
import { SessionLifecycleService } from "../../services/SessionLifecycleService";
import { ConversationList } from "../navigation/ConversationList";
import { ConnectionBanner, IconButton } from "../ui";
import { FRAME_COPY } from "../../config/navigationCopy";

export function SovereignLayout(): JSX.Element {
    /*
     * ORG-4: the user's position decides their default context, so the active
     * node starts undefined and resolves to that position rather than to a
     * department named in code.
     */
    const [activeNodeId, setActiveNodeId] = useState<string | undefined>(undefined);
    const [activeModuleId, setActiveModuleId] = useState<string>("channels");
    const [compactSurface, setCompactSurface] = useState<CompactSurface>("conversations");

    const { getAllowedModules, currentUser } = usePermissions();
    const { activeChannelId, setActiveChannelId } = useChat();
    const { data: { channels, groups } } = useChannels();
    const { data: conversations, state: conversationsState } = useConversations();
    const connectionState = useConnectionState();
    const draftConversationIds = useDrafts();
    const breakpoint = useBreakpoint();
    const { preferences, update: updatePreferences } = useFramePreferences();

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

            // UI-16: choosing a module is a request to see it, and at compact
            // only one surface is visible at a time.
            if (breakpoint === "compact") setCompactSurface("workspace");
        },
        [channels, groups, setActiveChannelId, breakpoint],
    );

    const handleSelectConversation = useCallback(
        (conversationId: string) => {
            setActiveChannelId(conversationId);
            if (breakpoint === "compact") setCompactSurface("conversation");
        },
        [setActiveChannelId, breakpoint],
    );

    const handleSelectNode = useCallback(
        (nodeId: string) => {
            setActiveNodeId(nodeId);
            if (breakpoint === "compact") setCompactSurface("conversations");
        },
        [breakpoint],
    );

    const isCompact = breakpoint === "compact";
    const isWide = breakpoint === "wide";

    /*
     * UI-14: at wide, the supporting surfaces sit alongside the conversation.
     * UI-15: at standard they overlay it instead, so the primary column keeps
     * its width (UX-2). At compact they are surfaces of their own (UI-16).
     */
    const panelOpen = !isCompact && preferences.panelOpen;
    const workspaceOpen = !isCompact && preferences.workspaceOpen;
    const panelOverlays = panelOpen && !isWide;
    const workspaceOverlays = workspaceOpen && !isWide;

    const sidebar = (
        <Sidebar
            tree={organisation.tree}
            organisationState={organisationState}
            activeNodeId={organisation.currentId}
            onSelectNode={handleSelectNode}
            activeModuleId={activeModuleId}
            onSelectModule={handleSelectModule}
            modules={modules}
            collapsed={!isCompact && preferences.sidebarCollapsed}
            onToggleCollapsed={
                isCompact
                    ? undefined
                    : () => updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })
            }
            language={organisation.language}
        />
    );

    const conversationList = (
        <ConversationList
            conversations={conversations}
            state={conversationsState}
            activeConversationId={activeChannelId}
            onSelect={handleSelectConversation}
            draftConversationIds={draftConversationIds}
        />
    );

    return (
        <div
            id="sovereign-layout"
            className={[
                "svr-layout",
                `svr-layout--${breakpoint}`,
                panelOpen ? "has-panel" : "",
                workspaceOpen ? "has-workspace" : "",
                !isCompact && preferences.sidebarCollapsed ? "has-collapsed-sidebar" : "",
            ]
                .filter(Boolean)
                .join(" ")}
            /* UI-19: density is a frame-level attribute the surfaces respond to. */
            data-svr-density={preferences.density}
        >
            <Topbar
                path={organisation.path}
                onSelectNode={handleSelectNode}
                code={organisation.code}
                connectionState={connectionState}
                currentUser={currentUser}
                departmentLabel={departmentLabel}
                language={organisation.language}
            />

            {/* UI-16: one surface at a time, chosen explicitly. */}
            {isCompact ? (
                <>
                    <div className="svr-compact-surface">
                        <ConnectionBanner state={connectionState} />
                        {compactSurface === "organisation" && sidebar}
                        {compactSurface === "conversations" && conversationList}
                        {compactSurface === "conversation" && <ChatArea />}
                        {compactSurface === "workspace" && (
                            <WorkspaceArea activeModuleId={activeModuleId} />
                        )}
                    </div>

                    <CompactNavigation active={compactSurface} onSelect={setCompactSurface} />
                </>
            ) : (
                <>
                    {sidebar}
                    {conversationList}

                    {/*
                     * SUX-16: connection state appears in one consistent
                     * location, directly above the working area. SUX-5: it is
                     * non-blocking — the content below stays readable.
                     */}
                    <div className="svr-main">
                        <ConnectionBanner state={connectionState} />

                        <div className="svr-main-toolbar">
                            <IconButton
                                icon="briefcase"
                                label={FRAME_COPY.toggleWorkspace}
                                variant="ghost"
                                size="sm"
                                aria-pressed={workspaceOpen}
                                onClick={() =>
                                    updatePreferences({ workspaceOpen: !preferences.workspaceOpen })
                                }
                            />
                            <IconButton
                                icon="people"
                                label={FRAME_COPY.togglePanel}
                                variant="ghost"
                                size="sm"
                                aria-pressed={panelOpen}
                                onClick={() => updatePreferences({ panelOpen: !preferences.panelOpen })}
                            />
                        </div>

                        <div className="svr-main-content">
                            <ChatArea />

                            {workspaceOpen && (
                                <WorkspaceArea
                                    activeModuleId={activeModuleId}
                                    overlay={workspaceOverlays}
                                    onClose={
                                        workspaceOverlays
                                            ? () => updatePreferences({ workspaceOpen: false })
                                            : undefined
                                    }
                                />
                            )}
                        </div>
                    </div>

                    {panelOpen && (
                        <RightPanel
                            overlay={panelOverlays}
                            onClose={
                                panelOverlays ? () => updatePreferences({ panelOpen: false }) : undefined
                            }
                        />
                    )}
                </>
            )}
        </div>
    );
}
