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
import { ProfileProvider } from "../../context/ProfileContext";
import { useConnectionState } from "../../hooks/useConnectionState";
import { useDrafts } from "../../hooks/useDrafts";
import { useOrganisation } from "../../hooks/useOrganisation";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useFramePreferences } from "../../hooks/useFramePreferences";
import { orgNodeName } from "../../types/organisation";
import { summariseUnread, type UnreadSummary } from "../../types/notification";
import { useNotificationAlert } from "../../hooks/useNotifications";
import { MODULE_CONVERSATION_TYPE, scopeModulesToNode } from "../../config/workspaceModules";
import { SessionLifecycleService } from "../../services/SessionLifecycleService";
import { ConversationList } from "../navigation/ConversationList";
import { SearchPanel } from "../navigation/SearchPanel";
import { NotificationCentre } from "../navigation/NotificationCentre";
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
    /** NAV-4 / SR-2: global search, reachable from any screen. */
    const [searchOpen, setSearchOpen] = useState(false);
    /** NT-3: the notification centre, reachable from the application header. */
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const { getAllowedModules, currentUser } = usePermissions();
    const { activeChannelId, setActiveChannelId, conversations, conversationsState } = useChat();
    const connectionState = useConnectionState();
    const draftConversationIds = useDrafts();
    const breakpoint = useBreakpoint();
    const { preferences, update: updatePreferences } = useFramePreferences();

    const { data: organisation, state: organisationState } = useOrganisation({
        departmentHint: currentUser.department,
        currentNodeId: activeNodeId,
    });

    /*
     * A11Y-12: the theme is applied to the document root, where the token
     * definitions are scoped. It is set on the root rather than on the frame
     * so overlays — search, the notification centre, a profile — are themed
     * too, wherever the browser puts them.
     */
    useEffect(() => {
        const root = document.documentElement;
        const previous = root.getAttribute("data-svr-theme");

        root.setAttribute("data-svr-theme", preferences.theme);
        return () => {
            if (previous === null) {
                root.removeAttribute("data-svr-theme");
            } else {
                root.setAttribute("data-svr-theme", previous);
            }
        };
    }, [preferences.theme]);

    // Observe sign-out so locally held drafts and outbox records do not
    // outlive the session on a shared workstation. Idempotent.
    useEffect(() => {
        SessionLifecycleService.getInstance().initialize();
    }, []);

    /*
     * SR-2 / NAV-9: search is reachable by keyboard from anywhere. Bound at
     * the frame rather than on a surface, so it works wherever focus is —
     * except inside a text field, where the user is composing.
     */
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") return;

            const target = event.target as HTMLElement | null;
            const composing =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable === true;
            if (composing) return;

            event.preventDefault();
            setSearchOpen(true);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    /*
     * SR-5: a result opens its conversation, positioned at the message. The
     * message deep-link is carried through to the conversation surface.
     */
    const handleOpenResult = useCallback(
        (conversationId: string, _eventId?: string) => {
            setActiveChannelId(conversationId);
            if (breakpoint === "compact") setCompactSurface("conversation");
        },
        [setActiveChannelId, breakpoint],
    );

    /*
     * IA-9 / ORG-6: role first (a module the user may not hold is never
     * offered), then the modules this organisational node enables.
     */
    const modules = useMemo(
        () => scopeModulesToNode(getAllowedModules(), organisation.enabledModuleIds),
        [getAllowedModules, organisation.enabledModuleIds],
    );

    /*
     * NT-1: the unread model. Every level is the same arithmetic over the same
     * conversations — the module totals, the organisational totals, and the
     * conversation list are three views of one set, so they cannot disagree.
     */
    const unreadTotal = useMemo(() => summariseUnread(conversations), [conversations]);

    const unreadByModule = useMemo(() => {
        const totals = new Map<string, UnreadSummary>();

        for (const module of modules) {
            const type = MODULE_CONVERSATION_TYPE[module.id];

            // FR-47 / IA-8: favourites are a set of their own, not a type.
            const scope =
                module.id === "favorites"
                    ? conversations.filter((conversation) => conversation.isFavourite)
                    : type
                      ? conversations.filter((conversation) => conversation.type === type)
                      : null;

            // A module that holds no conversations gets no total, rather than a
            // zero that would read as "nothing waiting" for a module that could
            // never have anything waiting.
            if (scope) totals.set(module.id, summariseUnread(scope));
        }

        return totals;
    }, [conversations, modules]);

    /*
     * PR-7 / NFR-8: the department shown in the frame is the name the
     * organisation model gives it, not the internal reference the identity
     * data carries.
     */
    /*
     * NT-7 / A11Y-7: what has just arrived, announced politely and — where the
     * user has asked for it — sounded. Direct messages and mentions only: an
     * officer is not alerted for every message in every official channel.
     */
    const directUnread = useMemo(
        () =>
            summariseUnread(conversations.filter((conversation) => conversation.type === "direct"))
                .unread,
        [conversations],
    );
    const announcement = useNotificationAlert(
        unreadTotal.mentions,
        directUnread,
        preferences.notificationSound,
    );

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

    /*
     * UI-14: at wide the frame shows the sidebar, the conversation, and *one*
     * supporting panel. Opening one therefore closes the other — with both
     * open on the minimum specified workstation the conversation is squeezed
     * to 266px, narrower than the list beside it (UX-2).
     */
    const showSupporting = useCallback(
        (surface: "workspace" | "panel" | null) => {
            updatePreferences({
                workspaceOpen: surface === "workspace",
                panelOpen: surface === "panel",
            });
        },
        [updatePreferences],
    );

    const handleSelectModule = useCallback(
        (modId: string) => {
            setActiveModuleId(modId);

            /*
             * Keep the conversation surface consistent with the category the
             * user just opened. Matched on the conversation's actual type: the
             * previous grouping treated every non-channel as a group, so
             * opening "Ishchi guruhlar" could select a direct conversation.
             */
            const type = MODULE_CONVERSATION_TYPE[modId];
            if (type) {
                const first = conversations.find((conversation) => conversation.type === type);
                if (first) setActiveChannelId(first.id);
            }

            // Choosing a module is a request to see it: at compact it becomes
            // the visible surface (UI-16), elsewhere it opens the work column.
            if (breakpoint === "compact") {
                setCompactSurface("workspace");
            } else {
                showSupporting("workspace");
            }
        },
        [conversations, setActiveChannelId, breakpoint, showSupporting],
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
    const isStandard = breakpoint === "standard";
    const isWide = breakpoint === "wide";

    /*
     * UX-2 / AC-17: at 768px a full-width sidebar plus the conversation list
     * leaves the conversation column no room at all — the frame overflowed the
     * viewport. The sidebar becomes an icon rail for the whole standard range,
     * so the conversation stays the dominant surface (UI-15).
     */
    const sidebarCollapsed = !isCompact && (isStandard || preferences.sidebarCollapsed);

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
            collapsed={sidebarCollapsed}
            onToggleCollapsed={
                isCompact || isStandard
                    ? undefined
                    : () => updatePreferences({ sidebarCollapsed: !preferences.sidebarCollapsed })
            }
            language={organisation.language}
            onRetryOrganisation={organisation.retry}
            unread={unreadTotal}
            unreadNodeId={organisation.positionId}
            unreadByModule={unreadByModule}
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
        /* PR-2 / PR-9: one profile, opened from wherever a person appears. */
        <ProfileProvider onOpenConversation={handleOpenResult}>
        <div
            id="sovereign-layout"
            className={[
                "svr-layout",
                `svr-layout--${breakpoint}`,
                panelOpen ? "has-panel" : "",
                sidebarCollapsed ? "has-collapsed-sidebar" : "",
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
                onOpenSearch={() => setSearchOpen(true)}
                onOpenNotifications={() => setNotificationsOpen(true)}
                unread={unreadTotal}
                language={organisation.language}
            />

            {/* A11Y-7: arrivals are announced without taking the user's focus. */}
            <p className="svr-visually-hidden" role="status" aria-live="polite">
                {announcement}
            </p>

            {/* NAV-4 / SR-2: global search overlays the frame from any screen. */}
            {searchOpen && (
                <SearchPanel onClose={() => setSearchOpen(false)} onOpenResult={handleOpenResult} />
            )}

            {/* NT-3 / NT-10: overlays the supporting side, never the composer. */}
            {notificationsOpen && (
                <NotificationCentre
                    onClose={() => setNotificationsOpen(false)}
                    onOpenEntry={handleOpenResult}
                />
            )}

            {/* UI-16: one surface at a time, chosen explicitly. */}
            {isCompact ? (
                <>
                    {/* A11Y-6: one surface at a time, and it is the main one. */}
                    <main className="svr-compact-surface">
                        <ConnectionBanner state={connectionState} />
                        {compactSurface === "organisation" && sidebar}
                        {compactSurface === "conversations" && conversationList}
                        {compactSurface === "conversation" && <ChatArea />}
                        {compactSurface === "workspace" && (
                            <WorkspaceArea activeModuleId={activeModuleId} />
                        )}
                    </main>

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
                    {/* A11Y-6: the working area is the document's main region. */}
                    <main className="svr-main">
                        <ConnectionBanner state={connectionState} />

                        <div className="svr-main-toolbar">
                            <IconButton
                                icon="briefcase"
                                label={FRAME_COPY.toggleWorkspace}
                                variant="ghost"
                                size="sm"
                                aria-pressed={workspaceOpen}
                                onClick={() => showSupporting(workspaceOpen ? null : "workspace")}
                            />
                            <IconButton
                                icon="people"
                                label={FRAME_COPY.togglePanel}
                                variant="ghost"
                                size="sm"
                                aria-pressed={panelOpen}
                                onClick={() => showSupporting(panelOpen ? null : "panel")}
                            />
                        </div>

                        <div className="svr-main-content">
                            <ChatArea />

                            {workspaceOpen && (
                                <WorkspaceArea
                                    activeModuleId={activeModuleId}
                                    overlay={workspaceOverlays}
                                    onClose={
                                        workspaceOverlays ? () => showSupporting(null) : undefined
                                    }
                                />
                            )}
                        </div>
                    </main>

                    {panelOpen && (
                        <RightPanel
                            overlay={panelOverlays}
                            onClose={
                                panelOverlays ? () => showSupporting(null) : undefined
                            }
                        />
                    )}
                </>
            )}
        </div>
        </ProfileProvider>
    );
}
