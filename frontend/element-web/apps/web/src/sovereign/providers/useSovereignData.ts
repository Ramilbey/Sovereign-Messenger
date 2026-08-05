/*
 * Sovereign Messenger — Sprint 2, Phase 6.4
 * useSovereignData.ts — Dynamic Data Provider Hooks (Demo vs. Matrix Production).
 *
 * PRD §3.1 & Phase 6.4 Requirements:
 * - When SOVEREIGN_MODE=true (isDemoMode()): returns Demo JSON providers.
 * - When SOVEREIGN_MODE=false (!isDemoMode()): retrieves room list reactively from MatrixRoomService.
 * - Subscribes to Matrix SDK client sync/room events so room discoveries trigger React re-renders.
 * - Returned objects match SovereignChannel interface.
 * - Zero UI component changes.
 */

import { useState, useEffect, useMemo } from "react";
import usersData from "../demo/users.json";
import channelsData from "../demo/channels.json";
import messagesData from "../demo/messages.json";
import tasksData from "../demo/tasks.json";
import documentsData from "../demo/documents.json";
import calendarData from "../demo/calendar.json";
import dashboardData from "../demo/dashboard.json";
import casesData from "../demo/cases.json";
import suspectsData from "../demo/suspects.json";
import evidenceData from "../demo/evidence.json";
import reportsData from "../demo/reports.json";
import courtMaterialsData from "../demo/court_materials.json";

import {
    ready,
    loading,
    failed,
    unavailable,
    type SovereignResource,
} from "../types/resource";
import type { SovereignMessage } from "../services/MessageService";
import type {
    ConversationPreview,
    ConversationType,
    SovereignConversation,
} from "../types/conversation";
import { useMessages } from "../hooks/useMessages";
import { isDemoMode } from "../config/SovereignConfig";
import { MatrixRoomService, type SovereignRoom } from "../services/MatrixRoomService";
import { OrganisationService, orgNodeName } from "../services/OrganisationService";

export type { SovereignMessage };
export { useMessages };

// ── Types ────────────────────────────────────────────────────────────────────

export interface SovereignOrganization {
    region: string;
    department: string;
    subDepartment: string;
    workspaceName: string;
    code: string;
}

export interface SovereignUser {
    id: string;
    displayName: string;
    role: "Manager" | "Employee" | "NationalAdmin";
    title?: string;
    department: string | null;
    status: "online" | "meeting" | "busy" | "offline";
    statusLabel: string;
    avatarInitials: string;
}

export interface SovereignChannel {
    id: string;
    name: string;
    type: ConversationType;
    description: string;
    readOnlyForEmployees: boolean;
}

export interface SovereignTask {
    id: string;
    title: string;
    assigneeId: string;
    assigneeName: string;
    assignerName: string;
    dueDate: string;
    status: "pending" | "in_progress" | "completed";
    statusLabel: string;
    priority: "low" | "medium" | "high";
}

export interface SovereignDocument {
    id: string;
    title: string;
    type: "pdf" | "excel" | "word";
    fileSize: string;
    uploadedBy: string;
    date: string;
}

export interface SovereignCalendarEvent {
    id: string;
    time: string;
    title: string;
    location: string;
}

export interface SovereignDashboardStats {
    onlineUsers: number;
    offlineUsers: number;
    totalTasks: number;
    completedTasks: number;
    emergencyAlerts: number;
}

// ── Tergov Investigation Types ───────────────────────────────────────────────

export interface TergovCase {
    id: string;
    caseNumber: string;
    title: string;
    status: "active" | "suspended" | "closed";
    statusLabel: string;
    priority: "high" | "medium" | "low";
    priorityLabel: string;
    investigatorId: string;
    investigatorName: string;
    openedDate: string;
    description: string;
}

export interface TergovSuspect {
    id: string;
    caseId: string;
    caseNumber: string;
    fullName: string;
    birthYear: number;
    address: string;
    status: "detained" | "wanted" | "released";
    statusLabel: string;
    charge: string;
    assignedInvestigator: string;
}

export interface TergovEvidence {
    id: string;
    caseId: string;
    caseNumber: string;
    type: "physical" | "digital" | "document";
    typeLabel: string;
    description: string;
    collectedDate: string;
    collectedBy: string;
    storageLocation: string;
    status: "stored" | "analysis" | "expert";
    statusLabel: string;
}

export interface TergovReport {
    id: string;
    caseId: string;
    caseNumber: string;
    title: string;
    type: "interrogation" | "search" | "surveillance";
    typeLabel: string;
    date: string;
    author: string;
    pageCount: number;
    status: "signed" | "draft";
    statusLabel: string;
}

