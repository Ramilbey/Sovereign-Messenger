/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * MessageAttachment.tsx — CMP-34 File Card / CMP-35 Image Preview
 *
 * FR-26: images are presented as inline previews; other files as document
 * cards showing filename, size, type, sender, and time.
 * FR-27: any file the reader can see can be downloaded, and an image can be
 * opened at full size.
 * EDGE-4: an inline preview is bounded in display size and requests a
 * thumbnail, so a large photograph does not arrive in full to be shrunk.
 * EDGE-8: a file that no longer exists keeps its name and states that it is
 * unavailable, with download disabled and the reason given.
 */

import React, { memo, useState, type JSX } from "react";

import { Icon } from "../ui";
import { ImageViewer } from "./ImageViewer";
import { FILE_COPY, formatBytes } from "../../config/fileCopy";
import { MatrixFileService } from "../../services/MatrixFileService";
import type { MessageAttachment as Attachment } from "../../types/attachment";

interface Props {
    attachment: Attachment;
    /** GW-7: issuing context, shown on documents in official channels. */
    senderName?: string;
    timestamp?: string;
}

/** EDGE-4: the bound an inline preview is requested and displayed at. */
const THUMBNAIL = { width: 480, height: 360 };

export const MessageAttachment = memo(function MessageAttachment({
    attachment,
    senderName,
    timestamp,
}: Props): JSX.Element {
    const files = MatrixFileService.getInstance();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);

    const fullUrl = files.resolveUrl(attachment.contentUri);
    const thumbnailUrl = attachment.isImage ? files.resolveUrl(attachment.contentUri, THUMBNAIL) : null;

    /*
     * EDGE-8: the reference resolves to nothing — the file has been removed or
     * was never stored. The card persists with its original filename so the
     * reader can see what was sent, and download is not offered.
     */
    if (!fullUrl) {
        return (
            <div className="svr-file-card is-unavailable" role="note">
                <Icon name="document" size="md" className="svr-file-card__icon" />
                <span className="svr-file-card__text">
                    <span className="svr-file-card__name">{attachment.name}</span>
                    <span className="svr-file-card__meta">{FILE_COPY.unavailable}</span>
                    <span className="svr-file-card__meta">{FILE_COPY.unavailableReason}</span>
                </span>
            </div>
        );
    }

    // FR-26 / CMP-35: an image previews inline, bounded in size.
    if (attachment.isImage && !imageFailed) {
        return (
            <>
                <button
                    type="button"
                    className="svr-image-preview"
                    onClick={() => setViewerOpen(true)}
                    aria-label={`${FILE_COPY.openImage}: ${attachment.name}`}
                >
                    <img
                        className="svr-image-preview__image"
                        src={thumbnailUrl ?? fullUrl}
                        alt={attachment.name}
                        loading="lazy"
                        onError={() => setImageFailed(true)}
                    />
                </button>

                {/* FR-27 / EDGE-4: full resolution only on explicit open. */}
                {viewerOpen && (
                    <ImageViewer
                        src={fullUrl}
                        name={attachment.name}
                        onClose={() => setViewerOpen(false)}
                    />
                )}
            </>
        );
    }

    // FR-26 / CMP-34: everything else is a document card.
    return (
        <div className="svr-file-card">
            <Icon name={attachment.isImage ? "image" : "document"} size="md" className="svr-file-card__icon" />

            <span className="svr-file-card__text">
                <span className="svr-file-card__name" title={attachment.name}>
                    {attachment.name}
                </span>
                <span className="svr-file-card__meta">
                    {/* FR-26 / GW-7: size, type, and issuing context. */}
                    {[
                        attachment.size !== null ? formatBytes(attachment.size) : null,
                        attachment.mimeType,
                        senderName,
                        timestamp,
                    ]
                        .filter(Boolean)
                        .join(" · ")}
                </span>
                {imageFailed && <span className="svr-file-card__meta">{FILE_COPY.imageFailed}</span>}
            </span>

            {/* FR-27: any file the reader can see, they can download. */}
            <a
                className="svr-file-card__download"
                href={fullUrl}
                download={attachment.name}
                aria-label={`${FILE_COPY.download}: ${attachment.name}`}
            >
                <Icon name="download" size="sm" />
            </a>
        </div>
    );
});
