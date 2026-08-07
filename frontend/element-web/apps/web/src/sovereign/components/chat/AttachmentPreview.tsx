/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * AttachmentPreview.tsx — CMP-32 / CMP-33 Pre-send Attachment
 *
 * FR-24: before sending, the user sees each attachment's name, size, and type,
 * and can remove any of them.
 * FR-25 / ST-12: an in-flight transfer shows determinate progress and can be
 * cancelled.
 * FR-30 / ST-14: a failed transfer offers retry without re-selecting the file.
 * FR-28 / FR-29 / SUX-11: a refused file states the reason and the limit, and
 * does not consume the user's selection — it stays visible to be removed.
 *
 * A11Y-5: every state carries text, never colour alone. The progress bar is a
 * native progress element, so assistive technology reads the value.
 */

import React, { memo, type JSX } from "react";

import { Icon, IconButton } from "../ui";
import { FILE_COPY, formatBytes } from "../../config/fileCopy";
import { getFilePolicy } from "../../config/sovereignPolicy";
import type { PendingAttachment } from "../../types/attachment";

interface Props {
    attachment: PendingAttachment;
    onRemove: (id: string) => void;
    onCancel: (id: string) => void;
    onRetry: (id: string) => void;
    /** A11Y-8: records the sender's description of an image. */
    onDescribe: (id: string, description: string) => void;
}

function stateLabel(attachment: PendingAttachment): string {
    if (attachment.rejection === "too-large") {
        return FILE_COPY.tooLarge(formatBytes(getFilePolicy().maxBytes));
    }
    if (attachment.rejection === "unsupported-type") {
        return FILE_COPY.unsupportedType(getFilePolicy().allowedExtensions.join(", "));
    }

    switch (attachment.state) {
        case "queued":
            return FILE_COPY.queued;
        case "uploading":
            return FILE_COPY.uploading;
        case "cancelled":
            return FILE_COPY.cancelled;
        case "completed":
            return FILE_COPY.completed;
        case "failed":
            return FILE_COPY.downloadFailed;
        default:
            return "";
    }
}

export const AttachmentPreview = memo(function AttachmentPreview({
    attachment,
    onRemove,
    onCancel,
    onRetry,
    onDescribe,
}: Props): JSX.Element {
    const isRejected = Boolean(attachment.rejection);
    const isUploading = attachment.state === "uploading";
    // FR-30: retry is offered for a transfer that failed, never for a file the
    // policy refused — that answer would not change.
    const canRetry = !isRejected && (attachment.state === "failed" || attachment.state === "cancelled");

    return (
        <li className={`svr-attachment${isRejected || attachment.state === "failed" ? " is-failed" : ""}`}>
            {/* CMP-35: an image is shown before it is sent, so the sender can
                see what they are about to send. */}
            {attachment.previewUrl ? (
                <img className="svr-attachment__thumb" src={attachment.previewUrl} alt="" />
            ) : (
                <span className="svr-attachment__thumb svr-attachment__thumb--file" aria-hidden="true">
                    <Icon name="document" size="md" />
                </span>
            )}

            <span className="svr-attachment__text">
                <span className="svr-attachment__name" title={attachment.name}>
                    {attachment.name}
                </span>
                <span className="svr-attachment__meta">
                    {/* FR-24: name, size, and type, stated exactly. */}
                    {formatBytes(attachment.size)} · {stateLabel(attachment)}
                </span>

                {/*
                 * A11Y-8: the sender describes the image they are sending. A
                 * filename is not a text alternative — "IMG_2043.jpg" tells a
                 * reader using a screen reader nothing about what it shows.
                 */}
                {attachment.previewUrl && !isRejected && (
                    <input
                        type="text"
                        className="svr-attachment__description"
                        value={attachment.description ?? ""}
                        placeholder={FILE_COPY.describePlaceholder}
                        aria-label={`${FILE_COPY.describeLabel}: ${attachment.name}`}
                        onChange={(event) => onDescribe(attachment.id, event.target.value)}
                    />
                )}

                {/* FR-25: determinate progress, readable by assistive technology. */}
                {isUploading && (
                    <progress
                        className="svr-attachment__progress"
                        value={attachment.progress}
                        max={1}
                        aria-label={`${attachment.name} — ${FILE_COPY.uploading}`}
                    />
                )}
            </span>

            <span className="svr-attachment__actions">
                {isUploading && (
                    <IconButton
                        icon="close"
                        label={`${FILE_COPY.cancel}: ${attachment.name}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(attachment.id)}
                    />
                )}

                {canRetry && (
                    <IconButton
                        icon="refresh"
                        label={`${FILE_COPY.retry}: ${attachment.name}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(attachment.id)}
                    />
                )}

                {/* ST-11: removing a queued or refused attachment costs nothing. */}
                {!isUploading && (
                    <IconButton
                        icon="close"
                        label={`${FILE_COPY.remove}: ${attachment.name}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(attachment.id)}
                    />
                )}
            </span>
        </li>
    );
});
