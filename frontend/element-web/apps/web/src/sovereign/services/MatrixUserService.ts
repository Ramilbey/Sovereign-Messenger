/*
 * Sovereign Messenger — Sprint 2 Production Readiness
 * MatrixUserService.ts — Derives the current Sovereign identity from the
 * bridged Matrix client's own profile and account data.
 *
 * PRD §4.3 Role Storage Source Specification:
 * Role and department come from Matrix Account Data (m.identity.role).
 * Nothing currently writes that account data (the write side is the
 * Sprint 2 Phase 7 admin layer / MatrixAdminService, which does not exist
 * yet), so this defaults to the least-privileged role — Employee — rather
 * than assuming Manager. A missing role must never grant extra access.
 */

import { type AccountDataEvents, type MatrixClient } from "matrix-js-sdk/src/matrix";
import type { SovereignUser } from "../providers/useSovereignData";

// m.identity.role is a Sovereign-specific account data type, not part of the
// Matrix spec's well-known set, so it isn't a member of the SDK's own
// AccountDataEvents map — the cast below is required and expected, not a
// type-safety workaround for a real Matrix event type.
const ROLE_ACCOUNT_DATA_TYPE = "m.identity.role" as keyof AccountDataEvents;
const VALID_ROLES: ReadonlyArray<SovereignUser["role"]> = ["Manager", "Employee", "NationalAdmin"];

interface RoleAccountDataContent {
    role?: string;
    department?: string;
}

export class MatrixUserService {
    /**
     * Builds the current SovereignUser from the given (already-authenticated)
     * MatrixClient's own profile and m.identity.role account data.
     */
    public static getCurrentUser(client: MatrixClient): SovereignUser {
        const userId = client.getUserId() || "@unknown:unknown";
        const displayName = client.getUser(userId)?.displayName || userId;
        const { role, department } = this.resolveRole(client);

        return {
            id: userId,
            displayName,
            role,
            department,
            status: "online",
            statusLabel: "Tarmoqda",
            avatarInitials: this.getInitials(displayName, userId),
        };
    }

    /**
     * Reads m.identity.role account data. Defaults to Employee (least
     * privilege) when the event is missing, malformed, or carries an
     * unrecognized role value — never defaults to an elevated role.
     */
    private static resolveRole(client: MatrixClient): { role: SovereignUser["role"]; department: string | null } {
        try {
            const event = client.getAccountData(ROLE_ACCOUNT_DATA_TYPE);
            const content = event?.getContent<RoleAccountDataContent>();
            const isValidRole = typeof content?.role === "string" && VALID_ROLES.includes(content.role as SovereignUser["role"]);

            if (!isValidRole) {
                console.warn(
                    `[MatrixUserService] No valid ${ROLE_ACCOUNT_DATA_TYPE} account data for ${client.getUserId()}. ` +
                        `Defaulting to least-privileged role "Employee".`,
                );
            }

            return {
                role: isValidRole ? (content!.role as SovereignUser["role"]) : "Employee",
                department: content?.department || null,
            };
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixUserService] Error reading role account data:", detail);
            return { role: "Employee", department: null };
        }
    }

    private static getInitials(displayName: string, userId: string): string {
        const source = displayName && displayName !== userId ? displayName : userId.replace(/^@/, "");
        const cleaned = source.replace(/:.*$/, "").trim();
        return cleaned.length >= 2 ? cleaned.substring(0, 2).toUpperCase() : cleaned.toUpperCase().padEnd(2, "X");
    }
}
