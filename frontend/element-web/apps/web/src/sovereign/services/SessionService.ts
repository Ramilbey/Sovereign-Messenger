/*
 * Sovereign Messenger — Sprint 2, Phase 2.3
 * SessionService.ts — Matrix Session Persistence Manager.
 *
 * PRD §3.1 & Phase 2.3 Requirements:
 * - Dedicated service for Matrix session storage using localStorage.
 * - Stores ONLY: accessToken, userId, deviceId, homeserverUrl.
 * - ZERO password persistence.
 * - Single Responsibility: SessionService is the only component managing session storage.
 */

export interface MatrixSession {
    accessToken: string;
    userId: string;
    deviceId: string;
    homeserverUrl: string;
}

const SESSION_STORAGE_KEY = "sovereign_matrix_session";

export class SessionService {
    private static instance: SessionService | null = null;

    private constructor() {}

    /**
     * Get singleton instance of SessionService.
     */
    public static getInstance(): SessionService {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }

    /**
     * Save active Matrix session to localStorage.
     * Never persists passwords or sensitive raw credentials.
     */
    public saveSession(session: MatrixSession): void {
        try {
            const data = JSON.stringify(session);
            localStorage.setItem(SESSION_STORAGE_KEY, data);
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[SessionService] Failed to save Matrix session:", detail);
        }
    }

    /**
     * Restore persisted Matrix session from localStorage.
     * Returns MatrixSession object if valid, or null if empty/corrupted.
     */
    public restoreSession(): MatrixSession | null {
        try {
            const raw = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);
            if (
                typeof parsed === "object" &&
                parsed !== null &&
                typeof parsed.accessToken === "string" &&
                typeof parsed.userId === "string" &&
                typeof parsed.homeserverUrl === "string"
            ) {
                return {
                    accessToken: parsed.accessToken,
                    userId: parsed.userId,
                    deviceId: parsed.deviceId || "",
                    homeserverUrl: parsed.homeserverUrl,
                };
            }
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[SessionService] Failed to restore Matrix session:", detail);
        }

        return null;
    }

    /**
     * Clear active session from localStorage during logout or invalidation.
     */
    public clearSession(): void {
        try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[SessionService] Failed to clear Matrix session:", detail);
        }
    }

    /**
     * Check if a valid session exists in storage.
     */
    public hasValidSession(): boolean {
        return this.restoreSession() !== null;
    }
}
