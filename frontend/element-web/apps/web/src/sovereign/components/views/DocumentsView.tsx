/*
 * Sovereign Messenger — Step 8
 * DocumentsView.tsx — Workspace view for Documents module.
 * TOK-13 / AC-16: institutional iconography, never an emoji.
 * Backed by useDocuments() hook.
 */

import React, { memo, type JSX } from "react";
import { useDocuments } from "../../providers/useSovereignData";
import { ModuleStateBoundary } from "./ModuleStateBoundary";
import { Icon, type IconName } from "../ui";
import "./ModuleViews.css";

/* TOK-13: the document kind is carried by an institutional icon, and by the
   file's own title beside it — never by an emoji. */
const DOC_ICONS: Record<string, IconName> = {
    pdf: "document",
    excel: "chart",
    word: "document",
};

export const DocumentsView = memo(function DocumentsView(): JSX.Element {
    const { data: documents, state } = useDocuments();

    return (
        <div id="module-view-documents" className="svr-module-view-root">
            <div className="svr-module-header">
                <Icon name="folder" size="md" className="svr-module-header-icon" />
                <span className="svr-module-header-title">Hujjatlar</span>
                {state === "ready" && (<span className="svr-module-header-count">{documents.length} ta hujjat</span>)}
            </div>

            <ModuleStateBoundary state={state} surface="documents">
                <div className="svr-documents-list">
                    {documents.map((doc) => (
                        <div key={doc.id} className="svr-document-card">
                            <div className="svr-document-info">
                                <span className="svr-document-icon">
                                    <Icon name={DOC_ICONS[doc.type] ?? "document"} size="md" />
                                </span>
                                <div>
                                    <div className="svr-document-title">{doc.title}</div>
                                    <div className="svr-document-meta">
                                        Yukladi: {doc.uploadedBy} • {doc.date}
                                    </div>
                                </div>
                            </div>
                            <div className="svr-document-size">{doc.fileSize}</div>
                        </div>
                    ))}
                </div>
            </ModuleStateBoundary>
        </div>
    );
});
