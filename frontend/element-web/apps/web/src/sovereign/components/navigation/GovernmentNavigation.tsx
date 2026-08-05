/*
 * Sovereign Messenger — Sprint 1, Step 3 · Sprint 3, Milestone 3
 * GovernmentNavigation.tsx — CMP-14 Organisation Sidebar (tree region)
 *
 * The pilot branch is no longer embedded here. The tree renders whatever the
 * organisation configuration declares, at arbitrary depth and breadth (IA-2,
 * ORG-3), so a department is added by configuration alone (AC-14).
 *
 * IA-4: only the branch the user is authorised for reaches this component;
 * the authorisation decision belongs to OrganisationService, not the view.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, type JSX, type KeyboardEvent } from "react";

import { HierarchyNode } from "./HierarchyNode";
import { ModuleStateBoundary } from "../views/ModuleStateBoundary";
import { NAVIGATION_COPY } from "../../config/navigationCopy";
import { orgNodeName, type OrgLanguage, type OrgNode } from "../../services/OrganisationService";
import type { ResourceState } from "../../types/resource";

interface Props {
    /** IA-4: the branch this user may see. */
    tree: OrgNode | null;
    /** ES-1: the organisation surface carries the same four states as any other. */
    state: ResourceState;
    activeNodeId: string;
    onSelectNode: (nodeId: string) => void;
    /** NAV-1: icon-only rail when the sidebar is collapsed. */
    collapsed?: boolean;
    language?: OrgLanguage;
    onRetry?: () => void;
}

/** One row as the user sees it, in visual order — the basis for arrow-key movement. */
interface VisibleRow {
    node: OrgNode;
    level: number;
    parentId: string | null;
    hasChildren: boolean;
    isExpanded: boolean;
}

/** Ancestors of the active node are open, so the user's position is never hidden. */
function ancestorIds(tree: OrgNode | null, targetId: string): string[] {
    const found: string[] = [];

    const walk = (node: OrgNode, trail: string[]): boolean => {
        if (node.id === targetId) {
            found.push(...trail);
            return true;
        }
        return node.children.some((child) => walk(child, [...trail, node.id]));
    };

    if (tree) walk(tree, []);
    return found;
}

export function GovernmentNavigation({
    tree,
    state,
    activeNodeId,
    onSelectNode,
    collapsed = false,
    language = "uz",
    onRetry,
}: Props): JSX.Element {
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set(ancestorIds(tree, activeNodeId)));
    const [focusedId, setFocusedId] = useState<string>(activeNodeId);
    const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    // Focus is moved only in response to a key press, never on re-render —
    // otherwise arriving data would steal focus from wherever the user is.
    const pendingFocusId = useRef<string | null>(null);

    // Reveal the active node whenever the position changes, without closing
    // branches the user opened themselves.
    useEffect(() => {
        setExpanded((previous) => {
            const next = new Set(previous);
            ancestorIds(tree, activeNodeId).forEach((id) => next.add(id));
            return next;
        });
    }, [tree, activeNodeId]);

    const rows = useMemo<VisibleRow[]>(() => {
        const result: VisibleRow[] = [];

        const walk = (node: OrgNode, level: number, parentId: string | null): void => {
            const hasChildren = node.children.length > 0;
            const isExpanded = expanded.has(node.id);

            result.push({ node, level, parentId, hasChildren, isExpanded });

            if (hasChildren && isExpanded) {
                node.children.forEach((child) => walk(child, level + 1, node.id));
            }
        };

        if (tree) walk(tree, 1, null);
        return result;
    }, [tree, expanded]);

    // A row can disappear when a branch is collapsed; keep the tab stop on a
    // row that still exists so the tree never loses its single entry point.
    const tabbableId = rows.some((row) => row.node.id === focusedId)
        ? focusedId
        : (rows.find((row) => row.node.id === activeNodeId)?.node.id ?? rows[0]?.node.id ?? "");

    useEffect(() => {
        if (!pendingFocusId.current) return;
        rowRefs.current.get(pendingFocusId.current)?.focus();
        pendingFocusId.current = null;
    });

    const moveFocus = useCallback((nodeId: string) => {
        setFocusedId(nodeId);
        pendingFocusId.current = nodeId;
    }, []);

    const toggle = useCallback((nodeId: string) => {
        setExpanded((previous) => {
            const next = new Set(previous);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    }, []);

    /**
     * A11Y-1: the tree is fully operable by keyboard, following the standard
     * tree pattern so the behaviour matches what assistive technology users
     * already expect.
     */
    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>, nodeId: string) => {
            const index = rows.findIndex((row) => row.node.id === nodeId);
            if (index === -1) return;

            const row = rows[index];

            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    if (index < rows.length - 1) moveFocus(rows[index + 1].node.id);
                    break;

                case "ArrowUp":
                    event.preventDefault();
                    if (index > 0) moveFocus(rows[index - 1].node.id);
                    break;

                case "ArrowRight":
                    event.preventDefault();
                    if (row.hasChildren && !row.isExpanded) {
                        toggle(nodeId);
                    } else if (row.hasChildren && index < rows.length - 1) {
                        moveFocus(rows[index + 1].node.id);
                    }
                    break;

                case "ArrowLeft":
                    event.preventDefault();
                    if (row.hasChildren && row.isExpanded) {
                        toggle(nodeId);
                    } else if (row.parentId) {
                        moveFocus(row.parentId);
                    }
                    break;

                case "Home":
                    event.preventDefault();
                    if (rows.length > 0) moveFocus(rows[0].node.id);
                    break;

                case "End":
                    event.preventDefault();
                    if (rows.length > 0) moveFocus(rows[rows.length - 1].node.id);
                    break;

                case "Enter":
                case " ":
                    event.preventDefault();
                    onSelectNode(nodeId);
                    break;

                default:
                    break;
            }
        },
        [rows, moveFocus, toggle, onSelectNode],
    );

    const registerRow = useCallback((nodeId: string) => {
        return (element: HTMLDivElement | null): void => {
            if (element) {
                rowRefs.current.set(nodeId, element);
            } else {
                rowRefs.current.delete(nodeId);
            }
        };
    }, []);

    return (
        <nav
            id="sovereign-gov-nav"
            className={`svr-gov-nav${collapsed ? " is-collapsed" : ""}`}
            aria-label={NAVIGATION_COPY.hierarchyLabel}
        >
            {!collapsed && <h2 className="svr-gov-nav__heading">{NAVIGATION_COPY.hierarchyLabel}</h2>}

            {/* ES-1: loading, empty, unavailable, and error come from one place. */}
            <ModuleStateBoundary state={state} surface="organisation" onRetry={onRetry} loadingRows={4}>
                <div role="tree" aria-label={NAVIGATION_COPY.hierarchyLabel} className="svr-gov-nav__tree">
                    {rows.map((row) => (
                        <HierarchyNode
                            key={row.node.id}
                            ref={registerRow(row.node.id)}
                            nodeId={row.node.id}
                            name={orgNodeName(row.node, language)}
                            type={row.node.type}
                            level={row.level}
                            hasChildren={row.hasChildren}
                            isExpanded={row.isExpanded}
                            isActive={row.node.id === activeNodeId}
                            isTabbable={row.node.id === tabbableId}
                            collapsed={collapsed}
                            onSelect={onSelectNode}
                            onToggle={toggle}
                            onKeyDown={handleKeyDown}
                            onFocus={setFocusedId}
                        />
                    ))}
                </div>
            </ModuleStateBoundary>
        </nav>
    );
}
