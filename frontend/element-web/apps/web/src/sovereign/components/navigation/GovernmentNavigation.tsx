/*
 * Sovereign Messenger — Sprint 1, Step 3
 * GovernmentNavigation.tsx — Government hierarchy navigation tree.
 *
 * Blueprint §3 & §3.1:
 * Pilot branch only: Samarqand viloyati → Ichki Ishlar → Tergov.
 */

import React, { useState, type JSX } from "react";

export interface GovernmentNode {
    id: string;
    label: string;
    icon?: string;
    children?: GovernmentNode[];
    isWorkspace?: boolean;
}

/**
 * Strict pilot hierarchy data per Blueprint §3.1:
 * Only Samarqand viloyati -> Ichki Ishlar -> Tergov.
 */
const PILOT_GOVERNMENT_HIERARCHY: GovernmentNode[] = [
    {
        id: "samarqand",
        label: "Samarqand viloyati",
        icon: "🏛",
        children: [
            {
                id: "ichki_ishlar",
                label: "Ichki Ishlar",
                icon: "👮",
                children: [
                    { id: "tergov", label: "Tergov", icon: "📂", isWorkspace: true },
                ],
            },
        ],
    },
];

interface Props {
    activeWorkspaceId?: string;
    onSelectWorkspace?: (workspaceId: string) => void;
}

export function GovernmentNavigation({
    activeWorkspaceId = "tergov",
    onSelectWorkspace,
}: Props): JSX.Element {
    // Default open nodes for pilot: Samarqand viloyati and Ichki Ishlar
    const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({
        samarqand: true,
        ichki_ishlar: true,
    });

    const toggleNode = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNodeIds((prev) => ({
            ...prev,
            [nodeId]: !prev[nodeId],
        }));
    };

    const handleSelect = (node: GovernmentNode) => {
        if (node.isWorkspace && onSelectWorkspace) {
            onSelectWorkspace(node.id);
        }
    };

    const renderTree = (nodes: GovernmentNode[], depth = 0) => {
        return (
            <ul className={`svr-gov-nav-tree depth-${depth}`}>
                {nodes.map((node) => {
                    const hasChildren = Boolean(node.children && node.children.length > 0);
                    const isExpanded = Boolean(expandedNodeIds[node.id]);
                    const isSelected = node.id === activeWorkspaceId;

                    return (
                        <li key={node.id} className="svr-gov-nav-item">
                            <div
                                id={`gov-nav-node-${node.id}`}
                                className={`svr-gov-nav-row ${isSelected ? "selected" : ""} ${
                                    node.isWorkspace ? "workspace-node" : "dept-node"
                                }`}
                                style={{ paddingLeft: `${12 + depth * 14}px` }}
                                onClick={() => {
                                    if (hasChildren) {
                                        setExpandedNodeIds((prev) => ({
                                            ...prev,
                                            [node.id]: !prev[node.id],
                                        }));
                                    }
                                    if (node.isWorkspace) {
                                        handleSelect(node);
                                    }
                                }}
                            >
                                {hasChildren ? (
                                    <span
                                        className="svr-gov-nav-arrow"
                                        onClick={(e) => toggleNode(node.id, e)}
                                    >
                                        {isExpanded ? "▾" : "▸"}
                                    </span>
                                ) : (
                                    <span className="svr-gov-nav-bullet">•</span>
                                )}
                                <span className="svr-gov-nav-icon">{node.icon || "📁"}</span>
                                <span className="svr-gov-nav-label">{node.label}</span>
                            </div>

                            {hasChildren && isExpanded && renderTree(node.children!, depth + 1)}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div id="sovereign-gov-nav" className="svr-gov-nav">
            <div className="svr-gov-nav-header">Davlat Boshqaruvi</div>
            {renderTree(PILOT_GOVERNMENT_HIERARCHY)}
        </div>
    );
}
