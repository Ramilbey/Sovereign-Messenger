/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * OutboxService.ts — Queued Send While Disconnected
 *
 * Implements SUX-6 and ST-38: a message composed while disconnected is queued,
 * shown in a pending state, and sent automatically on reconnection IN ORIGINAL
 * ORDER (EDGE-11). The user can cancel a queued message.
 *
 * Scope boundary: this is an interface-level outbox. It does not alter Matrix
 * protocol behaviour, does not change how messages are transmitted, and does
 * not touch the bridge or the client lifecycle (PRD 6.1). It decides only
 * WHEN to hand a message to the existing send path.
 */

import { ConnectionStateService, type ConnectionState } from "./ConnectionStateService";

export type QueuedMessageState = "queued" | "sending" | "failed";

export interface QueuedMessage {
    /** Local identifier — not a Matrix event id. */
    id: string;
    conversationId: string;
    content: string;
    state: QueuedMessageState;
    /** Ordering key: queue order is preserved on flush (EDGE-11). */
    sequence: number;
}

/** Performs the actual send. Supplied by the caller so this service stays transport-agnostic. */
export type SendHandler = (conversationId: string, content: string) => Promise<unknown>;

export type OutboxListener = (messages: QueuedMessage[]) => void;

export class OutboxService {
    private static instance: OutboxService | null = null;

    private queue: QueuedMessage[] = [];
    private listeners = new Set<OutboxListener>();
    private sequenceCounter = 0;
    private flushing = false;
    private connection: ConnectionState = "connected";
    private subscribed = false;

    private constructor() {}

    public static getInstance(): OutboxService {
        if (!OutboxService.instance) {
            OutboxService.instance = new OutboxService();
        }
        return OutboxService.instance;
    }

    /** Begin observing connection state so the queue can flush on recovery. */
    public start(send: SendHandler): void {
        this.sendHandler = send;
        if (this.subscribed) return;
        this.subscribed = true;

        ConnectionStateService.getInstance().subscribe((state) => {
            const wasOffline = !this.isOnline(this.connection);
            this.connection = state;
            // ST-38: flush automatically once the connection returns.
            if (wasOffline && this.isOnline(state)) {
                void this.flush();
            }
        });
    }

    private sendHandler: SendHandler | null = null;

    private isOnline(state: ConnectionState): boolean {
        return state === "connected" || state === "restored";
    }

    /**
     * Send a message, or queue it when disconnected.
     * Returns true when the message was queued rather than sent immediately.
     */
    public async submit(conversationId: string, content: string): Promise<boolean> {
        if (this.isOnline(this.connection)) {
            if (!this.sendHandler) return false;
            await this.sendHandler(conversationId, content);
            return false;
        }

        this.enqueue(conversationId, content);
        return true;
    }

    private enqueue(conversationId: string, content: string): void {
        this.queue.push({
            id: `outbox_${Date.now()}_${this.sequenceCounter}`,
            conversationId,
            content,
            state: "queued",
            sequence: this.sequenceCounter++,
        });
        this.emit();
    }

    /** SUX-6: the user can cancel a queued message. */
    public cancel(id: string): void {
        const before = this.queue.length;
        this.queue = this.queue.filter((m) => m.id !== id);
        if (this.queue.length !== before) {
            this.emit();
        }
    }

    /** Queued messages for a conversation, in submission order. */
    public getQueued(conversationId: string): QueuedMessage[] {
        return this.queue
            .filter((m) => m.conversationId === conversationId)
            .sort((a, b) => a.sequence - b.sequence);
    }

    public subscribe(listener: OutboxListener): () => void {
        this.listeners.add(listener);
        listener([...this.queue]);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Send everything queued, oldest first (EDGE-11). A failure stops the flush
     * so ordering is never broken by sending a later message before an earlier
     * one; the remainder stays queued for the next recovery.
     */
    private async flush(): Promise<void> {
        if (this.flushing || !this.sendHandler) return;
        this.flushing = true;

        try {
            const ordered = [...this.queue].sort((a, b) => a.sequence - b.sequence);

            for (const message of ordered) {
                // The user may have cancelled it while the flush was in progress.
                if (!this.queue.some((m) => m.id === message.id)) continue;

                this.setState(message.id, "sending");

                try {
                    await this.sendHandler(message.conversationId, message.content);
                    this.queue = this.queue.filter((m) => m.id !== message.id);
                    this.emit();
                } catch {
                    // ERR-1: leave it visible and failed; preserve ordering by
                    // not attempting later messages in this pass.
                    this.setState(message.id, "failed");
                    break;
                }
            }
        } finally {
            this.flushing = false;
        }
    }

    private setState(id: string, state: QueuedMessageState): void {
        const message = this.queue.find((m) => m.id === id);
        if (!message || message.state === state) return;
        message.state = state;
        this.emit();
    }

    private emit(): void {
        const snapshot = [...this.queue];
        this.listeners.forEach((l) => {
            try {
                l(snapshot);
            } catch {
                // A failing subscriber must not stop the others.
            }
        });
    }
}
