/*
 * Sovereign Messenger — Sprint 1, Step 4 · Sprint 3, Milestone 3
 * workspaceModules.ts — Workspace module definitions & metadata.
 *
 * Blueprint §3.2 & §6 strict order configuration:
 * 1. Universal modules (9)
 * 2. Special Investigation modules (5)
 * 3. Personal Chats
 * 4. Favorites
 * 5. Settings
 *
 * Milestone 3: module iconography moved from emoji to the institutional icon
 * set (TOK-13, UI-7), and the catalogue is scoped to the organisational node
 * the user is looking at (ORG-6, IA-9, IA-11, IA-12).
 */

import type { IconName } from "../components/ui/Icon";
import type { ConversationType } from "../types/conversation";

export interface WorkspaceModuleItem {
    id: string;
    label: string;
    /** TOK-10 / TOK-13: an institutional icon, never an emoji. */
    icon: IconName;
    category: "universal" | "special" | "personal" | "favorites" | "settings";
    /** Role requirements — defaults to all roles unless specified */
    requiredRole?: "Manager" | "NationalAdmin";
}

export const TERGOV_WORKSPACE_MODULES: WorkspaceModuleItem[] = [
    // 1. Universal (9 modules)
    { id: "channels", label: "Kanallar", icon: "channel", category: "universal" },
    { id: "groups", label: "Guruhlar", icon: "group", category: "universal" },
    { id: "members", label: "Xodimlar", icon: "people", category: "universal" },
    { id: "documents", label: "Hujjatlar", icon: "folder", category: "universal" },
    { id: "tasks", label: "Vazifalar", icon: "task", category: "universal" },
    { id: "calendar", label: "Kalendar", icon: "calendar", category: "universal" },
    { id: "dashboard", label: "Dashboard", icon: "chart", category: "universal", requiredRole: "Manager" },
    { id: "pinned", label: "Mahkamlangan", icon: "pin", category: "universal" },
    { id: "workspace_settings", label: "Workspace sozlamalari", icon: "settings", category: "universal", requiredRole: "Manager" },

    // 2. Special Tergov modules (5 modules)
    { id: "cases", label: "Ishlar", icon: "briefcase", category: "special" },
    { id: "suspects", label: "Gumonlanuvchilar", icon: "person", category: "special" },
    { id: "evidence", label: "Dalillar", icon: "image", category: "special" },
    { id: "records", label: "Bayonnomalar", icon: "document", category: "special" },
    { id: "court_materials", label: "Sud materiallari", icon: "scale", category: "special" },

    // 3. Personal Chats
    { id: "direct_chats", label: "Shaxsiy suhbatlar", icon: "message", category: "personal" },

    // 4. Favorites
    { id: "favorites", label: "Sevimlilar", icon: "star", category: "favorites" },

    // 5. General Settings
    { id: "settings", label: "Sozlamalar", icon: "settings", category: "settings" },
];

/**
 * IA-6 / NT-1: which conversation type each communication module presents.
 *
 * One declaration, consumed both by the frame — which opens the matching
 * conversation when a module is chosen — and by the unread model, which counts
 * that module's conversations. Stated twice, a module could show the total of
 * one set while opening another.
 */
export const MODULE_CONVERSATION_TYPE: Readonly<Record<string, ConversationType>> = {
    channels: "channel",
    groups: "group",
    direct_chats: "direct",
};

/**
 * ORG-6 / IA-9 / IA-11: narrows a module catalogue to the modules the current
 * organisational node enables.
 *
 * IA-12: where the node declares modules, its declared order wins — module
 * order is configuration, not code. `null` means the node places no
 * restriction, so the catalogue passes through unchanged.
 */
export function scopeModulesToNode(
    modules: WorkspaceModuleItem[],
    enabledModuleIds: string[] | null,
): WorkspaceModuleItem[] {
    if (!enabledModuleIds) return modules;

    const available = new Map(modules.map((module) => [module.id, module]));

    return enabledModuleIds
        .map((id) => available.get(id))
        .filter((module): module is WorkspaceModuleItem => module !== undefined);
}
