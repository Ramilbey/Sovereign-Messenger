/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * OrganisationService.ts — Configuration-Driven Organisation Model
 *
 * Implements ORG-1 … ORG-8 and IA-1 … IA-5.
 *
 * The hierarchy is data, not code: this service reads a node list from
 * organisation.config.json and derives the tree, the path to any node, the
 * branch a given user may see, and the modules a node enables. Adding a
 * department is therefore a configuration change with no code change (AC-14).
 *
 * Readiness Review R-5: no authoritative organisational data source exists in
 * the deployment. The configuration file is the Sprint 3 artefact that stands
 * in for one. It is deployment configuration — not demonstration data — so it
 * is authoritative in both runtime modes (FR-1).
 */

import rawConfig from "../config/organisation.config.json";

/** ORG-2: the node types the model must support at minimum. */
export type OrgNodeType = "Republic" | "Viloyat" | "Idora" | "Bolim" | "Workspace";

/** ORG-1: display name in each supported language (NFR-3). */
export interface OrgNodeName {
    uz: string;
    ru: string;
}

/** One node exactly as declared in configuration. */
export interface OrgNodeConfig {
    id: string;
    parentId: string | null;
    type: OrgNodeType;
    name: OrgNodeName;
    /** ORG-7: organisational code shown in the application frame. */
    code?: string;
    /** ORG-6 / IA-12: module ids this node enables, in display order. */
    modules?: string[];
}

export interface OrganisationConfig {
    version: number;
    rootId: string;
    /** ORG-4: position used when a user's own position cannot be resolved. */
    defaultNodeId: string;
    nodes: OrgNodeConfig[];
}

/** A configured node resolved into the tree. */
export interface OrgNode extends OrgNodeConfig {
    children: OrgNode[];
    /** Distance from the configured root, used for indentation only. */
    depth: number;
}

/** Supported interface languages (NFR-3). */
export type OrgLanguage = keyof OrgNodeName;

/**
 * Display name of a node in the requested language, falling back to Uzbek —
 * the primary product language — when a translation is absent.
 */
export function orgNodeName(node: OrgNodeConfig, language: OrgLanguage = "uz"): string {
    return node.name[language] || node.name.uz || node.id;
}

export class OrganisationService {
    private static instance: OrganisationService | null = null;

    private readonly config: OrganisationConfig;
    private readonly byId = new Map<string, OrgNode>();
    private readonly problems: string[] = [];
    private root: OrgNode | null = null;

    private constructor(config: OrganisationConfig) {
        this.config = config;
        this.build();
    }

    public static getInstance(): OrganisationService {
        if (!OrganisationService.instance) {
            OrganisationService.instance = new OrganisationService(rawConfig as OrganisationConfig);
        }
        return OrganisationService.instance;
    }

    /** Rebuilds from an explicit configuration. Used by tests and by AC-14 rehearsal. */
    public static withConfig(config: OrganisationConfig): OrganisationService {
        return new OrganisationService(config);
    }

    /** Discards the cached instance so a changed configuration is re-read. */
    public static reset(): void {
        OrganisationService.instance = null;
    }

    /**
     * Configuration defects found while building the tree.
     *
     * ES-5 / FR-2: a malformed hierarchy resolves to an error state that the
     * user can retry, rather than a thrown exception or a silently empty
     * sidebar that looks like "you belong to nothing".
     */
    public getProblems(): readonly string[] {
        return this.problems;
    }

    public isValid(): boolean {
        return this.problems.length === 0 && this.root !== null;
    }

    /** ORG-3: the full configured hierarchy, at whatever depth it declares. */
    public getRoot(): OrgNode | null {
        return this.root;
    }

    public getNode(nodeId: string): OrgNode | null {
        return this.byId.get(nodeId) ?? null;
    }

    /**
     * NAV-5: root → node, inclusive. Each entry is navigable, so breadcrumbs
     * render directly from this without walking parents themselves.
     */
    public getPath(nodeId: string): OrgNode[] {
        const path: OrgNode[] = [];
        let current = this.byId.get(nodeId) ?? null;

        while (current) {
            path.unshift(current);
            current = current.parentId ? (this.byId.get(current.parentId) ?? null) : null;
        }

        return path;
    }

    /**
     * ORG-4: the user's position in the hierarchy.
     *
     * The only signal available in Production Mode is the optional department
     * carried on the user's own identity account data (AS-1). It is matched
     * against node id, code, and Uzbek name. Where it is absent or matches
     * nothing, the configured default position applies — a position is never
     * invented from unrelated data.
     */
    public resolvePosition(departmentHint?: string | null): string {
        const fallback = this.byId.has(this.config.defaultNodeId)
            ? this.config.defaultNodeId
            : (this.root?.id ?? this.config.rootId);

        const hint = departmentHint?.trim().toLowerCase();
        if (!hint) return fallback;

        for (const node of this.byId.values()) {
            const matches =
                node.id.toLowerCase() === hint ||
                node.code?.toLowerCase() === hint ||
                node.name.uz.toLowerCase() === hint ||
                node.name.ru.toLowerCase() === hint;

            if (matches) {
                return this.toWorkspace(node).id;
            }
        }

        return fallback;
    }

