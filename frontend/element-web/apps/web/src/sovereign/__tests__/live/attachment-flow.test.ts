/*
 * Sovereign Messenger — Sprint 3 acceptance, live homeserver
 * attachment-flow.test.ts — AC-5, AC-6 end to end through the UI path
 *
 * Exercises exactly what the composer does: policy check, transfer, send, and
 * the recipient's card and download — against a real server, two real users.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

import { login, startSync, waitFor, bind, type LiveUser } from "./liveHarness";
import { MatrixFileService } from "../../services/MatrixFileService";
import { MatrixTimelineService } from "../../services/MatrixTimelineService";
import { isPreviewableImage } from "../../types/attachment";
import { formatBytes } from "../../config/fileCopy";

let sender: LiveUser;
let recipient: LiveUser;
let roomId: string;

beforeAll(async () => {
    sender = await login("aziz", "Passw0rd!aziz");
    recipient = await login("dilshod", "Passw0rd!dilshod");

    const created: any = await sender.client.createRoom({
        name: "Hujjat oqimi",
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

describe("AC-5 / AC-6 — the full attachment journey", () => {
    it("carries a document from selection to the recipient's download", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        const file = new File([new Uint8Array(3072)], "tergov-bayonnomasi.pdf", {
            type: "application/pdf",
        });

        // 1. FR-28 / FR-29: policy is checked before any transfer.
        expect(files.check(file)).toBeNull();

        // 2. FR-25: the transfer runs and completes.
        const progress: number[] = [];
        const contentUri = await files.upload(file, (f) => progress.push(f)).promise;
        expect(contentUri).toMatch(/^mxc:\/\//);

        // 3. FR-23: the completed attachment becomes a message.
        const eventId = await files.sendAttachment(roomId, {
            contentUri: contentUri!,
            name: file.name,
            size: file.size,
            mimeType: file.type,
            isImage: isPreviewableImage(file.type),
        });
        expect(eventId).toBeTruthy();

        // 4. FR-26: the recipient receives it as a document card.
        const timeline = MatrixTimelineService.getInstance();
        bind(timeline, recipient);

        await waitFor(
            () =>
                timeline
                    .getTimeline(roomId)
                    .some((m) => m.attachment?.name === "tergov-bayonnomasi.pdf"),
            25000,
            "the document to reach the recipient",
        );

        const received = timeline
            .getTimeline(roomId)
            .find((m) => m.attachment?.name === "tergov-bayonnomasi.pdf")!;

        expect(received.attachment?.isImage).toBe(false);
        expect(received.attachment?.size).toBe(3072);
        // The card states a size a reader can judge.
        expect(formatBytes(received.attachment!.size!)).toBe("3 KB");

        // 5. FR-27: the recipient downloads it, with their own credentials.
        bind(files, recipient);
        const url = files.resolveUrl(received.attachment!.contentUri)!;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${recipient.client.getAccessToken()}` },
        });

        expect(response.ok).toBe(true);
        expect((await response.arrayBuffer()).byteLength).toBe(3072);
        console.log(`      [AC-6] recipient downloaded 3072 bytes, HTTP ${response.status}`);
    });

    it("delivers an image the recipient can preview and open full size", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        const png = Uint8Array.from(
            atob(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            ),
            (c) => c.charCodeAt(0),
        );
        const image = new File([png], "voqea-joyi.png", { type: "image/png" });

        const uri = await files.upload(image, () => undefined).promise;
        await files.sendAttachment(roomId, {
            contentUri: uri!,
            name: image.name,
            size: image.size,
            mimeType: image.type,
            isImage: true,
        });

        const timeline = MatrixTimelineService.getInstance();
        bind(timeline, recipient);

        await waitFor(
            () => timeline.getTimeline(roomId).some((m) => m.attachment?.name === "voqea-joyi.png"),
            25000,
            "the image to reach the recipient",
        );

        const received = timeline
            .getTimeline(roomId)
            .find((m) => m.attachment?.name === "voqea-joyi.png")!;
        expect(received.attachment?.isImage).toBe(true);

        // EDGE-4: the preview requests a bounded thumbnail; the full image is
        // a separate address, fetched only when explicitly opened.
        bind(files, recipient);
        const thumb = files.resolveUrl(received.attachment!.contentUri, { width: 480, height: 360 });
        const full = files.resolveUrl(received.attachment!.contentUri);

        expect(thumb).toContain("thumbnail");
        expect(full).toContain("download");
        expect(thumb).not.toBe(full);

        const fullResponse = await fetch(full!, {
            headers: { Authorization: `Bearer ${recipient.client.getAccessToken()}` },
        });
        expect(fullResponse.ok).toBe(true);
        console.log(`      [AC-6] image full-size fetch HTTP ${fullResponse.status}`);
    });

    it("refuses an oversized file before a byte reaches the server", async () => {
        const files = MatrixFileService.getInstance();
        bind(files, sender);

        const before = timelineLength();
        const rejection = files.check({
            name: "juda-katta.pdf",
            size: 999 * 1024 * 1024,
            type: "application/pdf",
        });

        expect(rejection?.reason).toBe("too-large");
        // AC-7: nothing was sent, so the conversation is unchanged.
        expect(timelineLength()).toBe(before);

        function timelineLength(): number {
            const timeline = MatrixTimelineService.getInstance();
            bind(timeline, sender);
            return timeline.getTimeline(roomId).length;
        }
    });
});
