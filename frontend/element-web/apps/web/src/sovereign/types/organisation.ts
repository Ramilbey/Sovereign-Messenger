/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * organisation.ts — Organisation Domain Model
 *
 * The vocabulary of the hierarchy: node types, names, and the pure formatter
 * that resolves a display name.
 *
 * These live in the types layer rather than beside the service because the
 * interface needs the vocabulary to describe what it is rendering, and
 * Blueprint §8 does not permit a component to reach into the service layer.
 * Nothing here holds state, reads the platform, or performs a request.
 */

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
