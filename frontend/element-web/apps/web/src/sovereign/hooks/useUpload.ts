/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * useUpload.ts — Attachment Selection and Transfer
 *
 * FR-23 … FR-25, FR-28 … FR-30, ST-11 … ST-16.
 *
 * Holds the pending attachments for one conversation and drives their state
 * through Appendix D.3. Per Blueprint §8 it consumes a service and never
 * reads the platform SDK.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { MatrixFileService } from "../services/MatrixFileService";
import { isPreviewableImage, type PendingAttachment } from "../types/attachment";

let sequence = 0;
const nextId = (): string => `att_${Date.now()}_${sequence++}`;

export interface UploadApi {
    attachments: PendingAttachment[];
    /** FR-23: from a picker, a drop, or a paste — all arrive here. */
    add: (files: File[]) => void;
    /** FR-24 / ST-11: removing a queued attachment costs nothing. */
    remove: (id: string) => void;
    /** FR-25 / ST-12: cancels an in-flight transfer. */
    cancel: (id: string) => void;
    /** FR-30: retries a failed transfer without re-selecting the file. */
    retry: (id: string) => void;
    /** Transfers everything queued and returns what completed. */
    uploadAll: () => Promise<PendingAttachment[]>;
    clear: () => void;
}

export function useUpload(): UploadApi {
    const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
    const service = MatrixFileService.getInstance();

    /*
     * FR-30: the file itself is kept, so a retry does not ask the user to
     * find it again. Held outside React state because a File is not
     * serialisable and never needs to trigger a render on its own.
     */
    const files = useRef<Map<string, File>>(new Map());
    const cancels = useRef<Map<string, () => void>>(new Map());

    // EDGE-4: an object URL is a document-lifetime resource; releasing them on
    // unmount keeps a long shift from accumulating them (PERF-9).
    useEffect(() => {
        const urls = attachments.map((a) => a.previewUrl).filter(Boolean) as string[];
        return () => urls.forEach((url) => URL.revokeObjectURL(url));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const patch = useCallback((id: string, change: Partial<PendingAttachment>) => {
        setAttachments((current) =>
            current.map((a) => (a.id === id ? { ...a, ...change } : a)),
        );
    }, []);

    const add = useCallback(
        (incoming: File[]) => {
            const added = incoming.map((file): PendingAttachment => {
                const id = nextId();
                files.current.set(id, file);

                // FR-28 / FR-29 / SUX-11: checked before any transfer begins,
                // so a refusal costs nothing and states the limit.
                const rejection = service.check(file);

                return {
                    id,
                    name: file.name,
                    size: file.size,
                    mimeType: file.type || "application/octet-stream",
                    state: rejection ? "failed" : "queued",
                    progress: 0,
                    rejection: rejection?.reason,
                    // CMP-35: an image is previewed before it is sent, so the
                    // sender can see what they are about to send.
                    previewUrl:
                        !rejection && isPreviewableImage(file.type)
                            ? URL.createObjectURL(file)
                            : undefined,
                };
            });

            setAttachments((current) => [...current, ...added]);
        },
        [service],
    );

    const remove = useCallback((id: string) => {
        cancels.current.get(id)?.();
        cancels.current.delete(id);

        setAttachments((current) => {
            const going = current.find((a) => a.id === id);
            if (going?.previewUrl) URL.revokeObjectURL(going.previewUrl);
            return current.filter((a) => a.id !== id);
        });

        files.current.delete(id);
    }, []);

    const cancel = useCallback(
        (id: string) => {
            cancels.current.get(id)?.();
            cancels.current.delete(id);
            // ST-13: cancelled is terminal — the file is not sent.
            patch(id, { state: "cancelled", progress: 0 });
        },
        [patch],
    );

    const transfer = useCallback(
        async (attachment: PendingAttachment): Promise<PendingAttachment> => {
            const file = files.current.get(attachment.id);
            if (!file) return { ...attachment, state: "failed" };

            patch(attachment.id, { state: "uploading", progress: 0, rejection: undefined });

            const handle = service.upload(file, (fraction) =>
                patch(attachment.id, { progress: fraction }),
            );
            cancels.current.set(attachment.id, handle.cancel);

            try {
                const contentUri = await handle.promise;

                if (contentUri === null) {
                    // ST-13: the user cancelled; not a failure to report.
                    patch(attachment.id, { state: "cancelled", progress: 0 });
                    return { ...attachment, state: "cancelled" };
                }

                // ST-15: completion carries the attachment into a message.
                patch(attachment.id, { state: "completed", progress: 1, contentUri });
                return { ...attachment, state: "completed", progress: 1, contentUri };
            } catch (error: unknown) {
                // ST-14 / ERR-2: failure is recoverable without re-selection.
                const detail = error instanceof Error ? error.message : String(error);
                console.warn(`[useUpload] Transfer failed for ${attachment.name}:`, detail);
                patch(attachment.id, { state: "failed", progress: 0 });
                return { ...attachment, state: "failed" };
            } finally {
                cancels.current.delete(attachment.id);
            }
        },
        [patch, service],
    );

    const retry = useCallback(
        (id: string) => {
            const attachment = attachments.find((a) => a.id === id);
            // A file refused by policy is not retried: the answer would be the
            // same, and offering a retry that cannot succeed is dishonest.
            if (!attachment || attachment.rejection) return;
            void transfer(attachment);
        },
        [attachments, transfer],
    );

    const uploadAll = useCallback(async (): Promise<PendingAttachment[]> => {
        const pending = attachments.filter((a) => a.state === "queued" || a.state === "failed");
        if (pending.length === 0) return [];

        // ST-16: concurrent transfers keep independent state, so one failing
        // does not disturb the others.
        const settled = await Promise.all(pending.map((a) => transfer(a)));
        return settled.filter((a) => a.state === "completed");
    }, [attachments, transfer]);

    const clear = useCallback(() => {
        attachments.forEach((a) => {
            cancels.current.get(a.id)?.();
            if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
        });
        cancels.current.clear();
        files.current.clear();
        setAttachments([]);
    }, [attachments]);

    return { attachments, add, remove, cancel, retry, uploadAll, clear };
}
