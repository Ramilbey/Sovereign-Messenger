/*
 * Sovereign Messenger — Sprint 1, Step 9
 * SuspectsView.tsx — Workspace view for Tergov Suspects module (Gumonlanuvchilar).
 * TOK-13 / AC-16: institutional iconography, never an emoji.
 * Backed by useSuspects() hook.
 */

import React, { memo, type JSX } from "react";
import { useSuspects } from "../../providers/useSovereignData";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import { Icon } from "../ui";
import "./ModuleViews.css";

export const SuspectsView = memo(function SuspectsView(): JSX.Element {
    const { data: suspects, state } = useSuspects();

    return (
        <div id="module-view-suspects" className="svr-module-view-root">
            <div className="svr-module-header">
                <Icon name="person" size="md" className="svr-module-header-icon" />
                <span className="svr-module-header-title">Gumonlanuvchilar</span>
                {state === "ready" && (<span className="svr-module-header-count">{suspects.length} ta shaxs</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="suspects">
                <div className="svr-inv-list">
                    {suspects.map((s) => (
                        <div key={s.id} className="svr-inv-card">
                            <div className="svr-inv-card-row">
                                <div>
                                    <div className="svr-inv-card-title">{s.fullName}</div>
                                    <div className="svr-inv-card-meta">
                                        Ish: <span className="svr-inv-card-accent">#{s.caseNumber}</span>{" "}
                                        • Tug'ilgan yil: {s.birthYear}
                                        <br />
                                        Manzil: {s.address}
                                        <br />
                                        Ayblov: {s.charge}
                                        <br />
                                        Tergovchi: {s.assignedInvestigator}
                                    </div>
                                </div>
                                <div className="svr-inv-card-badges">
                                    <span className={`svr-inv-badge ${s.status}`}>{s.statusLabel}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ModuleStateBoundary>
        </div>
    );
});
