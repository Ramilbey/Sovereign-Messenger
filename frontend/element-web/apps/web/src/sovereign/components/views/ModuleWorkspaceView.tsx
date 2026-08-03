/*
 * Sovereign Messenger — Step 8 / Step 9
 * ModuleWorkspaceView.tsx — Router/Dispatcher for active workspace module views.
 *
 * Renders real domain-backed views for WorkspaceArea:
 *   Universal modules:
 *     channels ➔ ChannelsView
 *     groups ➔ GroupsView
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
import { ChannelsView } from "./ChannelsView";
import { GroupsView } from "./GroupsView";
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
        // Universal modules
        case "channels":
            return <ChannelsView />;
        case "groups":
            return <GroupsView />;
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
