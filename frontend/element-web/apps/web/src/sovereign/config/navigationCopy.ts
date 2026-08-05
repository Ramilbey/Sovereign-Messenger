/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * navigationCopy.ts — Navigation and Frame Copy
 *
 * NFR-4: no user-facing text is hardcoded in the interface. Every string the
 * navigation, application frame, and conversation list present lives here, so
 * localisation (D-20) and review have one authoritative table — the same
 * arrangement Milestone 2 established for per-surface state copy.
 *
 * SUX-1 / NFR-8: no protocol terminology, error code, or internal identifier
 * appears in any string below.
 */

import type { OrgNodeType } from "../services/OrganisationService";

/**
 * GW-11 / IA-6: an organisational level is named by its official designation,
 * and is announced alongside the node name so the level is never carried by
 * icon or indentation alone (A11Y-5).
 */
export const ORG_NODE_TYPE_LABEL: Record<OrgNodeType, string> = {
    Republic: "Respublika",
    Viloyat: "Viloyat",
    Idora: "Idora",
    Bolim: "Bo'lim",
    Workspace: "Workspace",
};

export const NAVIGATION_COPY = {
    /** NAV-1: label of the organisational tree region. */
    hierarchyLabel: "Davlat boshqaruvi",
    /** Landmark name for the sidebar as a whole (A11Y-6). */
    sidebarLabel: "Tashkiliy navigatsiya",
    sidebarCollapse: "Yon panelni yig'ish",
    sidebarExpand: "Yon panelni ochish",

    /** IA-10: module grouping headings. */
    moduleSectionUniversal: "Universal modullar",
    moduleSectionSpecial: "Tergov modullari",
    moduleListLabel: "Bo'lim modullari",

    /** CMP-15 expand and collapse affordances. */
    nodeExpand: "Ochish",
    nodeCollapse: "Yig'ish",

    /** CMP-17 breadcrumbs. */
    breadcrumbLabel: "Tashkiliy yo'l",
    breadcrumbExpand: "To'liq yo'lni ko'rsatish",
} as const;

/** CMP-18 application frame (UI-9, ORG-7, PR-7). */
export const FRAME_COPY = {
    headerLabel: "Dastur sarlavhasi",
    /** UI-9: the official name the platform carries. */
    productName: "Sovereign Messenger",
    organisationCode: "Tashkilot kodi",
} as const;
