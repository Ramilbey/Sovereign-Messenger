/*
 * Sovereign Messenger — Sprint 2, Phase 2.3
 * MatrixClientService.ts — Matrix JS SDK Client Service & Lifecycle Manager.
 *
 * Architecture Principles:
 * - Encapsulates Matrix JS SDK client creation (createClient).
 * - Manages single authenticated MatrixClient instance lifecycle.
 * - Supports creating/restoring an authenticated client from a restored MatrixSession object.
 * - Accepts homeserver configuration exclusively from SovereignConfig (zero hardcoded URLs).
 * - Layer Isolation: UI -> Context -> Provider -> Service -> SessionService -> Matrix SDK.
 */

import { createClient, type MatrixClient, type ICreateClientOpts } from "matrix-js-sdk/src/matrix";
import { loadSovereignConfig, getSovereignConfig, type SovereignConfigOptions } from "../config/SovereignConfig";
import { type MatrixSession } from "./SessionService";
import { MatrixClientPeg } from "../../MatrixClientPeg";

export interface AuthenticatedClientCredentials {
    accessToken: string;
    userId: string;
    deviceId?: string;
    baseUrl?: string;
}

export class MatrixClientService {
    private static instance: MatrixClientService | null = null;
    private authenticatedClient: MatrixClient | null = null;
    private config: SovereignConfigOptions | null = null;

    private constructor() {}

    /**
     * Get singleton instance of MatrixClientService.
     */
    public static getInstance(): MatrixClientService {
        if (!MatrixClientService.instance) {
            MatrixClientService.instance = new MatrixClientService();
        }
        return MatrixClientService.instance;
    }

    /**
     * Ensures homeserver configuration is loaded and cached via SovereignConfig.
     */
    public async configure(injectedConfig?: Partial<SovereignConfigOptions>): Promise<SovereignConfigOptions> {
        this.config = await loadSovereignConfig("/config.json", injectedConfig);
        return this.config;
    }

    /**
     * Resolves the active homeserver URL dynamically from cached configuration or throws error.
     * Zero hardcoded fallback URLs.
     */
    public getHomeserverUrl(): string {
        if (this.config?.homeserverUrl) {
            return this.config.homeserverUrl;
        }
        try {
            return getSovereignConfig().homeserverUrl;
        } catch {
            throw new Error("[MatrixClientService] Homeserver URL is not configured. Call configure() first.");
        }
    }

    /**
     * Initializes and sets the single shared authenticated MatrixClient instance.
     * Reused across future messaging, rooms, timeline, presence, and status services.
     */
    public createAuthenticatedClient(creds: AuthenticatedClientCredentials): MatrixClient {
        const baseUrl = creds.baseUrl || this.getHomeserverUrl();

        const opts: ICreateClientOpts = {
            baseUrl,
            accessToken: creds.accessToken,
            userId: creds.userId,
            deviceId: creds.deviceId,
        };

        this.authenticatedClient = createClient(opts);
        return this.authenticatedClient;
    }

    /**
     * Restores/initializes an authenticated MatrixClient instance from a MatrixSession object.
     * Does NOT start sync, fetch rooms, or fetch messages.
     */
    public createAuthenticatedClientFromSession(session: MatrixSession): MatrixClient {
        return this.createAuthenticatedClient({
            accessToken: session.accessToken,
            userId: session.userId,
            deviceId: session.deviceId,
            baseUrl: session.homeserverUrl,
        });
    }

    /**
     * Sets the shared authenticated MatrixClient reference directly from Host Platform.
     * Does NOT call createClient(), login(), or startClient().
     */
    public setClient(client: MatrixClient): void {
        this.authenticatedClient = client;
    }

    /**
     * Clears the authenticated MatrixClient reference without stopping host client.
     */
    public clearClient(): void {
        this.authenticatedClient = null;
    }

    /**
     * Get current active authenticated MatrixClient instance.
     * Checks explicit reference first, falling back to MatrixClientPeg.get().
     */
    public getClient(): MatrixClient | null {
        if (this.authenticatedClient) {
            return this.authenticatedClient;
        }
        return MatrixClientPeg.get();
    }

    /**
     * Check if an authenticated MatrixClient instance is initialized and active.
     */
    public hasAuthenticatedClient(): boolean {
        return this.getClient() !== null;
    }
}
