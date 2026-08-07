/*
 * Sovereign Messenger — Sprint 1, Step 9
 * CasesView.tsx — Workspace view for Tergov Cases module (Ishlar).
 * TOK-13 / AC-16: institutional iconography, never an emoji.
 * Backed by useCases() hook.
 */

import React, { memo, type JSX } from "react";
import { useCases } from "../../providers/useSovereignData";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import { Icon } from "../ui";
import "./ModuleViews.css";

export const CasesView = memo(function CasesView(): JSX.Element {
    const { data: cases, state } = useCases();

    return (
        <div id="module-view-cases" className="svr-module-view-root">
            <div className="svr-module-header">
                <Icon name="briefcase" size="md" className="svr-module-header-icon" />
                <span className="svr-module-header-title">Tergov Ishlari</span>
                {state === "ready" && (<span className="svr-module-header-count">{cases.length} ta ish</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="cases">
                <div className="svr-inv-list">
                    {cases.map((c) => (
                        <div key={c.id} className="svr-inv-card">
                            <div className="svr-inv-card-row">
                                <div>
                                    <div className="svr-inv-card-title">
                                        <span className="svr-inv-card-accent">#{c.caseNumber}</span>{" "}
                                        {c.title}
                                    </div>
                                    <div className="svr-inv-card-meta">
                                        Tergovchi: {c.investigatorName} • Ochilgan: {c.openedDate}
                                        <br />
                                        {c.description}
                                    </div>
                                </div>
                                <div className="svr-inv-card-badges">
                                    <span className={`svr-inv-badge ${c.status}`}>{c.statusLabel}</span>
                                    <span className={`svr-inv-badge ${c.priority}`}>{c.priorityLabel}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ModuleStateBoundary>
        </div>
    );
});
