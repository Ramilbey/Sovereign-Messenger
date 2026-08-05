/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * MatrixPresenceService.ts — Presence Retrieval and Observation
 *
 * Implements D-7 (FR-12 … FR-17, ST-6 … ST-10).
 *
 * This service OBSERVES presence the platform already synchronises and maps it
 * to the product's availability vocabulary. It performs no synchronisation of
 * its own and alters no protocol behaviour (PRD §6.1).
 *
 * Readiness Review R-3: presence may be disabled or throttled server-side. A
 * user the deployment reports nothing for resolves to `unknown`, which the
 * interface presents as "not reported" rather than inventing "offline" — a
 * colleague shown as offline when the server simply is not saying is a
 * fabrication about a person (FR-1).
 */

import { ClientEvent, UserEvent } from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";
import type { PresenceState, SovereignPresence } from "../types/presence";

export type PresenceListener = () => void;

/** Coalescing window: a department's presence arrives in bursts (PERF-7). */
const COALESCE_MS = 100;

function toState(raw: string | undefined, currentlyActive?: boolean): PresenceState {
    switch (raw) {
        case "online":
            // ST-7: away is derived from inactivity, which the platform
            // reports as an online user who is not currently active.
            return currentlyActive === false ? "away" : "online";
        case "unavailable":
            return "away";
        case "busy":
            return "busy";
        case "offline":
            return "offline";
        default:
            return "unknown";
    }
}

export class MatrixPresenceService {
    private static instance: MatrixPresenceService | null = null;

    private clientService: MatrixClientService;
    private listeners = new Set<PresenceListener>();
    private detach: (() => void) | null = null;
    private timer: ReturnType<typeof setTimeout> | null = null;
    /** ST-8: a manual selection, held until the user clears it. */
    private manual: PresenceState | null = null;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    public static getInstance(): MatrixPresenceService {
        if (!MatrixPresenceService.instance) {
            MatrixPresenceService.instance = new MatrixPresenceService();
        }
        return MatrixPresenceService.instance;
    }

    /** FR-12 / FR-14: the availability of one person. */
    public getPresence(userId: string): SovereignPresence {
        const client = this.clientService.getClient();
        if (!client || !userId) {
            return { userId, state: "unknown", lastActiveAt: null };
        }

        // ST-8: the signed-in user's own manual selection wins until cleared.
        if (this.manual && userId === client.getUserId()) {
            return { userId, state: this.manual, lastActiveAt: Date.now() };
        }

        try {
            const user: any = client.getUser(userId);
            if (!user) return { userId, state: "unknown", lastActiveAt: null };

            const lastActiveAgo = typeof user.lastActiveAgo === "number" ? user.lastActiveAgo : 0;

            return {
                userId,
                state: toState(user.presence, user.currentlyActive),
                // FR-14: an absolute moment, derived from the platform's
                // relative report. Null when nothing has been reported.
                lastActiveAt: lastActiveAgo > 0 ? Date.now() - lastActiveAgo : null,
                statusMessage: user.presenceStatusMsg || undefined,
            };
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixPresenceService] Error reading presence for ${userId}:`, detail);
            return { userId, state: "unknown", lastActiveAt: null };
        }
    }

    public getPresenceFor(userIds: string[]): Map<string, SovereignPresence> {
        return new Map(userIds.map((id) => [id, this.getPresence(id)]));
    }

    /**
     * FR-15 / ST-8: set availability manually. The selection overrides
     * automatic detection until cleared with null.
     */
    public async setManualPresence(state: PresenceState | null): Promise<void> {
        this.manual = state;
        this.notify();

        const client = this.clientService.getClient();
        if (!client || !state) return;

        try {
            await client.setPresence({
                presence: state === "away" ? "unavailable" : (state as "online" | "offline"),
            });
        } catch (error: unknown) {
            // A deployment with presence disabled rejects the write; the local
            // selection still applies to this session rather than the control
            // appearing to do nothing (R-3).
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixPresenceService] Unable to publish presence:", detail);
        }
    }

    public getManualPresence(): PresenceState | null {
        return this.manual;
    }

    public subscribe(listener: PresenceListener): () => void {
        this.listeners.add(listener);
        this.attach();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.detach?.();
                this.detach = null;
                if (this.timer !== null) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            }
        };
    }

    private attach(): void {
        if (this.detach) return;

        const client = this.clientService.getClient();
        if (!client) return;

        const notify = (): void => this.schedule();

        try {
            client.on(UserEvent.Presence, notify);
            client.on(UserEvent.LastPresenceTs, notify);
            client.on(ClientEvent.Sync, notify);
        } catch {
            return;
        }

        this.detach = () => {
            try {
                client.removeListener(UserEvent.Presence, notify);
                client.removeListener(UserEvent.LastPresenceTs, notify);
                client.removeListener(ClientEvent.Sync, notify);
            } catch {
                // The listeners go out of scope with the client.
            }
        };
    }

    private schedule(): void {
        if (this.timer !== null) return;
        this.timer = setTimeout(() => {
            this.timer = null;
            this.notify();
        }, COALESCE_MS);
    }

    private notify(): void {
        this.listeners.forEach((listener) => {
            try {
                listener();
            } catch (error: unknown) {
                const detail = error instanceof Error ? error.message : String(error);
                console.warn("[MatrixPresenceService] Error in presence subscriber:", detail);
            }
        });
    }
}
