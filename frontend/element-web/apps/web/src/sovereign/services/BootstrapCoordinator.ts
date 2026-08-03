/*
 * Sovereign Messenger — Sprint 2, Phase 2.5
 * BootstrapCoordinator.ts — Application Bootstrap Coordinator.
 *
 * PRD §3.1 & Phase 2.5 Requirements:
 * - Coordinates SessionBootstrapService execution during application startup.
 * - Manages application bootstrap lifecycle state ("idle" | "loading" | "ready" | "no-session" | "error").
 * - Determines whether an authenticated MatrixClient already exists in memory.
 * - Zero network login API calls, zero Matrix sync, zero room/message fetching, zero chat history restoration.
 * - Returns clean "no-session" status when no stored session exists.
 */

import { SessionBootstrapService } from "./SessionBootstrapService";
import { MatrixClientService } from "./MatrixClientService";
import { type MatrixClient } from "matrix-js-sdk/src/matrix";

export type BootstrapStatus = "idle" | "loading" | "ready" | "no-session" | "error";

export interface BootstrapResult {
    status: BootstrapStatus;
    client: MatrixClient | null;
    error?: string;
}

export class BootstrapCoordinator {
    private static instance: BootstrapCoordinator | null = null;
    private status: BootstrapStatus = "idle";
    private bootstrapService: SessionBootstrapService;
    private clientService: MatrixClientService;
    private initPromise: Promise<BootstrapResult> | null = null;

    private constructor() {
        this.bootstrapService = SessionBootstrapService.getInstance();
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get singleton instance of BootstrapCoordinator.
     */
    public static getInstance(): BootstrapCoordinator {
        if (!BootstrapCoordinator.instance) {
            BootstrapCoordinator.instance = new BootstrapCoordinator();
        }
        return BootstrapCoordinator.instance;
    }

    /**
     * Executes the application bootstrap flow.
     * Restores stored session, initializes authenticated MatrixClient if valid,
     * and sets status to "ready" or "no-session".
     */
    public async initialize(): Promise<BootstrapResult> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            this.status = "loading";

            try {
                // Check if client is already authenticated in memory
                if (this.clientService.hasAuthenticatedClient()) {
                    this.status = "ready";
                    return {
                        status: "ready",
                        client: this.clientService.getClient(),
                    };
                }

                // Execute SessionBootstrapService to restore session from storage
                const client = await this.bootstrapService.bootstrapSession();

                if (client) {
                    this.status = "ready";
                    return {
                        status: "ready",
                        client,
                    };
                }

                this.status = "no-session";
                return {
                    status: "no-session",
                    client: null,
                };
            } catch (error: unknown) {
                const detail = error instanceof Error ? error.message : String(error);
                console.warn("[BootstrapCoordinator] Bootstrap failed:", detail);
                this.status = "error";
                return {
                    status: "error",
                    client: null,
                    error: detail,
                };
            }
        })();

        return this.initPromise;
    }

    /**
     * Returns current bootstrap status ("idle" | "loading" | "ready" | "no-session" | "error").
     */
    public getStatus(): BootstrapStatus {
        return this.status;
    }

    /**
     * Returns active MatrixClient instance if authenticated and ready, or null.
     */
    public getClient(): MatrixClient | null {
        return this.clientService.getClient();
    }

    /**
     * Check if bootstrap has completed successfully with an authenticated client.
     */
    public isReady(): boolean {
        return this.status === "ready" && this.clientService.hasAuthenticatedClient();
    }

    /**
     * Check if bootstrap completed with no stored session.
     */
    public hasNoSession(): boolean {
        return this.status === "no-session";
    }

    /**
     * Reset bootstrap status state (useful for logout or testing).
     */
    public reset(): void {
        this.status = "idle";
        this.initPromise = null;
    }
}
