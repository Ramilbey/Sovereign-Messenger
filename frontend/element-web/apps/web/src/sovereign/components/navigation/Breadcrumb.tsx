/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * Breadcrumb.tsx — CMP-17 Breadcrumb
 *
 * NAV-5: shows the full organisational path to the current context and is
 * navigable at each level.
 * IA-3 / UX-1: the user can answer "where am I in the organisation?" without
 * navigating anywhere.
 *
 * States (CMP-17): default, truncated. A deep hierarchy collapses its middle
 * rather than wrapping or scrolling the frame — the path stays complete and
 * one action away (ORG-3: depth is configuration, so it can be arbitrary).
 */

import React, { memo, useState, type JSX } from "react";

import { Icon } from "../ui";
import { NAVIGATION_COPY, ORG_NODE_TYPE_LABEL } from "../../config/navigationCopy";
import { orgNodeName, type OrgLanguage, type OrgNode } from "../../services/OrganisationService";

interface BreadcrumbProps {
    /** Root → current node, inclusive. */
    path: OrgNode[];
    onSelectNode: (nodeId: string) => void;
    language?: OrgLanguage;
    /**
     * Levels shown before the path collapses its middle. Below this the whole
     * path is rendered.
     */
    maxVisible?: number;
}

export const Breadcrumb = memo(function Breadcrumb({
    path,
    onSelectNode,
    language = "uz",
    maxVisible = 4,
}: BreadcrumbProps): JSX.Element | null {
    const [expanded, setExpanded] = useState<boolean>(false);

    if (path.length === 0) return null;

    const isTruncated = !expanded && path.length > maxVisible;

    // Keep the root for orientation and the tail for context; the middle is
    // what collapses, because that is the least informative part of a path.
    const visible = isTruncated ? [path[0], ...path.slice(path.length - (maxVisible - 1))] : path;
    const hiddenCount = path.length - visible.length;

    return (
        <nav className="svr-breadcrumb" aria-label={NAVIGATION_COPY.breadcrumbLabel}>
            <ol className="svr-breadcrumb__list">
                {visible.map((node, index) => {
                    const isCurrent = node.id === path[path.length - 1].id;
                    const showOverflowBefore = isTruncated && index === 1;

                    return (
                        <React.Fragment key={node.id}>
                            {showOverflowBefore && (
                                <li className="svr-breadcrumb__item">
                                    <Icon
                                        name="chevron-right"
                                        size="sm"
                                        className="svr-breadcrumb__separator"
                                    />
                                    <button
                                        type="button"
                                        className="svr-breadcrumb__overflow"
                                        onClick={() => setExpanded(true)}
                                        aria-label={`${NAVIGATION_COPY.breadcrumbExpand} (${hiddenCount})`}
                                    >
                                        <Icon name="more" size="sm" />
                                    </button>
                                </li>
                            )}

                            <li className="svr-breadcrumb__item">
                                {index > 0 && (
                                    <Icon
                                        name="chevron-right"
                                        size="sm"
                                        className="svr-breadcrumb__separator"
                                    />
                                )}

                                <button
                                    type="button"
                                    className={`svr-breadcrumb__link${isCurrent ? " is-current" : ""}`}
                                    /* A11Y-6: the current location is stated, not only styled. */
                                    aria-current={isCurrent ? "page" : undefined}
                                    onClick={() => onSelectNode(node.id)}
                                >
                                    {orgNodeName(node, language)}
                                    {/* A11Y-5: the level is spoken alongside the name. */}
                                    <span className="svr-visually-hidden">
                                        {` — ${ORG_NODE_TYPE_LABEL[node.type]}`}
                                    </span>
                                </button>
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
});
