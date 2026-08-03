/*
 * Sovereign Messenger — Step 8
 * ChannelsView.tsx — Workspace view for Channels module.
 *
 * Renders Channel Management & Directory view in WorkspaceArea.
 * Displays official channels, descriptions, posting permission rules,
 * and allows switching the active channel in ChatArea.
 */

import React, { memo, type JSX } from "react";
import { useChannels } from "../../providers/useSovereignData";
import { useChat } from "../../context/ChatContext";
import "./ModuleViews.css";

export const ChannelsView = memo(function ChannelsView(): JSX.Element {
    const { channels } = useChannels();
    const { activeChannelId, setActiveChannelId } = useChat();

    return (
        <div id="module-view-channels" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">📢</span>
                <span className="svr-module-header-title">Rasmiy Kanallar</span>
                <span className="svr-module-header-count">{channels.length} ta kanal</span>
            </div>

            <div className="svr-documents-list">
                {channels.map((channel) => {
                    const isActive = channel.id === activeChannelId;
                    return (
                        <div
                            key={channel.id}
                            className="svr-document-card"
                            style={{
                                borderColor: isActive ? "#5288c1" : "#2b3a4a",
                                backgroundColor: isActive ? "#1e2d3d" : "#17212b",
                            }}
                        >
                            <div className="svr-document-info">
                                <span className="svr-document-icon">{channel.icon}</span>
                                <div>
                                    <div className="svr-document-title">
                                        {channel.name}{" "}
                                        {isActive && (
                                            <span style={{ fontSize: "11px", color: "#5288c1", marginLeft: "6px" }}>
                                                (Faol chat)
                                            </span>
                                        )}
                                    </div>
                                    <div className="svr-document-meta">
                                        {channel.description} •{" "}
                                        {channel.readOnlyForEmployees
                                            ? "🔒 Faqat Rahbarlar yozishi mumkin"
                                            : "🔓 Barcha xodimlar yozishi mumkin"}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveChannelId(channel.id)}
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
        </div>
    );
});
