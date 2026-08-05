/*
 * Sovereign Messenger — Sprint 3 acceptance, live homeserver
 * files.test.ts — AC-5, AC-6, AC-7 (FR-23 … FR-30, ST-11 … ST-16)
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { login, startSync, waitFor, bind, type LiveUser } from "./liveHarness";
import { MatrixFileService } from "../../services/MatrixFileService";
import { MatrixTimelineService } from "../../services/MatrixTimelineService";
import { getFilePolicy } from "../../config/sovereignPolicy";
import { isPreviewableImage } from "../../types/attachment";

let sender: LiveUser;
let recipient: LiveUser;
let roomId: string;

/** A real PNG, so the server receives genuine image bytes. */
function pngFile(name: string, padBytes = 0): File {
    const base = Uint8Array.from(
        atob(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        ),
        (c) => c.charCodeAt(0),
    );
    const bytes = padBytes > 0 ? new Uint8Array(base.length + padBytes) : base;
    if (padBytes > 0) bytes.set(base, 0);
    return new File([bytes], name, { type: "image/png" });
}

beforeAll(async () => {
    sender = await login("aziz", "Passw0rd!aziz");
    recipient = await login("dilshod", "Passw0rd!dilshod");

    const created: any = await sender.client.createRoom({
        name: "Hujjat almashinuvi",
        invite: [recipient.userId],
    });
    roomId = created.room_id;

    await startSync(sender);
    await startSync(recipient);
    await recipient.client.joinRoom(roomId);
    await waitFor(
        () => recipient.client.getRoom(roomId)?.getMyMembership() === "join",
        20000,
        "the recipient to join",
    );
}, 120000);

afterAll(() => {
    sender?.client.stopClient();
    recipient?.client.stopClient();
});

describe("AC-7 / FR-28 / FR-29 — refused before upload begins", () => {
    it("refuses a file above the limit and states the limit", () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        const policy = getFilePolicy();
        const oversized = { name: "katta.pdf", size: policy.maxBytes + 1, type: "application/pdf" };

        const rejection = files.check(oversized);
        expect(rejection?.reason).toBe("too-large");
        // FR-28: the limit is carried with the refusal so it can be stated.
        expect(rejection?.limitBytes).toBe(policy.maxBytes);
    });

    it("refuses an unlisted type", () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        expect(files.check({ name: "run.exe", size: 1024, type: "application/x-msdownload" })?.reason).toBe(
            "unsupported-type",
        );
    });

    it("accepts a permitted document and a permitted image", () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        expect(files.check({ name: "bayonnoma.pdf", size: 2048, type: "application/pdf" })).toBeNull();
        expect(files.check({ name: "dalil.png", size: 2048, type: "image/png" })).toBeNull();
    });

    it("accepts a permitted extension when the browser reports no type", () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);
        // A browser reporting no MIME type must not block legitimate work.
        expect(files.check({ name: "hisobot.docx", size: 2048, type: "" })).toBeNull();
    });
});

describe("AC-5 / FR-25 — upload with progress, and cancellation", () => {
    it("uploads a real file to the homeserver and reports progress", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        const seen: number[] = [];
        const handle = files.upload(pngFile("dalil.png"), (f) => seen.push(f));
        const contentUri = await handle.promise;

        // The file genuinely reaches the homeserver's media repository.
        expect(contentUri).toMatch(/^mxc:\/\//);

        /*
         * FR-25: progress is reported per chunk. The platform wires this to
         * the browser upload's progress event, which has no equivalent under
         * Node's fetch — so the count is asserted in the browser check
         * (progress.test.tsx), and what is verified here is that a real
         * transfer completes and every reported fraction is well-formed.
         */
        seen.forEach((fraction) => {
            expect(fraction).toBeGreaterThanOrEqual(0);
            expect(fraction).toBeLessThanOrEqual(1);
        });
        console.log(`      [AC-5] uploaded to ${contentUri} (${seen.length} progress reports under Node)`);
    });

    it("cancels an in-flight transfer without reporting it as a failure", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        // A payload large enough that cancelling lands mid-transfer.
        const handle = files.upload(pngFile("katta-dalil.png", 4 * 1024 * 1024), () => undefined);
        handle.cancel();

        // ST-13: cancelled is terminal and resolves null — not a rejection to
        // report back to the user as an error (ERR-2).
        await expect(handle.promise).resolves.toBeNull();
    });
});

describe("AC-6 / FR-26 / FR-27 — the recipient receives and can download", () => {
    it("delivers an image as an inline preview and a document as a card", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        const imageUri = await files.upload(pngFile("dalil.png"), () => undefined).promise;
        await files.sendAttachment(roomId, {
            contentUri: imageUri!,
            name: "dalil.png",
            size: 128,
            mimeType: "image/png",
            isImage: true,
        });

        const docUri = await files.upload(
            new File([new Uint8Array(512)], "bayonnoma.pdf", { type: "application/pdf" }),
            () => undefined,
        ).promise;
        await files.sendAttachment(roomId, {
            contentUri: docUri!,
            name: "bayonnoma.pdf",
            size: 512,
            mimeType: "application/pdf",
            isImage: false,
        });

        const timeline = MatrixTimelineService.getInstance();
        bind(timeline, recipient);

        await waitFor(
            () => timeline.getTimeline(roomId).filter((m) => m.attachment).length >= 2,
            25000,
            "both attachments to reach the recipient",
        );

        const received = timeline.getTimeline(roomId).filter((m) => m.attachment);
        const image = received.find((m) => m.attachment?.name === "dalil.png");
        const document = received.find((m) => m.attachment?.name === "bayonnoma.pdf");

        // FR-26: an image previews inline; anything else is a document card.
        expect(image?.attachment?.isImage).toBe(true);
        expect(document?.attachment?.isImage).toBe(false);
        expect(document?.attachment?.mimeType).toBe("application/pdf");
        console.log(`      [AC-6] recipient received ${received.length} attachments`);
    });

    it("resolves a downloadable address the recipient can actually fetch", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, recipient);

        const timeline = MatrixTimelineService.getInstance();
        bind(timeline, recipient);

        const withFile = timeline.getTimeline(roomId).find((m) => m.attachment?.name === "bayonnoma.pdf");
        const url = files.resolveUrl(withFile!.attachment!.contentUri);
        expect(url).toBeTruthy();

        // FR-27: the address is real — fetched with the recipient's own
        // credentials, as the browser would.
        const response = await fetch(url!, {
            headers: { Authorization: `Bearer ${recipient.client.getAccessToken()}` },
        });
        expect(response.ok).toBe(true);
        console.log(`      [FR-27] download responded ${response.status}`);
    });

    it("reports null for an unresolvable reference rather than a broken link", () => {
        const files = MatrixFileService.getInstance();
        bind(files, recipient);
        // EDGE-8: the card presents the unavailable state instead.
        expect(files.resolveUrl("")).toBeNull();
    });
});

describe("FR-26 — which types preview inline", () => {
    it("previews the image types and nothing else", () => {
        expect(isPreviewableImage("image/png")).toBe(true);
        expect(isPreviewableImage("image/jpeg")).toBe(true);
        expect(isPreviewableImage("application/pdf")).toBe(false);
        expect(isPreviewableImage("text/plain")).toBe(false);
    });
});
