/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * HierarchyNode.tsx — CMP-15 Hierarchy Node
 *
 * One organisational level within the sidebar tree.
 *
 * IA-2 / ORG-3: the node knows nothing about how deep it sits; indentation is
 * derived from its level, so any configured depth renders without change.
 * A11Y-5: the level's type is announced as text, never carried by the icon or
 * the indent alone.
 */

import React, { memo, forwardRef, type JSX, type KeyboardEvent } from "react";

import { Icon, type IconName } from "../ui";
import { ORG_NODE_TYPE_LABEL, NAVIGATION_COPY } from "../../config/navigationCopy";
import type { OrgNodeType } from "../../types/organisation";

/** CMP-15: each level takes an icon, but never as its only distinguishing mark. */
const NODE_TYPE_ICON: Record<OrgNodeType, IconName> = {
    Republic: "building",
    Viloyat: "building",
    Idora: "building",
    Bolim: "folder",
    Workspace: "briefcase",
};

export interface HierarchyNodeProps {
    nodeId: string;
    name: string;
    type: OrgNodeType;
    /** ARIA tree level, 1-based. */
    level: number;
    hasChildren: boolean;
    isExpanded: boolean;
    /** IA-3: this node is the user's current position in the hierarchy. */
    isActive: boolean;
    /** Roving tabindex: exactly one node in the tree is tabbable (A11Y-1). */
    isTabbable: boolean;
    /** Icon-only presentation while the sidebar is collapsed (NAV-1). */
    collapsed: boolean;
    onSelect: (nodeId: string) => void;
    onToggle: (nodeId: string) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>, nodeId: string) => void;
    onFocus: (nodeId: string) => void;
}

export const HierarchyNode = memo(
    forwardRef<HTMLDivElement, HierarchyNodeProps>(function HierarchyNode(
        {
            nodeId,
            name,
            type,
            level,
            hasChildren,
            isExpanded,
            isActive,
            isTabbable,
            collapsed,
            onSelect,
            onToggle,
            onKeyDown,
            onFocus,
        },
        ref,
    ): JSX.Element {
        const typeLabel = ORG_NODE_TYPE_LABEL[type];

        return (
            <div
                ref={ref}
                id={`gov-nav-node-${nodeId}`}
                role="treeitem"
                className={`svr-hierarchy-node${isActive ? " is-active" : ""}`}
                /*
                 * A11Y-1 / A11Y-3: one tab stop for the whole tree; arrow keys
                 * move within it, so the tree is never a keyboard trap and
                 * tabbing past it takes one press.
                 */
                tabIndex={isTabbable ? 0 : -1}
                aria-level={level}
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-selected={isActive}
                /* ORG-3: depth is data, so the indent is computed, not authored. */
                style={{ paddingInlineStart: `calc(var(--svr-space-3) + ${level - 1} * var(--svr-space-4))` }}
                onClick={() => onSelect(nodeId)}
                onKeyDown={(event) => onKeyDown(event, nodeId)}
                onFocus={() => onFocus(nodeId)}
                title={collapsed ? `${name} — ${typeLabel}` : undefined}
            >
                <span className="svr-hierarchy-node__twisty" aria-hidden="true">
                    {hasChildren && (
                        <span
                            className="svr-hierarchy-node__twisty-hit"
                            onClick={(event) => {
                                // Toggling must not also change the user's position:
                                // opening a branch is navigation, not selection.
                                event.stopPropagation();
                                onToggle(nodeId);
                            }}
                        >
                            <Icon name={isExpanded ? "chevron-down" : "chevron-right"} size="sm" />
                        </span>
                    )}
                </span>

                <Icon name={NODE_TYPE_ICON[type]} size="sm" className="svr-hierarchy-node__icon" />

                <span className="svr-hierarchy-node__label">{name}</span>

                {/* A11Y-5: the level is spoken, not inferred from the indent. */}
                <span className="svr-visually-hidden">
                    {` — ${typeLabel}`}
                    {hasChildren ? ` — ${isExpanded ? NAVIGATION_COPY.nodeCollapse : NAVIGATION_COPY.nodeExpand}` : ""}
                </span>
            </div>
        );
    }),
);
