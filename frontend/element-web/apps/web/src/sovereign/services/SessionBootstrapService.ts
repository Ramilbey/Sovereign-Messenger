/*
 * Sovereign Messenger — Sprint 2, Phase 2.4
 * SessionBootstrapService.ts — Automatic Session Restoration Manager.
 *
 * PRD §3.1 & Phase 2.4 Requirements:
 * - Automatically restores stored MatrixSession at application boot.
 * - Validates required session fields (accessToken, userId, homeserverUrl).
 * - Initializes MatrixClientService using createAuthenticatedClientFromSession().
 * - Clears corrupted sessions and returns null gracefully.
 * - Zero exceptions, zero login API calls, zero sync, zero room fetching.
 */

import { SessionService, type MatrixSession } from "./SessionService";
import { MatrixClientService } from "./MatrixClientService";
import { type MatrixClient } from "matrix-js-sdk/src/matrix";

export class SessionBootstrapService {
    private static instance: SessionBootstrapService | null = null;
    private sessionService: SessionService;
    private clientService: MatrixClientService;

    private constructor() {
        this.sessionService = SessionService.getInstance();
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get singleton instance of SessionBootstrapService.
     */
    public static getInstance(): SessionBootstrapService {
        if (!SessionBootstrapService.instance) {
            SessionBootstrapService.instance = new SessionBootstrapService();
        }
        return SessionBootstrapService.instance;
    }

    /**
     * Bootstraps and restores an existing stored session at application startup.
     * Validates required fields, clears corrupted sessions, and initializes MatrixClientService.
     * Does NOT perform login API calls, start sync, fetch rooms, or alter UI state.
     */
    public async bootstrapSession(): Promise<MatrixClient | null> {
        try {
            // 1. Ensure homeserver configuration is loaded
            await this.clientService.configure();

            // 2. Retrieve stored session from SessionService
            const session = this.sessionService.restoreSession();
            if (!session) {
                return null;
            }

            // 3. Validate required fields
            if (!this.isValidSession(session)) {
                console.warn("[SessionBootstrapService] Invalid or corrupted session detected. Clearing session storage.");
                this.sessionService.clearSession();
                return null;
            }

            // 4. Initialize shared authenticated client in MatrixClientService
            const client = this.clientService.createAuthenticatedClientFromSession(session);
            return client;
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[SessionBootstrapService] Exception during session bootstrap:", detail);
            this.sessionService.clearSession();
            return null;
        }
    }

    /**
     * Validates that all required session fields are present and non-empty.
     */
    private isValidSession(session: MatrixSession): boolean {
        return (
            typeof session.accessToken === "string" &&
            session.accessToken.trim().length > 0 &&
            typeof session.userId === "string" &&
            session.userId.trim().length > 0 &&
            typeof session.homeserverUrl === "string" &&
            session.homeserverUrl.trim().length > 0
        );
    }
}
