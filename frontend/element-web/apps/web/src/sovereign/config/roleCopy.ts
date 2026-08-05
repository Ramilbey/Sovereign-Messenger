/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * roleCopy.ts — Official Role Designations
 *
 * GW-10 / GW-11: a person's organisational role is displayed wherever they
 * appear, using official designations rather than system terminology. The
 * internal role values are system vocabulary and are never shown (NFR-8), so
 * every surface that displays a role resolves it through this table — it was
 * previously duplicated per view, which allowed the designations to drift.
 */

import type { SovereignUser } from "../providers/useSovereignData";

export const ROLE_LABELS: Record<SovereignUser["role"], string> = {
    Manager: "Rahbar",
    Employee: "Xodim",
    NationalAdmin: "Milliy Administrator",
};

/** Official designation for a role value, falling back safely for unknowns. */
export function roleLabel(role: string): string {
    return ROLE_LABELS[role as SovereignUser["role"]] ?? ROLE_LABELS.Employee;
}
