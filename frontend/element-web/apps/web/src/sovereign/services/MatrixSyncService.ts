/*
 * Sovereign Messenger — Sprint 2, Phase 3
 * MatrixSyncService.ts — Matrix Client Synchronization Service.
 *
 * PRD §3.1 & Phase 3 Requirements:
 * - Manages Matrix JS SDK sync lifecycle (start, stop, restart).
 * - Uses existing authenticated MatrixClient from MatrixClientService. Never creates duplicate clients.
 * - Listens to Matrix SDK "sync" events and maps to internal sync status:
 *     "idle" | "starting" | "syncing" | "stopped" | "error"
 * - Calls startClient() and stopClient() on the SDK client instance without manual /sync HTTP calls.
 * - Zero room fetching, zero UI rendering, zero React component modifications.
 */

import { MatrixClientService } from "./MatrixClientService";

export type MatrixSyncStatus = "idle" | "starting" | "syncing" | "stopped" | "error";

export class MatrixSyncService {
    private static instance: MatrixSyncService | null = null;
    private status: MatrixSyncStatus = "idle";
    private clientService: MatrixClientService;
    private isListening = false;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get singleton instance of MatrixSyncService.
     */
    public static getInstance(): MatrixSyncService {
        if (!MatrixSyncService.instance) {
            MatrixSyncService.instance = new MatrixSyncService();
        }
        return MatrixSyncService.instance;
    }

    /**
     * Start Matrix client sync loop using authenticated MatrixClient from MatrixClientService.
     * Does NOT create a new MatrixClient instance.
     */
    public async start(): Promise<void> {
        const client = this.clientService.getClient();
        if (!client) {
            this.status = "error";
            throw new Error("[MatrixSyncService] Cannot start sync: No authenticated MatrixClient instance available.");
        }

        if (this.status === "syncing" || this.status === "starting") {
            return;
        }

        this.status = "starting";
        this.attachSyncListener(client);

        try {
            await client.startClient({
                initialSyncLimit: 10,
            });
        } catch (error: unknown) {
            this.status = "error";
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixSyncService] Failed to start Matrix sync:", detail);
            throw error;
        }
    }

    /**
     * Stop Matrix client sync loop and detach listeners.
     */
    public stop(): void {
        const client = this.clientService.getClient();
        if (client) {
            try {
                client.stopClient();
            } catch (error: unknown) {
                const detail = error instanceof Error ? error.message : String(error);
                console.warn("[MatrixSyncService] Error stopping client sync:", detail);
            }
        }
        this.status = "stopped";
    }

    /**
     * Restart Matrix client sync loop.
     */
    public async restart(): Promise<void> {
        this.stop();
        await this.start();
    }

    /**
     * Returns current sync status ("idle" | "starting" | "syncing" | "stopped" | "error").
     */
    public getStatus(): MatrixSyncStatus {
        return this.status;
    }

    /**
     * Returns true if client is actively syncing or starting.
     */
    public isSyncing(): boolean {
        return this.status === "syncing" || this.status === "starting";
    }

    /**
     * Attaches listener for Matrix SDK "sync" events.
     */
    private attachSyncListener(client: any): void {
        if (this.isListening) {
            return;
        }

        client.on("sync", (state: string, prevState: string | null, data?: any) => {
            switch (state) {
                case "PREPARED":
                case "SYNCING":
                    this.status = "syncing";
                    break;
                case "STARTING":
                case "REBOOTING":
                    this.status = "starting";
                    break;
                case "STOPPED":
                    this.status = "stopped";
                    break;
                case "ERROR":
                    this.status = "error";
                    if (data?.error) {
                        console.warn("[MatrixSyncService] Sync error event:", data.error);
                    }
                    break;
                default:
                    break;
            }
        });

        this.isListening = true;
    }
}