export interface TergovCourtMaterial {
    id: string;
    caseId: string;
    caseNumber: string;
    title: string;
    type: "indictment" | "warrant" | "motion";
    typeLabel: string;
    submittedDate: string;
    court: string;
    status: "submitted" | "approved" | "pending";
    statusLabel: string;
    preparedBy: string;
}

// ── Matrix Room Mapper ────────────────────────────────────────────────────────

/**
 * IA-6: a room resolves to one of the three conversation types.
 *
 * A room with a published address is an official channel; a small room without
 * one is a direct conversation; everything else is a working group. Direct
 * conversations were previously folded into working groups, which left the
 * third type unrepresentable.
 *
 * Blueprint §3.2: official channels are announcement-only — only Rahbar and
 * Administrator may post, everyone reads. Groups and direct conversations stay
 * writable, mirroring the demonstration dataset.
 */
function classifyRoom(room: SovereignRoom): ConversationType {
    if (room.canonicalAlias) return "channel";
    return room.isDirect ? "direct" : "group";
}

function mapMatrixRoomToConversation(room: SovereignRoom): SovereignConversation {
    const type = classifyRoom(room);

    return {
        id: room.roomId,
        name: room.name,
        type,
        topic: room.topic,
        memberCount: room.memberCount,
        readOnlyForEmployees: type === "channel",
        lastActivityAt: room.lastActivityAt,
        preview: room.preview,
        unreadCount: room.unreadCount,
        mentionCount: room.mentionCount,
        isFavourite: room.isFavourite,
        isMuted: room.isMuted,
    };
}

/** Demonstration conversations carry no live metadata; the model states so. */
function mapDemoChannelToConversation(
    channel: SovereignChannel,
    preview: ConversationPreview | null,
    lastActivityAt: number | null,
): SovereignConversation {
    return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        topic: channel.description,
        memberCount: null,
        readOnlyForEmployees: channel.readOnlyForEmployees,
        lastActivityAt,
        preview,
        unreadCount: 0,
        mentionCount: 0,
        isFavourite: false,
        isMuted: false,
    };
}

// ── Specialized Hooks ────────────────────────────────────────────────────────

/**
 * The organisational identity of the user's current position.
 *
 * Derived from the hierarchy model (ORG-1) rather than a flat record, so the
 * labels shown in the application frame follow whatever the configuration
 * declares. Surfaces needing the hierarchy itself — sidebar, breadcrumbs —
 * consume `useOrganisation` directly; this stays as the frame's summary view.
 *
 * ORG-4: `departmentHint` is the department carried on the user's identity
 * data where present (AS-1). Absent or unrecognised, the configured default
 * position applies; a position is never invented.
 */
export function useOrganization(departmentHint?: string | null): SovereignResource<SovereignOrganization> {
    const service = OrganisationService.getInstance();
    const positionId = service.resolvePosition(departmentHint);

    const viloyat = service.getAncestorOfType(positionId, "Viloyat");
    const idora = service.getAncestorOfType(positionId, "Idora");
    const bolim = service.getAncestorOfType(positionId, "Bolim");
    const workspace = service.getAncestorOfType(positionId, "Workspace");

    if (!service.isValid()) {
        return failed({ region: "", department: "", subDepartment: "", workspaceName: "", code: "" });
    }

    return ready(
        {
            region: viloyat ? orgNodeName(viloyat) : "",
            department: idora ? orgNodeName(idora) : "",
            subDepartment: bolim ? orgNodeName(bolim) : "",
            workspaceName: workspace ? orgNodeName(workspace) : "",
            code: service.getCode(positionId) ?? "",
        },
        false,
    );
}

/**
 * Departmental colleagues.
 *
 * Production Mode: no authoritative source is wired in this milestone —
 * real membership arrives with the member surfaces (CMP-12) — so this
 * presents the `unavailable` state rather than fabricated colleagues (FR-1).
 */
export function useUsers(): SovereignResource<SovereignUser[]> {
    return isDemoMode() ? ready(usersData.users as SovereignUser[]) : unavailable([]);
}

/**
 * Every conversation the user belongs to, of all three types (IA-6).
 *
 * Production Mode: derived from rooms the synchronised client has discovered,
 * carrying the metadata the conversation list needs (NAV-2). FR-4 — an empty
 * room list resolves to the `empty` state. It is never replaced by
 * demonstration content, which previously made real users see fabricated
 * departmental channels.
 *
 * This is the single conversation surface; the grouped view below is derived
 * from it, so the two can never disagree about what exists.
 */
