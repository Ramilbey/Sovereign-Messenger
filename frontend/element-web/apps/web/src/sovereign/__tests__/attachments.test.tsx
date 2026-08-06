/*
 * Sovereign Messenger — Sprint 3, Milestone 4 acceptance
 * attachments.test.tsx — D-9 Part 2 rendered behaviour
 *
 * FR-23 … FR-30, EDGE-4, EDGE-8, EDGE-16, A11Y-1, A11Y-3, A11Y-5
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

import { AttachmentPreview } from "../components/chat/AttachmentPreview";
import { MessageAttachment } from "../components/chat/MessageAttachment";
import { DropZone } from "../components/chat/DropZone";
import { ImageViewer } from "../components/chat/ImageViewer";
import { MessageComposer } from "../components/chat/MessageComposer";
import { MatrixFileService } from "../services/MatrixFileService";
import { FILE_COPY, formatBytes } from "../config/fileCopy";
import { getFilePolicy } from "../config/sovereignPolicy";
import type { PendingAttachment } from "../types/attachment";

const pending = (over: Partial<PendingAttachment> = {}): PendingAttachment => ({
    id: "a1",
    name: "bayonnoma.pdf",
    size: 2048,
    mimeType: "application/pdf",
    state: "queued",
    progress: 0,
    ...over,
});

function stubMedia(url: string | null) {
    const service = MatrixFileService.getInstance();
    vi.spyOn(service, "resolveUrl").mockReturnValue(url);
}

beforeEach(() => {
    vi.restoreAllMocks();
});

describe("FR-24 — reviewing an attachment before sending", () => {
    it("states name, size, and lets it be removed", () => {
        const onRemove = vi.fn();
        render(
            <AttachmentPreview
                attachment={pending()}
                onRemove={onRemove}
                onCancel={() => undefined}
                onRetry={() => undefined}
            />,
        );

        expect(screen.getByText("bayonnoma.pdf")).toBeTruthy();
        expect(screen.getByText(/2 KB/)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: /Olib tashlash/ }));
        expect(onRemove).toHaveBeenCalledWith("a1");
    });
});

describe("FR-25 / ST-12 — progress and cancellation", () => {
    it("shows determinate progress readable by assistive technology", () => {
        render(
            <AttachmentPreview
                attachment={pending({ state: "uploading", progress: 0.42 })}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={() => undefined}
            />,
        );

        const bar = screen.getByRole("progressbar");
        expect((bar as HTMLProgressElement).value).toBeCloseTo(0.42);
        expect(screen.getByText(new RegExp(FILE_COPY.uploading))).toBeTruthy();
    });

    it("offers cancel while uploading, and not remove", () => {
        const onCancel = vi.fn();
        render(
            <AttachmentPreview
                attachment={pending({ state: "uploading", progress: 0.3 })}
                onRemove={() => undefined}
                onCancel={onCancel}
                onRetry={() => undefined}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Bekor qilish/ }));
        expect(onCancel).toHaveBeenCalledWith("a1");
        expect(screen.queryByRole("button", { name: /Olib tashlash/ })).toBeNull();
    });
});

describe("FR-30 / ST-14 — recovering from failure", () => {
    it("offers retry on a failed transfer", () => {
        const onRetry = vi.fn();
        render(
            <AttachmentPreview
                attachment={pending({ state: "failed" })}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={onRetry}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /Qayta urinish/ }));
        expect(onRetry).toHaveBeenCalledWith("a1");
    });

    it("does not offer retry for a file the policy refused", () => {
        render(
            <AttachmentPreview
                attachment={pending({ state: "failed", rejection: "too-large" })}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={() => undefined}
            />,
        );
        // The answer would not change, so a retry would be dishonest.
        expect(screen.queryByRole("button", { name: /Qayta urinish/ })).toBeNull();
    });
});

describe("FR-28 / FR-29 / SUX-11 — a refusal states the limit", () => {
    it("names the size limit when a file is too large", () => {
        render(
            <AttachmentPreview
                attachment={pending({ state: "failed", rejection: "too-large" })}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={() => undefined}
            />,
        );

        expect(screen.getByText(new RegExp(formatBytes(getFilePolicy().maxBytes)))).toBeTruthy();
    });

    it("names the permitted types when a type is refused", () => {
        render(
            <AttachmentPreview
                attachment={pending({ state: "failed", rejection: "unsupported-type" })}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={() => undefined}
            />,
        );
        expect(screen.getByText(/Ruxsat etilgan turlar/)).toBeTruthy();
    });

    it("keeps the refused attachment on screen so it can be removed", () => {
        render(
            <AttachmentPreview
                attachment={pending({ state: "failed", rejection: "too-large" })}
                onRemove={() => undefined}
                onCancel={() => undefined}
                onRetry={() => undefined}
            />,
        );
        // SUX-11: the refusal does not consume the user's selection.
        expect(screen.getByText("bayonnoma.pdf")).toBeTruthy();
        expect(screen.getByRole("button", { name: /Olib tashlash/ })).toBeTruthy();
    });
});

describe("FR-26 / FR-27 — attachments in the conversation", () => {
    it("presents a non-image as a document card with a download action", () => {
        stubMedia("http://hs/media/doc.pdf");
        render(
            <MessageAttachment
                attachment={{
                    contentUri: "mxc://gov/doc",
                    name: "buyruq.pdf",
                    size: 4096,
                    mimeType: "application/pdf",
                    isImage: false,
                }}
                senderName="Dilshod"
                timestamp="10:00"
            />,
        );

        expect(screen.getByText("buyruq.pdf")).toBeTruthy();
        // FR-26 / GW-7: size, type and issuing context.
        expect(screen.getByText(/4 KB.*application\/pdf.*Dilshod.*10:00/)).toBeTruthy();

        const download = screen.getByRole("link", { name: /Yuklab olish/ });
        expect(download.getAttribute("href")).toBe("http://hs/media/doc.pdf");
        expect(download.getAttribute("download")).toBe("buyruq.pdf");
    });

    it("presents an image inline and opens it full size on request", () => {
        stubMedia("http://hs/media/img.png");
        render(
            <MessageAttachment
                attachment={{
                    contentUri: "mxc://gov/img",
                    name: "dalil.png",
                    size: 1024,
                    mimeType: "image/png",
                    isImage: true,
                }}
            />,
        );

        const open = screen.getByRole("button", { name: /Rasmni to'liq ochish/ });
        expect(within(open).getByRole("img")).toBeTruthy();

        // FR-27 / EDGE-4: full resolution only on explicit open.
        fireEvent.click(open);
        expect(screen.getByRole("dialog", { name: "dalil.png" })).toBeTruthy();
    });

    it("falls back to a card when the image cannot be displayed", () => {
        stubMedia("http://hs/media/broken.png");
        render(
            <MessageAttachment
                attachment={{
                    contentUri: "mxc://gov/broken",
                    name: "buzuq.png",
                    size: 1024,
                    mimeType: "image/png",
                    isImage: true,
                }}
            />,
        );

        fireEvent.error(screen.getByRole("img"));
        expect(screen.getByText(FILE_COPY.imageFailed)).toBeTruthy();
    });
});

describe("EDGE-8 — a file that no longer exists", () => {
    it("keeps the filename, states it is unavailable, and offers no download", () => {
        stubMedia(null);
        render(
            <MessageAttachment
                attachment={{
                    contentUri: "",
                    name: "yo'qolgan.pdf",
                    size: 100,
                    mimeType: "application/pdf",
                    isImage: false,
                }}
            />,
        );

        expect(screen.getByText("yo'qolgan.pdf")).toBeTruthy();
        expect(screen.getByText(FILE_COPY.unavailable)).toBeTruthy();
        expect(screen.queryByRole("link")).toBeNull();
    });
});

describe("A11Y-3 — the image viewer is a proper dialog", () => {
    it("moves focus into it, closes on Escape, and restores focus", () => {
        const onClose = vi.fn();
        const opener = document.createElement("button");
        document.body.appendChild(opener);
        opener.focus();

        const { unmount } = render(
            <ImageViewer src="http://hs/i.png" name="dalil.png" onClose={onClose} />,
        );

        // Focus moved into the dialog.
        expect(document.activeElement).toBe(screen.getByRole("button", { name: FILE_COPY.closeViewer }));

        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalled();

        unmount();
        // Focus returned to whatever opened it.
        expect(document.activeElement).toBe(opener);
        opener.remove();
    });
});

describe("FR-23 — the three ways to attach a file", () => {
    it("accepts a drop onto the conversation", () => {
        const onFiles = vi.fn();
        const { container } = render(
            <DropZone onFiles={onFiles}>
                <p>suhbat</p>
            </DropZone>,
        );

        const zone = container.querySelector(".svr-drop-zone")!;
        const file = new File(["x"], "dalil.png", { type: "image/png" });

        fireEvent.dragEnter(zone, { dataTransfer: { types: ["Files"], files: [file] } });
        expect(screen.getByText(FILE_COPY.dropHere)).toBeTruthy();

        fireEvent.drop(zone, { dataTransfer: { types: ["Files"], files: [file] } });
        expect(onFiles).toHaveBeenCalledWith([file]);
    });

    it("does not offer a drop target where the user may not post", () => {
        const onFiles = vi.fn();
        const { container } = render(
            <DropZone onFiles={onFiles} disabled>
                <p>e'lonlar</p>
            </DropZone>,
        );

        const zone = container.querySelector(".svr-drop-zone")!;
        const file = new File(["x"], "dalil.png", { type: "image/png" });

        fireEvent.dragEnter(zone, { dataTransfer: { types: ["Files"], files: [file] } });
        expect(screen.queryByText(FILE_COPY.dropHere)).toBeNull();

        fireEvent.drop(zone, { dataTransfer: { types: ["Files"], files: [file] } });
        expect(onFiles).not.toHaveBeenCalled();
    });

    it("offers a keyboard-reachable picker beside the composer", () => {
        const onFiles = vi.fn();
        render(<MessageComposer onSendMessage={() => undefined} onFiles={onFiles} conversationId="!g:gov" />);

        const attach = screen.getByRole("button", { name: FILE_COPY.attach });
        expect(attach.tagName).toBe("BUTTON");
    });

    it("accepts a pasted file", () => {
        const onFiles = vi.fn();
        render(<MessageComposer onSendMessage={() => undefined} onFiles={onFiles} conversationId="!g:gov" />);

        const file = new File(["x"], "screenshot.png", { type: "image/png" });
        fireEvent.paste(screen.getByRole("textbox"), { clipboardData: { files: [file] } });

        expect(onFiles).toHaveBeenCalledWith([file]);
    });

    it("allows sending an attachment with no caption", () => {
        const onSendMessage = vi.fn();
        render(
            <MessageComposer
                onSendMessage={onSendMessage}
                onFiles={() => undefined}
                hasAttachments
                conversationId="!g:gov"
            />,
        );

        const send = screen.getByRole("button", { name: /Yuborish/ });
        expect((send as HTMLButtonElement).disabled).toBe(false);
        fireEvent.click(send);
        expect(onSendMessage).toHaveBeenCalled();
    });
});
