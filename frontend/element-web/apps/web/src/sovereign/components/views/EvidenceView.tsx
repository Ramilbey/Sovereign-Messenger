/*
 * Sovereign Messenger — Sprint 1, Step 9
 * EvidenceView.tsx — Workspace view for Tergov Evidence module (Dalillar).
 * TOK-13 / AC-16: institutional iconography, never an emoji.
 * Backed by useEvidence() hook.
 */

import React, { memo, type JSX } from "react";
import { useEvidence } from "../../providers/useSovereignData";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import { Icon, type IconName } from "../ui";
import "./ModuleViews.css";

/* TOK-13: the evidence kind is an institutional icon beside its own label. */
const TYPE_ICONS: Record<string, IconName> = {
    physical: "briefcase",
    digital: "image",
    document: "document",
};

export const EvidenceView = memo(function EvidenceView(): JSX.Element {
    const { data: evidence, state } = useEvidence();

    return (
        <div id="module-view-evidence" className="svr-module-view-root">
            <div className="svr-module-header">
                <Icon name="image" size="md" className="svr-module-header-icon" />
                <span className="svr-module-header-title">Dalillar</span>
                {state === "ready" && (<span className="svr-module-header-count">{evidence.length} ta dalil</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="evidence">
                <div className="svr-inv-list">
                    {evidence.map((e) => (
                        <div key={e.id} className="svr-inv-card">
                            <div className="svr-inv-card-row">
                                <div>
                                    <div className="svr-inv-card-title">
                                        <Icon name={TYPE_ICONS[e.type] ?? "image"} size="sm" />{" "}
                                        {e.description}
                                    </div>
                                    <div className="svr-inv-card-meta">
                                        Ish: <span className="svr-inv-card-accent">#{e.caseNumber}</span>{" "}
                                        • Tur: {e.typeLabel}
                                        <br />
                                        Yig'gan: {e.collectedBy} • Sana: {e.collectedDate}
                                        <br />
                                        Joylashuv: {e.storageLocation}
                                    </div>
                                </div>
                                <div className="svr-inv-card-badges">
                                    <span className={`svr-inv-badge ${e.status}`}>{e.statusLabel}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ModuleStateBoundary>
        </div>
    );
});
