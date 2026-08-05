/*
 * Sovereign Messenger — Step 8 / Step 9 · Sprint 3, Milestone 3
 * ModuleWorkspaceView.tsx — Router/Dispatcher for active workspace module views.
 *
 * Renders real domain-backed views for WorkspaceArea:
 *   Communication modules (IA-6, one directory surface per type):
 *     channels ➔ ConversationDirectoryView
 *     groups ➔ ConversationDirectoryView
 *     direct_chats ➔ ConversationDirectoryView
 *     members ➔ MembersView
 *     documents ➔ DocumentsView
 *     tasks ➔ TasksView
 *     calendar ➔ CalendarView
 *     dashboard ➔ DashboardView
 *   Tergov special modules (Sprint 1, Step 9):
 *     cases ➔ CasesView
 *     suspects ➔ SuspectsView
 *     evidence ➔ EvidenceView
 *     records ➔ ReportsView
 *     court_materials ➔ CourtMaterialsView
 *   Fallback:
 *     default ➔ ModulePlaceholderView
 */

import React, { memo, type JSX } from "react";
import { ConversationDirectoryView } from "./ConversationDirectoryView";
import { MembersView } from "./MembersView";
import { DocumentsView } from "./DocumentsView";
import { TasksView } from "./TasksView";
import { CalendarView } from "./CalendarView";
import { DashboardView } from "./DashboardView";
import { CasesView } from "./CasesView";
import { SuspectsView } from "./SuspectsView";
import { EvidenceView } from "./EvidenceView";
import { ReportsView } from "./ReportsView";
import { CourtMaterialsView } from "./CourtMaterialsView";
import { ModulePlaceholderView } from "./ModulePlaceholderView";

interface ModuleWorkspaceViewProps {
    activeModuleId: string;
}

export const ModuleWorkspaceView = memo(function ModuleWorkspaceView({
    activeModuleId,
}: ModuleWorkspaceViewProps): JSX.Element {
    switch (activeModuleId) {
        // Communication modules — one directory surface, three types (IA-6)
        case "channels":
            return <ConversationDirectoryView type="channel" surface="channels" />;
        case "groups":
            return <ConversationDirectoryView type="group" surface="groups" />;
        case "direct_chats":
            return <ConversationDirectoryView type="direct" surface="directChats" />;
        case "members":
            return <MembersView />;
        case "documents":
            return <DocumentsView />;
        case "tasks":
            return <TasksView />;
        case "calendar":
            return <CalendarView />;
        case "dashboard":
            return <DashboardView />;
        // Tergov special modules
        case "cases":
            return <CasesView />;
        case "suspects":
            return <SuspectsView />;
        case "evidence":
            return <EvidenceView />;
        case "records":
            return <ReportsView />;
        case "court_materials":
            return <CourtMaterialsView />;
        // Modules without fake data (pinned, workspace_settings, direct_chats, etc.)
        default:
            return <ModulePlaceholderView activeModuleId={activeModuleId} />;
    }
});
