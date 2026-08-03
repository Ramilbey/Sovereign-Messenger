/*
 * Sovereign Messenger — Sprint 1, Step 6
 * PermissionContext.tsx — Role-Based Permission Context & Hooks.
 *
 * Blueprint §4 & §6 Rules:
 * - Employee: Dashboard & Workspace settings are COMPLETELY REMOVED from UI (not disabled).
 *   Cannot post in channels (read-only).
 * - Manager (Department Manager): Sees all 14 modules (including Dashboard & Workspace settings).
 *   Can post in channels.
 * - NationalAdmin: Sees all modules + emergency broadcast capabilities.
 */

import React, { createContext, useContext, useMemo, type ReactNode, type JSX } from "react";
import type { SovereignUser } from "../providers/useSovereignData";
import {
    TERGOV_WORKSPACE_MODULES,
    type WorkspaceModuleItem,
} from "../config/workspaceModules";

export interface PermissionContextValue {
    currentUser: SovereignUser;
    role: SovereignUser["role"];
    isManager: boolean;
    isEmployee: boolean;
    isNationalAdmin: boolean;
    canAccessModule: (moduleId: string) => boolean;
    canPostInChannel: (isReadOnlyChannel?: boolean) => boolean;
    getAllowedModules: () => WorkspaceModuleItem[];
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
    currentUser: SovereignUser;
    children: ReactNode;
}

export function PermissionProvider({
    currentUser,
    children,
}: PermissionProviderProps): JSX.Element {
    const value = useMemo<PermissionContextValue>(() => {
        const role = currentUser.role;
        const isManager = role === "Manager";
        const isNationalAdmin = role === "NationalAdmin";
        const isEmployee = role === "Employee";

        const canAccessModule = (moduleId: string): boolean => {
            const moduleDef = TERGOV_WORKSPACE_MODULES.find((m) => m.id === moduleId);
            if (!moduleDef) return true;

            // Strict Blueprint §4 Rule: Dashboard & Workspace settings are hidden for Employees
            if (moduleDef.requiredRole === "Manager" && !isManager && !isNationalAdmin) {
                return false;
            }
            if (moduleDef.requiredRole === "NationalAdmin" && !isNationalAdmin) {
                return false;
            }
            return true;
        };

        const getAllowedModules = (): WorkspaceModuleItem[] => {
            return TERGOV_WORKSPACE_MODULES.filter((m) => canAccessModule(m.id));
        };

        const canPostInChannel = (isReadOnlyChannel = true): boolean => {
            // Blueprint §3.2 Channel Rule: Manager & NationalAdmin can post; Employees read-only in official channels
            if (isManager || isNationalAdmin) return true;
            return !isReadOnlyChannel;
        };

        return {
            currentUser,
            role,
            isManager,
            isEmployee,
            isNationalAdmin,
            canAccessModule,
            canPostInChannel,
            getAllowedModules,
        };
    }, [currentUser]);

    return (
        <PermissionContext.Provider value={value}>
            {children}
        </PermissionContext.Provider>
    );
}

/**
 * Custom hook to access PermissionContext.
 */
export function usePermissions(): PermissionContextValue {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error("usePermissions must be used within a PermissionProvider");
    }
    return context;
}
