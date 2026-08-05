/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * attachment.ts — Attachment Model
 *
 * FR-23 … FR-31, ST-11 … ST-16, CMP-32 … CMP-37.
 */

/** Appendix D.3: Idle → Queued → Uploading → Completed | Cancelled | Failed. */
export type UploadState = "queued" | "uploading" | "completed" | "cancelled" | "failed";

/** Why an attachment was refused before it was ever transferred. */
export type RejectionReason = "too-large" | "unsupported-type";

/** FR-24: what the user sees about an attachment before sending it. */
export interface PendingAttachment {
    /** Local identifier. Never a Matrix media id. */
    id: string;
    name: string;
    /** Size in bytes, so the surface can state it exactly (FR-24). */
    size: number;
    mimeType: string;
    state: UploadState;
    /** FR-25: 0–1, determinate while uploading. */
    progress: number;
    /** FR-28 / FR-29: why it was refused, where it was. */
    rejection?: RejectionReason;
    /** Set once the transfer completes. */
    contentUri?: string;
    /** CMP-35: an object URL for previewing an image before it is sent. */
    previewUrl?: string;
}

/** FR-26: an attachment as it appears in a conversation. */
export interface MessageAttachment {
    /** The platform's media reference. */
    contentUri: string;
    name: string;
    size: number | null;
    mimeType: string;
    /** FR-26: images are previewed inline; everything else is a document card. */
    isImage: boolean;
    width?: number;
    height?: number;
}

/** FR-26: whether a type is presented inline or as a document card. */
export function isPreviewableImage(mimeType: string): boolean {
    return /^image\/(jpeg|png|gif|webp)$/.test(mimeType);
}
