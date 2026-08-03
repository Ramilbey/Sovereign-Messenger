/*
 * Sovereign Messenger — Sprint 1, Step 9
 * ReportsView.tsx — Workspace view for Tergov Reports module (📜 Bayonnomalar).
 * Backed by useReports() hook.
 */

import React, { memo, type JSX } from "react";
import { useReports } from "../../providers/useSovereignData";
import "./ModuleViews.css";

export const ReportsView = memo(function ReportsView(): JSX.Element {
    const reports = useReports();

    return (
        <div id="module-view-records" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">📜</span>
                <span className="svr-module-header-title">Bayonnomalar</span>
                <span className="svr-module-header-count">{reports.length} ta bayonnoma</span>
            </div>

            <div className="svr-inv-list">
                {reports.map((r) => (
                    <div key={r.id} className="svr-inv-card">
                        <div className="svr-inv-card-row">
                            <div>
                                <div className="svr-inv-card-title">{r.title}</div>
                                <div className="svr-inv-card-meta">
                                    Ish: <span className="svr-inv-card-accent">#{r.caseNumber}</span>{" "}
                                    • Tur: {r.typeLabel}
                                    <br />
                                    Muallif: {r.author} • Sana: {r.date} • {r.pageCount} sahifa
                                </div>
                            </div>
                            <div className="svr-inv-card-badges">
                                <span className={`svr-inv-badge ${r.status}`}>{r.statusLabel}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
