/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * MatrixReceiptService.ts — Read Markers and Acknowledgement
 *
 * Implements D-8 (FR-18 … FR-21, GW-2, GW-3).
 *
 * Readiness Review R-2 warns that platform read receipts are per-user-latest
 * rather than per-message, and that this may not match what a government
 * department means by "who has read this directive".
 *
 * The semantic is therefore deployment policy, not an engineering assumption
 * (see config/sovereignPolicy.ts). Under the provisional `read-position`
 * setting a recipient has read a directive when their read position has
 * reached or passed it — which is precisely what the platform reports, and
 * the only reading that can be honoured without asking recipients to confirm
 * receipt explicitly. The summary states which reading produced it, so a
 * department head is never shown a number whose meaning is ambiguous.
 */

import { RoomEvent } from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";
import { getReceiptPolicy } from "../config/sovereignPolicy";
import type { AcknowledgementSummary, MessageReader } from "../types/receipt";

export type ReceiptListener = () => void;

export class MatrixReceiptService {
    private static instance: MatrixReceiptService | null = null;

    private clientService: MatrixClientService;
    private listeners = new Set<ReceiptListener>();
    private detach: (() => void) | null = null;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    public static getInstance(): MatrixReceiptService {
        if (!MatrixReceiptService.instance) {
            MatrixReceiptService.instance = new MatrixReceiptService();
        }
        return MatrixReceiptService.instance;
    }

    /**
     * FR-21: a message is marked read when it has become visible to a focused
     * window. The caller decides when that is true; this service records it.
     */
    public async markRead(roomId: string, eventId: string): Promise<void> {
        const client = this.clientService.getClient();
        if (!client || !roomId || !eventId) return;

        try {
            const room: any = client.getRoom(roomId);
            const event = room?.findEventById?.(eventId);
            if (!event) return;

            await client.sendReadReceipt(event);
        } catch (error: unknown) {
            // A receipt that fails to send is never worth interrupting a
            // reader for; it is retried the next time they read something.
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixReceiptService] Unable to send read receipt in ${roomId}:`, detail);
        }
    }

    /**
     * FR-18: whether a message the user sent has been read by anyone else.
     *
     * Used for the per-message state on a direct conversation or group, where
     * "read" means at least one other participant has reached it.
     */
    public hasBeenRead(roomId: string, eventId: string): boolean {
        return this.getReaders(roomId, eventId).length > 0;
    }

    /** Recipients whose read position has reached the message. */
    public getReaders(roomId: string, eventId: string): MessageReader[] {
        const client = this.clientService.getClient();
        if (!client || !roomId || !eventId) return [];

        try {
            const room: any = client.getRoom(roomId);
            const event = room?.findEventById?.(eventId);
            const me = client.getUserId();
            if (!room || !event) return [];

            const userIds: string[] = room.getUsersReadUpTo?.(event) ?? [];

            return userIds
                .filter((userId) => userId !== me)
                .map((userId) => {
                    const receipt = room.getReadReceiptForUserId?.(userId);
                    return {
                        userId,
                        displayName: room.getMember?.(userId)?.name || userId,
                        readAt: typeof receipt?.data?.ts === "number" ? receipt.data.ts : null,
                    };
                });
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixReceiptService] Error reading receipts in ${roomId}:`, detail);
            return [];
        }
    }

    /**
     * FR-19 / FR-20 / GW-2 / GW-3: who has read a directive and who has not.
     *
     * The pending list is what makes this useful to a department head: a count
     * of readers answers "how many", but only the names answer "who do I still
     * need to chase".
     */
    public getAcknowledgement(roomId: string, eventId: string, senderId: string): AcknowledgementSummary {
        const client = this.clientService.getClient();
        const empty: AcknowledgementSummary = { totalRecipients: 0, readers: [], pending: [] };

        if (!client || !roomId || !eventId) return empty;

        try {
            const room: any = client.getRoom(roomId);
            if (!room || typeof room.getMembers !== "function") return empty;

            // Recipients are the joined members other than the issuer: an
            // officer does not acknowledge their own directive, and someone
            // who has left the department is not still expected to read it.
            const recipients = room
                .getMembers()
                .filter((member: any) => member?.membership === "join" && member?.userId !== senderId)
                .map((member: any) => ({
                    userId: member.userId as string,
                    displayName: (member.name || member.userId) as string,
                }));

            const readers = this.getReaders(roomId, eventId);
            const readerIds = new Set(readers.map((reader) => reader.userId));

            return {
                totalRecipients: recipients.length,
                readers: readers.filter((reader) =>
                    recipients.some((r: { userId: string }) => r.userId === reader.userId),
                ),
                pending: recipients
                    .filter((r: { userId: string }) => !readerIds.has(r.userId))
                    .map((r: { userId: string; displayName: string }) => ({ ...r, readAt: null })),
            };
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixReceiptService] Error building acknowledgement for ${eventId}:`, detail);
            return empty;
        }
    }

    /** Which reading of "has read" produced a summary (R-2). */
    public getSemantic(): "read-position" | "explicit" {
        return getReceiptPolicy().acknowledgement;
    }

    public subscribe(listener: ReceiptListener): () => void {
        this.listeners.add(listener);
        this.attach();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.detach?.();
                this.detach = null;
            }
        };
    }

    private attach(): void {
        if (this.detach) return;

        const client = this.clientService.getClient();
        if (!client) return;

        const notify = (): void => {
            this.listeners.forEach((listener) => {
                try {
                    listener();
                } catch (error: unknown) {
                    const detail = error instanceof Error ? error.message : String(error);
                    console.warn("[MatrixReceiptService] Error in receipt subscriber:", detail);
                }
            });
        };

        try {
            client.on(RoomEvent.Receipt, notify);
        } catch {
            return;
        }

        this.detach = () => {
            try {
                client.removeListener(RoomEvent.Receipt, notify);
            } catch {
                // The listener goes out of scope with the client.
            }
        };
    }
}
