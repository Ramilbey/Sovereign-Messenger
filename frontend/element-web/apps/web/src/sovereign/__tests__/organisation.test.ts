/*
 * Sovereign Messenger — Sprint 3, Milestone 3 acceptance
 * organisation.test.ts — AC-14, ORG-1 … ORG-8, IA-1 … IA-5
 */

import { describe, it, expect } from "vitest";

import { OrganisationService } from "../services/OrganisationService";
import { scopeModulesToNode, TERGOV_WORKSPACE_MODULES } from "../config/workspaceModules";
import type { OrganisationConfig } from "../types/organisation";

const shipped = OrganisationService.getInstance();

describe("AC-14 — a second department is added by configuration only", () => {
    it("resolves the second department from the shipped configuration", () => {
        // No code names this department; it exists only in the configuration.
        const position = shipped.resolvePosition("Jinoyat qidiruv");
        expect(position).toBe("jinoyat_qidiruv_workspace");
    });

    it("resolves it by organisational code as well as by name", () => {
        expect(shipped.resolvePosition("SAM-IIB-JQ")).toBe("jinoyat_qidiruv_workspace");
    });

    it("renders it at full depth under the same Idora", () => {
        const path = shipped.getPath("jinoyat_qidiruv_workspace").map((n) => n.id);
        expect(path).toEqual(["uz", "samarqand", "sam_iib", "jinoyat_qidiruv", "jinoyat_qidiruv_workspace"]);
    });

    it("gives it its own module set (ORG-6, IA-12)", () => {
        const tergov = scopeModulesToNode(
            TERGOV_WORKSPACE_MODULES,
            shipped.getEnabledModuleIds("tergov_workspace"),
        );
        const jinoyat = scopeModulesToNode(
            TERGOV_WORKSPACE_MODULES,
            shipped.getEnabledModuleIds("jinoyat_qidiruv_workspace"),
        );

        expect(tergov).toHaveLength(17);
        expect(jinoyat).toHaveLength(12);
        expect(jinoyat.map((m) => m.id)).not.toContain("cases");
    });
});

describe("ORG-3 / IA-2 — arbitrary depth and breadth without code change", () => {
    function chain(depth: number): OrganisationConfig {
        const nodes: OrganisationConfig["nodes"] = [
            { id: "n0", parentId: null, type: "Republic", name: { uz: "n0", ru: "n0" } },
        ];
        for (let i = 1; i < depth; i++) {
            nodes.push({
                id: `n${i}`,
                parentId: `n${i - 1}`,
                type: "Bolim",
                name: { uz: `n${i}`, ru: `n${i}` },
            });
        }
        return { version: 1, rootId: "n0", defaultNodeId: `n${depth - 1}`, nodes };
    }

    it("renders a hierarchy far deeper than the pilot", () => {
        const service = OrganisationService.withConfig(chain(20));
        expect(service.isValid()).toBe(true);
        expect(service.getPath("n19")).toHaveLength(20);
    });
});

describe("IA-4 / ORG-5 — a user sees only their own branch", () => {
    it("excludes sibling departments from the visible tree", () => {
        const tree = shipped.getVisibleTree("tergov_workspace");
        const ids: string[] = [];
        const walk = (n: any): void => {
            ids.push(n.id);
            n.children.forEach(walk);
        };
        if (tree) walk(tree);

        expect(ids).toContain("tergov_workspace");
        expect(ids).not.toContain("jinoyat_qidiruv");
    });

    it("refuses navigation outside the authorised branch", () => {
        expect(shipped.isAuthorised("tergov_workspace", "jinoyat_qidiruv")).toBe(false);
        expect(shipped.isAuthorised("sam_iib", "tergov_workspace")).toBe(true);
    });
});

describe("ES-5 — a malformed hierarchy is an error state, never a hang", () => {
    it("reports unknown parents and a missing root", () => {
        const service = OrganisationService.withConfig({
            version: 1,
            rootId: "missing",
            defaultNodeId: "x",
            nodes: [{ id: "a", parentId: "ghost", type: "Bolim", name: { uz: "A", ru: "A" } }],
        } as OrganisationConfig);

        expect(service.isValid()).toBe(false);
        expect(service.getProblems().length).toBeGreaterThan(0);
    });

    it("terminates on a parent cycle rather than looping forever", () => {
        const service = OrganisationService.withConfig({
            version: 1,
            rootId: "r",
            defaultNodeId: "r",
            nodes: [
                { id: "r", parentId: null, type: "Republic", name: { uz: "R", ru: "R" } },
                { id: "a", parentId: "b", type: "Idora", name: { uz: "A", ru: "A" } },
                { id: "b", parentId: "a", type: "Idora", name: { uz: "B", ru: "B" } },
            ],
        } as OrganisationConfig);

        // Reaching this line at all is the assertion: these three calls each
        // walk parent references, and an unguarded walk never returns.
        expect(service.getPath("a")).toBeDefined();
        expect(service.getCode("a")).toBeNull();
        expect(service.getEnabledModuleIds("a")).toBeNull();
        expect(service.isValid()).toBe(false);
    });
});

describe("ORG-4 / AS-1 — position resolution never invents a placement", () => {
    it("falls back to the configured default when the hint matches nothing", () => {
        expect(shipped.resolvePosition("nothing-like-this")).toBe("tergov_workspace");
        expect(shipped.resolvePosition(null)).toBe("tergov_workspace");
    });
});
