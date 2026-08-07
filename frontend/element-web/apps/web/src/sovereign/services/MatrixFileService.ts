/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * MatrixFileService.ts — Upload, Progress, Cancel, Download
 *
 * Implements D-9 (FR-23 … FR-31, ST-11 … ST-16).
 *
 * A thin wrapper over the platform's own media APIs. The SDK already performs
 * the transfer, reports progress, and supports cancellation; this service adds
 * only what the product needs on top: policy enforcement before a byte is
 * sent, and the product's own vocabulary for the states in Appendix D.3.
 * It changes no protocol behaviour and touches no encryption (PRD §6.1).
 */

import { MatrixClientService } from "./MatrixClientService";
import { getFilePolicy, getMediaPolicy } from "../config/sovereignPolicy";
import type { MessageAttachment, RejectionReason } from "../types/attachment";

export interface UploadHandle {
    /** Resolves to the platform's media reference, or null if cancelled. */
    promise: Promise<string | null>;
    /** FR-25 / ST-12: stops an in-flight transfer. */
    cancel: () => void;
}

export interface PolicyRejection {
    reason: RejectionReason;
    /** FR-28: the applicable limit, so the message can state it. */
    limitBytes?: number;
}

export class MatrixFileService {
    private static instance: MatrixFileService | null = null;

    private clientService: MatrixClientService;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    public static getInstance(): MatrixFileService {
        if (!MatrixFileService.instance) {
            MatrixFileService.instance = new MatrixFileService();
        }
        return MatrixFileService.instance;
    }

    /**
     * FR-28 / FR-29 / SUX-11: whether the deployment permits this file.
     *
     * Checked BEFORE any transfer begins, so a refusal costs the user nothing
     * and the limit is communicated rather than discovered. Returns null when
     * the file is acceptable.
     */
    public check(file: { name: string; size: number; type: string }): PolicyRejection | null {
        const policy = getFilePolicy();

        if (file.size > policy.maxBytes) {
            return { reason: "too-large", limitBytes: policy.maxBytes };
        }

        /*
         * An allow-list, not a deny-list: a government deployment should
         * refuse an unrecognised type rather than admit it. An empty list
         * means the deployment has chosen to permit any type.
         */
        const hasTypeRules =
            policy.allowedMimeTypes.length > 0 || policy.allowedExtensions.length > 0;
        if (!hasTypeRules) return null;

        const extension = file.name.includes(".")
            ? file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase()
            : "";

        const mimeAllowed = policy.allowedMimeTypes.includes(file.type);
        const extensionAllowed = extension !== "" && policy.allowedExtensions.includes(extension);

        // Either signal suffices: a browser that reports no MIME type for a
        // permitted extension must not block legitimate work.
        return mimeAllowed || extensionAllowed ? null : { reason: "unsupported-type" };
    }

    /**
     * FR-25 / ST-12 / ST-16: transfers one file, reporting determinate
     * progress and remaining independently cancellable.
     *
     * PERF-11: the platform reports progress per chunk, which for a 25 MB file
     * over the internal network is well above the required twice per second.
     */
    public upload(file: File, onProgress: (fraction: number) => void): UploadHandle {
        const client = this.clientService.getClient();

        if (!client) {
            return {
                promise: Promise.reject(new Error("No authenticated client")),
                cancel: () => undefined,
            };
        }

        const controller = new AbortController();

        const promise = client
            .uploadContent(file, {
                name: file.name,
                type: file.type || "application/octet-stream",
                abortController: controller,
                progressHandler: ({ loaded, total }) => {
                    onProgress(total > 0 ? Math.min(loaded / total, 1) : 0);
                },
            })
            .then((response: { content_uri: string }) => response.content_uri)
            .catch((error: unknown) => {
                // ST-13: cancellation is a terminal state the user chose, not
                // a failure to report back to them (ERR-2).
                if (controller.signal.aborted) return null;
                throw error;
            });

        return { promise, cancel: () => controller.abort() };
    }

    /**
     * FR-27: an address the browser can fetch to download or display a file.
     *
     * Returns null where the reference cannot be resolved, so the surface
     * presents the unavailable state rather than a broken link (EDGE-8).
     */
    public resolveUrl(contentUri: string, thumbnail?: { width: number; height: number }): string | null {
        const client = this.clientService.getClient();
        if (!client || !contentUri) return null;

        /*
         * FR-27: the endpoint the deployment's homeserver actually serves.
         *
         * Authenticated media (MSC3916) is a newer endpoint than the pinned
         * server implements; requesting it there returns 404 for every
         * download. The SDK does not check server support and says so. The
         * choice is therefore deployment policy, defaulting to what the pinned
         * server serves.
         */
        const authenticated = getMediaPolicy().useAuthenticatedEndpoint;

        try {
            return thumbnail
                ? client.mxcUrlToHttp(
                      contentUri,
                      thumbnail.width,
                      thumbnail.height,
                      "scale",
                      false,
                      authenticated,
                      authenticated,
                  )
                : client.mxcUrlToHttp(
                      contentUri,
                      undefined,
                      undefined,
                      undefined,
                      false,
                      authenticated,
                      authenticated,
                  );
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixFileService] Unable to resolve media ${contentUri}:`, detail);
            return null;
        }
    }

    /**
     * FR-23: sends an already-uploaded file as a message.
     *
     * The message type follows the file: an image is sent as an image so it
     * previews inline for the recipient (FR-26), everything else as a file.
     */
    public async sendAttachment(
        roomId: string,
        attachment: MessageAttachment,
    ): Promise<string | null> {
        const client = this.clientService.getClient();
        if (!client || !roomId) return null;

        /*
         * A11Y-8: where the sender described the image, the description is the
         * body — which is what a reader hears — and the filename is carried
         * beside it, so nothing about the file is lost.
         */
        const described = attachment.description?.trim();

        const content = {
            msgtype: attachment.isImage ? "m.image" : "m.file",
            body: described || attachment.name,
            filename: attachment.name,
            url: attachment.contentUri,
            info: {
                mimetype: attachment.mimeType,
                size: attachment.size ?? undefined,
                w: attachment.width,
                h: attachment.height,
            },
        };

        const response: { event_id?: string } = await client.sendMessage(roomId, content as never);
        return response?.event_id ?? null;
    }
}
