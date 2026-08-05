/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * OutboxService.ts — Durable Outbox
 *
 * Implements SUX-6 and ST-38 by covering ONLY the gaps the Matrix SDK leaves.
 * It deliberately does not reimplement what the SDK already provides.
 *
 * WHAT THE SDK ALREADY DOES — and this service must not duplicate:
 *   - Per-room send queueing and ordering (MatrixScheduler.QUEUE_MESSAGES puts
 *     room messages on a single sequential queue, so order within a room is
 *     the SDK's responsibility).
 *   - Retry with exponential backoff for transient server errors
 *     (RETRY_BACKOFF_RATELIMIT, up to four attempts).
 *   - Local echo and pending-event display — the unsent message is already
 *     visible via Room.getPendingEvents(), which MatrixTimelineService merges
 *     into the timeline.
 *
 * WHAT THE SDK DOES NOT DO — the only reasons this service exists:
 *   1. It does not retry a ConnectionError at all. RETRY_BACKOFF_RATELIMIT
 *      calls calculateRetryBackoff with retryConnectionError = false, which
 *      returns -1 ("give up") for a connection failure. A message composed
 *      during a network drop is therefore abandoned by the SDK immediately.
 *      This service re-submits it when connectivity returns.
 *   2. Its pending queue is in-memory only. A reload loses unsent messages.
 *      This service records them durably and replays them at startup.
 *
 * Everything else is delegated. In particular this service performs no
 * transport work of its own: it hands the message to the caller-supplied send
 * function, which routes through the existing message service. It does not
 * touch the Matrix protocol, the SDK, the bridge, or the client lifecycle
 * (PRD section 6.1).
 */

import { ConnectionStateService, type ConnectionState } from "./ConnectionStateService";

export interface OutboxRecord {
    /** Local identifier — never a Matrix event id. */
    id: string;
    /**
     * The conversation this message belongs to.
     *
     * This is authoritative. A replay MUST send to this conversation and never
     * to whichever conversation happens to be open at replay time; delivering
     * official correspondence to the wrong room is a correctness and security
     * failure, not a cosmetic one.
     */
    conversationId: string;
    content: string;
    /** Ordering key so a replay preserves submission order. */
    sequence: number;
}

/**
 * Performs the actual send.
 *
 * The conversation id is a REQUIRED parameter and implementations must honour
 * it rather than closing over an ambient "active conversation".
 */
export type SendHandler = (conversationId: string, content: string) => Promise<unknown>;

export type OutboxListener = (records: OutboxRecord[]) => void;

const STORAGE_KEY = "sovereign_outbox";

export class OutboxService {
    private static instance: OutboxService | null = null;

    private records: OutboxRecord[] = [];
    private listeners = new Set<OutboxListener>();
    private sequenceCounter = 0;
    private replaying = false;
    private loaded = false;

    private sendHandler: SendHandler | null = null;
    private unsubscribeConnection: (() => void) | null = null;
    private lastConnection: ConnectionState = "connected";

    private constructor() {}

    public static getInstance(): OutboxService {
        if (!OutboxService.instance) {
            OutboxService.instance = new OutboxService();
        }
        return OutboxService.instance;
    }

    /**
     * Provide the send function and begin observing connectivity.
     *
     * Safe to call repeatedly: the handler is refreshed, the connection
     * subscription is established once, and any records left over from a
     * previous session are replayed.
     */
    public start(send: SendHandler): void {
        this.sendHandler = send;
        this.load();

        if (!this.unsubscribeConnection) {
            this.unsubscribeConnection = ConnectionStateService.getInstance().subscribe((state) => {
                const wasOffline = !this.isOnline(this.lastConnection);
                this.lastConnection = state;
                if (wasOffline && this.isOnline(state)) {
                    void this.replay();
                }
            });
        }

        // Gap 2: replay anything that survived a reload.
        if (this.isOnline(this.lastConnection)) {
            void this.replay();
        }
    }

    /** Release the connectivity subscription. Every registration has a matching cleanup. */
    public stop(): void {
        if (this.unsubscribeConnection) {
            this.unsubscribeConnection();
            this.unsubscribeConnection = null;
        }
        this.sendHandler = null;
    }

    private isOnline(state: ConnectionState): boolean {
        return state === "connected" || state === "restored";
    }

    /**
     * Submit a message.
     *
     * The message is recorded durably first, then handed straight to the SDK —
     * it is NOT withheld while offline. The SDK provides the local echo and the
     * per-room ordering; the record exists so the message can be re-sent if the
     * SDK abandons it or the page reloads.
     */
    public async submit(conversationId: string, content: string): Promise<void> {
        if (!conversationId || !content.trim()) return;

        const record = this.record(conversationId, content);

        if (!this.sendHandler) return;

        try {
            await this.sendHandler(conversationId, content);
            this.resolve(record.id);
        } catch {
            // Keep the record. It is replayed on reconnection or at next startup.
            // The unsent state is already visible through the SDK's pending event.
        }
    }

    private record(conversationId: string, content: string): OutboxRecord {
        this.load();
        const record: OutboxRecord = {
            id: `outbox_${Date.now()}_${this.sequenceCounter}`,
            conversationId,
            content,
            sequence: this.sequenceCounter++,
        };
        this.records.push(record);
        this.persist();
        this.emit();
        return record;
    }

    /** Remove a record once its send has been confirmed. */
    private resolve(id: string): void {
        const before = this.records.length;
        this.records = this.records.filter((r) => r.id !== id);
        if (this.records.length !== before) {
            this.persist();
            this.emit();
        }
    }

    /** SUX-6: the user can discard a message that has not been delivered. */
    public discard(id: string): void {
        this.resolve(id);
    }

    /** Undelivered records for a conversation, in submission order. */
    public getPending(conversationId: string): OutboxRecord[] {
        this.load();
        return this.records
            .filter((r) => r.conversationId === conversationId)
            .sort((a, b) => a.sequence - b.sequence);
    }

    public subscribe(listener: OutboxListener): () => void {
        this.load();
        this.listeners.add(listener);
        listener([...this.records]);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Re-submit undelivered records, oldest first.
     *
     * Sequential submission preserves the order in which the user wrote them;
     * ordering *within* a room beyond that point is the SDK's queue, not ours.
     * Each record is sent to its own recorded conversation.
     */
    private async replay(): Promise<void> {
        if (this.replaying || !this.sendHandler) return;
        this.load();
        if (this.records.length === 0) return;

        this.replaying = true;
        try {
            const ordered = [...this.records].sort((a, b) => a.sequence - b.sequence);

            for (const record of ordered) {
                // The user may have discarded it since the replay began.
                if (!this.records.some((r) => r.id === record.id)) continue;

                try {
                    // R1: always the record's own conversation.
                    await this.sendHandler(record.conversationId, record.content);
                    this.resolve(record.id);
                } catch {
                    // Stop this pass so a later message cannot overtake an
                    // earlier one; the rest waits for the next recovery.
                    break;
                }
            }
        } finally {
            this.replaying = false;
        }
    }

    private load(): void {
        if (this.loaded) return;
        this.loaded = true;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;

            for (const item of parsed) {
                if (
                    item &&
                    typeof item === "object" &&
                    typeof (item as OutboxRecord).id === "string" &&
                    typeof (item as OutboxRecord).conversationId === "string" &&
                    typeof (item as OutboxRecord).content === "string" &&
                    typeof (item as OutboxRecord).sequence === "number"
                ) {
                    const record = item as OutboxRecord;
                    this.records.push(record);
                    this.sequenceCounter = Math.max(this.sequenceCounter, record.sequence + 1);
                }
            }
        } catch {
            // A corrupt store must never prevent sending.
            this.records = [];
        }
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
        } catch {
            // Storage full or unavailable (ERR-6): records remain in memory for
            // this session rather than the send failing.
        }
    }

    /** Clear every record. Used when the session ends so nothing outlives sign-out. */
    public clearAll(): void {
        this.records = [];
        this.sequenceCounter = 0;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Nothing further to do; in-memory state is already cleared.
        }
        this.emit();
    }

    private emit(): void {
        const snapshot = [...this.records];
        this.listeners.forEach((l) => {
            try {
                l(snapshot);
            } catch {
                // A failing subscriber must not stop the others.
            }
        });
    }
}
