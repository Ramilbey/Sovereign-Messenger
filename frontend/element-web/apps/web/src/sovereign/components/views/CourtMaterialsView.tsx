/*
 * Sovereign Messenger — Sprint 1, Step 9
 * CourtMaterialsView.tsx — Workspace view for Tergov Court Materials module (⚖ Sud materiallari).
 * Backed by useCourtMaterials() hook.
 */

import React, { memo, type JSX } from "react";
import { useCourtMaterials } from "../../providers/useSovereignData";
import "./ModuleViews.css";

export const CourtMaterialsView = memo(function CourtMaterialsView(): JSX.Element {
    const materials = useCourtMaterials();

    return (
        <div id="module-view-court-materials" className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-icon">⚖</span>
                <span className="svr-module-header-title">Sud Materiallari</span>
                <span className="svr-module-header-count">{materials.length} ta material</span>
            </div>

            <div className="svr-inv-list">
                {materials.map((m) => (
                    <div key={m.id} className="svr-inv-card">
                        <div className="svr-inv-card-row">
                            <div>
                                <div className="svr-inv-card-title">{m.title}</div>
                                <div className="svr-inv-card-meta">
                                    Ish: <span className="svr-inv-card-accent">#{m.caseNumber}</span>{" "}
                                    • Tur: {m.typeLabel}
                                    <br />
                                    Sud: {m.court}
                                    <br />
                                    Tayyorladi: {m.preparedBy} • Yuborildi: {m.submittedDate}
                                </div>
                            </div>
                            <div className="svr-inv-card-badges">
                                <span className={`svr-inv-badge ${m.status}`}>{m.statusLabel}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});
