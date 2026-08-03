/*
 * Sovereign Messenger — Sprint 1, Step 7.1
 * useSovereignData.ts — Unified Data Provider Hooks.
 *
 * Re-exports domain types & hooks.
 * useMessages is now powered by the MessageService transport layer (Dependency Inversion).
 */

import organizationData from "../demo/organization.json";
import usersData from "../demo/users.json";
import channelsData from "../demo/channels.json";
import tasksData from "../demo/tasks.json";
import documentsData from "../demo/documents.json";
import calendarData from "../demo/calendar.json";
import dashboardData from "../demo/dashboard.json";
import casesData from "../demo/cases.json";
import suspectsData from "../demo/suspects.json";
import evidenceData from "../demo/evidence.json";
import reportsData from "../demo/reports.json";
import courtMaterialsData from "../demo/court_materials.json";

import type { SovereignMessage } from "../services/MessageService";
import { useMessages } from "../hooks/useMessages";

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
    type: "channel" | "group";
    icon: string;
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

// ── Specialized Hooks ────────────────────────────────────────────────────────

export function useOrganization(): SovereignOrganization {
    return organizationData;
}

export function useUsers(): SovereignUser[] {
    return usersData.users as SovereignUser[];
}

export function useChannels(): { channels: SovereignChannel[]; groups: SovereignChannel[] } {
    return {
        channels: channelsData.channels as SovereignChannel[],
        groups: channelsData.groups as SovereignChannel[],
    };
}

export function useTasks(): SovereignTask[] {
    return tasksData.tasks as SovereignTask[];
}

export function useDocuments(): SovereignDocument[] {
    return documentsData.documents as SovereignDocument[];
}

export function useCalendar(): SovereignCalendarEvent[] {
    return calendarData.events as SovereignCalendarEvent[];
}

export function useDashboard(): SovereignDashboardStats {
    return dashboardData.stats as SovereignDashboardStats;
}

export function useCases(): TergovCase[] {
    return casesData.cases as TergovCase[];
}

export function useSuspects(): TergovSuspect[] {
    return suspectsData.suspects as TergovSuspect[];
}

export function useEvidence(): TergovEvidence[] {
    return evidenceData.evidence as TergovEvidence[];
}

export function useReports(): TergovReport[] {
    return reportsData.reports as TergovReport[];
}

export function useCourtMaterials(): TergovCourtMaterial[] {
    return courtMaterialsData.courtMaterials as TergovCourtMaterial[];
}

// ── Combined Aggregate Provider Hook ──────────────────────────────────────────

export function useSovereignData() {
    return {
        organization: useOrganization(),
        users: useUsers(),
        ...useChannels(),
        messages: useMessages().messages,
        tasks: useTasks(),
        documents: useDocuments(),
        calendarEvents: useCalendar(),
        dashboardStats: useDashboard(),
    };
}
