/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * ConnectionStateService.ts — Connection State Observation
 *
 * Implements the connection state machine in PRD Appendix D.7 (ST-33 … ST-37)
 * and supplies SUX-5 … SUX-8.
 *
 * This service OBSERVES the platform's existing synchronisation state and maps
 * it to the product's connection vocabulary. It performs no network calls,
 * creates no client, and alters no synchronisation behaviour — Sprint 3 must
 * not change Matrix protocol behaviour or the bridge architecture (PRD 6.1).
 *
 * Layer: Service (Blueprint section 4). It is the only place that reads sync
 * state, so no hook or component talks to the SDK directly (Blueprint 8).
 */

import { ClientEvent, type SyncState } from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";

/**
 * Product-level connection state (ST-33 … ST-37).
 *
 * `disconnected` and `serverUnavailable` are deliberately separate: SUX-7
 * requires the user to understand whether the problem is their own network or
 * the system, because the two imply different actions.
 */
export type ConnectionState =
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "serverUnavailable"
    | "restored";

export type ConnectionListener = (state: ConnectionState) => void;

/** How long the transient "restored" confirmation remains visible (ST-36). */
const RESTORED_VISIBLE_MS = 2500;

export class ConnectionStateService {
    private static instance: ConnectionStateService | null = null;

    private state: ConnectionState = "connected";
    private listeners = new Set<ConnectionListener>();
    private attachedTo: unknown = null;
    private restoredTimer: ReturnType<typeof setTimeout> | null = null;
    /** Tracks whether we have been disconnected, so recovery can be confirmed. */
    private wasDisconnected = false;

    private constructor() {}

    public static getInstance(): ConnectionStateService {
        if (!ConnectionStateService.instance) {
            ConnectionStateService.instance = new ConnectionStateService();
        }
        return ConnectionStateService.instance;
    }

    public getState(): ConnectionState {
        return this.state;
    }

    /**
     * Subscribe to connection state changes. Returns an unsubscribe function.
     * Attaching is idempotent: the underlying listener is registered once per
     * client regardless of how many subscribers exist.
     */
    public subscribe(listener: ConnectionListener): () => void {
        this.listeners.add(listener);
        this.attach();
        listener(this.state);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private attach(): void {
        const client = MatrixClientService.getInstance().getClient();
        if (!client || this.attachedTo === client) {
            return;
        }

        this.attachedTo = client;

        try {
            client.on(ClientEvent.Sync, this.onSync);
            // Seed from the current state so a late subscriber is not stale.
            this.applySyncState(client.getSyncState());
        } catch {
            // Observation is best-effort; failure must never break the UI.
        }
    }

    private onSync = (syncState: SyncState | null): void => {
        this.applySyncState(syncState);
    };

    /**
     * Maps platform synchronisation state onto product connection state.
     * Read-only: this never influences synchronisation.
     */
    private applySyncState(syncState: SyncState | null): void {
        switch (syncState) {
            case "PREPARED":
            case "SYNCING":
                this.onHealthy();
                break;
            case "RECONNECTING":
                this.wasDisconnected = true;
                this.set("reconnecting");
                break;
            case "ERROR":
                this.wasDisconnected = true;
                this.set("serverUnavailable");
                break;
            case "STOPPED":
                this.wasDisconnected = true;
                this.set("disconnected");
                break;
            default:
                // CATCHUP and null are transitional; hold the current state.
                break;
        }
    }

    /** ST-36: confirm recovery briefly, then settle to connected. */
    private onHealthy(): void {
        if (!this.wasDisconnected) {
            this.set("connected");
            return;
        }

        this.wasDisconnected = false;
        this.set("restored");

        if (this.restoredTimer) {
            clearTimeout(this.restoredTimer);
        }
        this.restoredTimer = setTimeout(() => {
            this.restoredTimer = null;
            this.set("connected");
        }, RESTORED_VISIBLE_MS);
    }

    private set(next: ConnectionState): void {
        if (this.state === next) return;
        this.state = next;
        this.listeners.forEach((l) => {
            try {
                l(next);
            } catch {
                // A failing subscriber must not stop the others.
            }
        });
    }
}