    /**
     * IA-4 / ORG-5: the branch this user may see — the path from the root down
     * to their own position, plus everything beneath it.
     *
     * Sibling branches are excluded. There is no authoritative source stating
     * that a member of one department may see another (R-6), and this codebase
     * resolves absent authorisation data to least privilege everywhere else.
     */
    public getVisibleTree(positionId: string): OrgNode | null {
        if (!this.root) return null;

        const path = this.getPath(positionId);
        if (path.length === 0) return null;

        // Rebuild the chain top-down, keeping only the child that continues it,
        // then attach the position's own subtree in full.
        const chain: OrgNode[] = path.map((node, index) => ({
            ...node,
            children: index === path.length - 1 ? node.children : [],
        }));

        for (let i = 0; i < chain.length - 1; i++) {
            chain[i].children = [chain[i + 1]];
        }

        return chain[0];
    }

    /** ORG-5: whether the user at `positionId` may navigate to `targetId`. */
    public isAuthorised(positionId: string, targetId: string): boolean {
        if (positionId === targetId) return true;
        return this.getPath(targetId).some((node) => node.id === positionId);
    }

    /**
     * ORG-6 / IA-11 / IA-12: module ids enabled for a node, in configured
     * order. Declaration is inherited from the nearest ancestor that declares
     * one; `null` means the node places no restriction and every module
     * applies.
     */
    public getEnabledModuleIds(nodeId: string): string[] | null {
        let current = this.byId.get(nodeId) ?? null;

        while (current) {
            if (current.modules) return current.modules;
            current = current.parentId ? (this.byId.get(current.parentId) ?? null) : null;
        }

        return null;
    }

    /**
     * ORG-7: the code identifying a node, inherited from the nearest ancestor
     * that declares one — a workspace is identified by its department's code
     * rather than restating it.
     */
    public getCode(nodeId: string): string | null {
        let current = this.byId.get(nodeId) ?? null;

        while (current) {
            if (current.code) return current.code;
            current = current.parentId ? (this.byId.get(current.parentId) ?? null) : null;
        }

        return null;
    }

    /** Nearest ancestor-or-self of the given type, for deriving frame labels. */
    public getAncestorOfType(nodeId: string, type: OrgNodeType): OrgNode | null {
        return this.getPath(nodeId).reverse().find((node) => node.type === type) ?? null;
    }

    // ── Construction ─────────────────────────────────────────────────────────

    private build(): void {
        const seen = new Set<string>();

        for (const declared of this.config.nodes) {
            if (seen.has(declared.id)) {
                this.problems.push(`Duplicate node id "${declared.id}".`);
                continue;
            }
            seen.add(declared.id);
            this.byId.set(declared.id, { ...declared, children: [], depth: 0 });
        }

        for (const node of this.byId.values()) {
            if (node.parentId === null) continue;

            const parent = this.byId.get(node.parentId);
            if (!parent) {
                this.problems.push(`Node "${node.id}" refers to unknown parent "${node.parentId}".`);
                continue;
            }
            parent.children.push(node);
        }

        const root = this.byId.get(this.config.rootId) ?? null;
        if (!root) {
            this.problems.push(`Configured root "${this.config.rootId}" does not exist.`);
            return;
        }
        if (root.parentId !== null) {
            this.problems.push(`Configured root "${root.id}" must not declare a parent.`);
        }

        this.assignDepths(root, 0, new Set());
        this.root = root;

        // A node outside the root's tree would never render (ORG-3), so it is a
        // configuration defect rather than a silent omission.
        for (const node of this.byId.values()) {
            if (node !== root && !this.getPath(node.id).some((entry) => entry.id === root.id)) {
                this.problems.push(`Node "${node.id}" is not reachable from the root.`);
            }
        }
    }

    private assignDepths(node: OrgNode, depth: number, visiting: Set<string>): void {
        if (visiting.has(node.id)) {
            this.problems.push(`Node "${node.id}" takes part in a parent cycle.`);
            return;
        }
        visiting.add(node.id);

        node.depth = depth;
        // ORG-1: order within a level is the configured order, so a department's
        // position in the sidebar is decided by whoever maintains the file.
        node.children.forEach((child) => this.assignDepths(child, depth + 1, visiting));

        visiting.delete(node.id);
    }

    /** A position is expressed as a workspace where the node declares one. */
    private toWorkspace(node: OrgNode): OrgNode {
        if (node.type === "Workspace") return node;
        return node.children.find((child) => child.type === "Workspace") ?? node;
    }
}
