/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * MatrixTypingService.ts — Typing Notification Send and Observe
 *
 * Implements D-6 (FR-6 … FR-11, ST-1 … ST-5).
 *
 * The platform already carries typing notifications; this service sends the
 * user's own and observes everyone else's. It changes no protocol behaviour
 * and starts no synchronisation of its own (PRD §6.1).
 */

import { RoomMemberEvent } from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";

export type TypingListener = () => void;

/**
 * FR-8 / ST-4: how long the platform should consider the user to still be
 * typing after the last keystroke. Comfortably inside the 5s the requirement
 * allows for the indicator to clear.
 */
const TYPING_TIMEOUT_MS = 4000;

/**
 * How long to wait before repeating the "still typing" notification. Sending
 * one per keystroke would put a request on the wire for every character.
 */
const RESEND_AFTER_MS = 2000;

export class MatrixTypingService {
    private static instance: MatrixTypingService | null = null;

    private clientService: MatrixClientService;
    private listeners = new Set<TypingListener>();
    private detach: (() => void) | null = null;
    /** When we last told the platform this user is typing, per conversation. */
    private lastSentAt = new Map<string, number>();

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    public static getInstance(): MatrixTypingService {
        if (!MatrixTypingService.instance) {
            MatrixTypingService.instance = new MatrixTypingService();
        }
        return MatrixTypingService.instance;
    }

    /**
     * FR-7: who is composing in a conversation, excluding the reader
     * themselves — a user does not need to be told that they are typing.
     */
    public getTypingNames(roomId: string): string[] {
        const client = this.clientService.getClient();
        if (!client || !roomId) return [];

        try {
            const room: any = client.getRoom(roomId);
            const me = client.getUserId();
            if (!room || typeof room.getMembers !== "function") return [];

            return room
                .getMembers()
                .filter((member: any) => member?.typing === true && member?.userId !== me)
                .map((member: any) => member?.name || member?.userId || "")
                .filter((name: string) => name !== "")
                .sort((a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixTypingService] Error reading typing state for ${roomId}:`, detail);
            return [];
        }
    }

    /**
     * FR-10: communicate this user's own typing activity.
     *
     * FR-11 / ST-5: the caller must not report typing in a conversation where
     * the user may not post. Announcing composition in a channel one cannot
     * post to would tell a department that an employee is drafting a directive
     * they are not permitted to send.
     */
    public async setTyping(roomId: string, isTyping: boolean): Promise<void> {
        const client = this.clientService.getClient();
        if (!client || !roomId) return;

        const now = Date.now();

        if (isTyping) {
            const last = this.lastSentAt.get(roomId) ?? 0;
            if (now - last < RESEND_AFTER_MS) return;
            this.lastSentAt.set(roomId, now);
        } else {
            // ST-3: stopping is reported immediately, on send or on clearing.
            if (!this.lastSentAt.has(roomId)) return;
            this.lastSentAt.delete(roomId);
        }

        try {
            await client.sendTyping(roomId, isTyping, TYPING_TIMEOUT_MS);
        } catch (error: unknown) {
            // A failed typing notification is never worth interrupting the
            // user for; composition continues regardless.
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixTypingService] Unable to send typing state for ${roomId}:`, detail);
        }
    }

    public subscribe(listener: TypingListener): () => void {
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
                    console.warn("[MatrixTypingService] Error in typing subscriber:", detail);
                }
            });
        };

        try {
            client.on(RoomMemberEvent.Typing, notify);
        } catch {
            return;
        }

        this.detach = () => {
            try {
                client.removeListener(RoomMemberEvent.Typing, notify);
            } catch {
                // The listener goes out of scope with the client.
            }
        };
    }
}
