/*
 * Sovereign Messenger — Sprint 1, Step 4 Refactoring
 * workspaceModules.ts — Tergov Workspace module definitions & metadata.
 *
 * Blueprint §3.2 & §6 strict order configuration:
 * 1. Universal modules (9)
 * 2. Special Investigation modules (5)
 * 3. Personal Chats
 * 4. Favorites
 * 5. Settings
 */

export interface WorkspaceModuleItem {
    id: string;
    label: string;
    icon: string;
    category: "universal" | "special" | "personal" | "favorites" | "settings";
    /** Role requirements — defaults to all roles unless specified */
    requiredRole?: "Manager" | "NationalAdmin";
}

export const TERGOV_WORKSPACE_MODULES: WorkspaceModuleItem[] = [
    // 1. Universal (9 modules)
    { id: "channels", label: "Kanallar", icon: "📢", category: "universal" },
    { id: "groups", label: "Guruhlar", icon: "💬", category: "universal" },
    { id: "members", label: "Xodimlar", icon: "👥", category: "universal" },
    { id: "documents", label: "Hujjatlar", icon: "📁", category: "universal" },
    { id: "tasks", label: "Vazifalar", icon: "✅", category: "universal" },
    { id: "calendar", label: "Kalendar", icon: "📅", category: "universal" },
    { id: "dashboard", label: "Dashboard", icon: "📊", category: "universal", requiredRole: "Manager" },
    { id: "pinned", label: "Pinned", icon: "📌", category: "universal" },
    { id: "workspace_settings", label: "Workspace sozlamalari", icon: "⚙", category: "universal", requiredRole: "Manager" },

    // 2. Special Tergov modules (5 modules)
    { id: "cases", label: "Ishlar", icon: "🗂", category: "special" },
    { id: "suspects", label: "Gumonlanuvchilar", icon: "👤", category: "special" },
    { id: "evidence", label: "Dalillar", icon: "📷", category: "special" },
    { id: "records", label: "Bayonnomalar", icon: "📜", category: "special" },
    { id: "court_materials", label: "Sud materiallari", icon: "⚖", category: "special" },

    // 3. Personal Chats
    { id: "direct_chats", label: "Shaxsiy chatlar", icon: "💬", category: "personal" },

    // 4. Favorites
    { id: "favorites", label: "Sevimlilar", icon: "⭐", category: "favorites" },

    // 5. General Settings
    { id: "settings", label: "Sozlamalar", icon: "⚙", category: "settings" },
];