export function useConversations(): SovereignResource<SovereignConversation[]> {
    const demo = isDemoMode();

    const [matrixRooms, setMatrixRooms] = useState<SovereignRoom[]>(() =>
        demo ? [] : MatrixRoomService.getInstance().getAllRooms(),
    );
    // ES-1: a surface is loading until the first read has been attempted.
    const [settled, setSettled] = useState<boolean>(demo);

    useEffect(() => {
        if (demo) return;

        const service = MatrixRoomService.getInstance();

        const read = (): void => {
            setMatrixRooms(service.getAllRooms());
            setSettled(true);
        };

        read();

        /*
         * Blueprint §8: the provider consumes a service and never reads the
         * platform SDK itself. The service owns which events mean "the
         * conversation list may have changed" and coalesces a burst of them
         * into one update (PERF-10).
         */
        return service.subscribe(read);
    }, [demo]);

    // Demo Mode is unchanged in the data it presents (ADR-004).
    const demoConversations = useMemo(() => {
        if (!demo) return [];

        // The last demonstration message per conversation, so the list reads
        // the same way in both modes (NFR-7) without altering Demo Mode's own
        // data or its message service (ADR-004).
        const lastByChannel = new Map<string, SovereignMessage>();
        (messagesData.messages as SovereignMessage[]).forEach((message) => {
            lastByChannel.set(message.channelId, message);
        });

        const all = [
            ...(channelsData.channels as SovereignChannel[]),
            ...(channelsData.groups as SovereignChannel[]),
        ];

        return all.map((channel) => {
            const last = lastByChannel.get(channel.id);
            return mapDemoChannelToConversation(
                channel,
                last ? { senderName: last.senderName, body: last.content } : null,
                null,
            );
        });
    }, [demo]);

    if (demo) {
        return ready(demoConversations);
    }

    if (!settled) {
        return loading([]);
    }

    return ready(matrixRooms.map(mapMatrixRoomToConversation));
}

/**
 * Conversations grouped by type, for surfaces that present one type at a time.
 *
 * Derived from `useConversations` rather than read separately, so a
 * conversation cannot appear in one surface and be missing from another.
 */
export function useChannels(): SovereignResource<{
    channels: SovereignChannel[];
    groups: SovereignChannel[];
}> {
    const { data: conversations, state } = useConversations();

    const grouped = useMemo(() => {
        const toChannel = (conversation: SovereignConversation): SovereignChannel => ({
            id: conversation.id,
            name: conversation.name,
            type: conversation.type,
            description: conversation.topic ?? "",
            readOnlyForEmployees: conversation.readOnlyForEmployees,
        });

        return {
            channels: conversations.filter((c) => c.type === "channel").map(toChannel),
            // A direct conversation is still a conversation the user works in,
            // so it stays reachable from the grouped view alongside groups.
            groups: conversations.filter((c) => c.type !== "channel").map(toChannel),
        };
    }, [conversations]);

    return { data: grouped, state };
}

/*
 * Work modules with no authoritative data source in Sprint 3.
 *
 * FR-1 / FR-2: in Production Mode these present the `unavailable` state rather
 * than demonstration content. Demo Mode continues to serve the full
 * demonstration dataset unchanged (ADR-004).
 *
 * These surfaces gain real data sources in later sprints — see the PRD Future
 * Recommendations section.
 */

export function useTasks(): SovereignResource<SovereignTask[]> {
    return isDemoMode() ? ready(tasksData.tasks as SovereignTask[]) : unavailable([]);
}

export function useDocuments(): SovereignResource<SovereignDocument[]> {
    return isDemoMode() ? ready(documentsData.documents as SovereignDocument[]) : unavailable([]);
}

export function useCalendar(): SovereignResource<SovereignCalendarEvent[]> {
    return isDemoMode() ? ready(calendarData.events as SovereignCalendarEvent[]) : unavailable([]);
}

export function useDashboard(): SovereignResource<SovereignDashboardStats | null> {
    return isDemoMode()
        ? ready(dashboardData.stats as SovereignDashboardStats, false)
        : unavailable(null);
}

export function useCases(): SovereignResource<TergovCase[]> {
    return isDemoMode() ? ready(casesData.cases as TergovCase[]) : unavailable([]);
}

export function useSuspects(): SovereignResource<TergovSuspect[]> {
    return isDemoMode() ? ready(suspectsData.suspects as TergovSuspect[]) : unavailable([]);
}

export function useEvidence(): SovereignResource<TergovEvidence[]> {
    return isDemoMode() ? ready(evidenceData.evidence as TergovEvidence[]) : unavailable([]);
}

export function useReports(): SovereignResource<TergovReport[]> {
    return isDemoMode() ? ready(reportsData.reports as TergovReport[]) : unavailable([]);
}

export function useCourtMaterials(): SovereignResource<TergovCourtMaterial[]> {
    return isDemoMode()
        ? ready(courtMaterialsData.courtMaterials as TergovCourtMaterial[])
        : unavailable([]);
}
