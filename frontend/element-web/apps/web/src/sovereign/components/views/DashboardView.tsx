/*
 * Sovereign Messenger — Step 8
 * DashboardView.tsx — Workspace view for Dashboard module.
 * Backed by useDashboard() hook.
 */

import React, { memo, type JSX } from "react";
import { useDashboard } from "../../providers/useSovereignData";
import "./ModuleViews.css";

export const DashboardView = memo(function DashboardView(): JSX.Element {
    const stats = useDashboard();

    return (
        <div id="module-view-dashboard" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">📊</span>
                <span className="svr-module-header-title">Dashboard</span>
                <span className="svr-module-header-count">Statistika</span>
            </div>

            <div className="svr-dashboard-grid">
                <div className="svr-dashboard-stat-card">
                    <span className="svr-stat-label">Online Xodimlar</span>
                    <span className="svr-stat-value svr-stat-accent">{stats.onlineUsers}</span>
                </div>
                <div className="svr-dashboard-stat-card">
                    <span className="svr-stat-label">Offline Xodimlar</span>
                    <span className="svr-stat-value">{stats.offlineUsers}</span>
                </div>
                <div className="svr-dashboard-stat-card">
                    <span className="svr-stat-label">Jami Vazifalar</span>
                    <span className="svr-stat-value">{stats.totalTasks}</span>
                </div>
                <div className="svr-dashboard-stat-card">
                    <span className="svr-stat-label">Bajarilgan Vazifalar</span>
                    <span className="svr-stat-value svr-stat-accent">{stats.completedTasks}</span>
                </div>
                <div className="svr-dashboard-stat-card">
                    <span className="svr-stat-label">Favqulodda Ogohlantirishlar</span>
                    <span className="svr-stat-value svr-stat-alert">{stats.emergencyAlerts}</span>
                </div>
            </div>
        </div>
    );
});
