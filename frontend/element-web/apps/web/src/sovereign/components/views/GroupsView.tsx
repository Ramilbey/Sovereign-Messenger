/*
 * Sovereign Messenger — Step 8
 * GroupsView.tsx — Workspace view for Groups module.
 *
 * Renders Group Chat Directory view in WorkspaceArea.
 * Displays active groups, descriptions, posting permission rules (unrestricted for all employees),
 * and allows switching the active group chat in ChatArea.
 */

import React, { memo, type JSX } from "react";
import { useChannels } from "../../providers/useSovereignData";
import { useChat } from "../../context/ChatContext";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import "./ModuleViews.css";

export const GroupsView = memo(function GroupsView(): JSX.Element {
    const { data: { groups }, state } = useChannels();
    const { activeChannelId, setActiveChannelId } = useChat();

    return (
        <div id="module-view-groups" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">💬</span>
                <span className="svr-module-header-title">Guruhlar</span>
                {state === "ready" && (<span className="svr-module-header-count">{groups.length} ta guruh</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="groups">
                <div className="svr-documents-list">
                    {groups.map((group) => {
                        const isActive = group.id === activeChannelId;
                        return (
                            <div
                                key={group.id}
                                className="svr-document-card"
                                style={{
                                    borderColor: isActive ? "#5288c1" : "#2b3a4a",
                                    backgroundColor: isActive ? "#1e2d3d" : "#17212b",
                                }}
                            >
                                <div className="svr-document-info">
                                    <span className="svr-document-icon">{group.icon}</span>
                                    <div>
                                        <div className="svr-document-title">
                                            {group.name}{" "}
                                            {isActive && (
                                                <span style={{ fontSize: "11px", color: "#5288c1", marginLeft: "6px" }}>
                                                    (Faol guruh)
                                                </span>
                                            )}
                                        </div>
                                        <div className="svr-document-meta">
                                            {group.description} • 🔓 Barcha xodimlar yozishi mumkin
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiveChannelId(group.id)}
                                    style={{
                                        backgroundColor: isActive ? "#5288c1" : "#2b5278",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "6px 14px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                    }}
                                >
                                    {isActive ? "Ochilgan" : "Chatni ochish"}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </ModuleStateBoundary>
        </div>
    );
});
