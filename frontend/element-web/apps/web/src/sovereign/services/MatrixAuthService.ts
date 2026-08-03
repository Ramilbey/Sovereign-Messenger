/*
 * Sovereign Messenger — Sprint 2, Phase 2.3
 * MatrixAuthService.ts — Matrix Authentication Service.
 *
 * PRD §3.1 & Phase 2.3 Requirements:
 * - Encapsulates Matrix JS SDK login via MatrixClientService.
 * - Saves session via SessionService on successful login.
 * - Clears session via SessionService on logout.
 * - MatrixAuthService does not implement storage itself (SessionService single responsibility).
 * - Layer Isolation: UI -> Context -> Provider -> Service -> SessionService -> Matrix SDK.
 */

import { MatrixClientService } from "./MatrixClientService";
import { SessionService } from "./SessionService";

export interface MatrixAuthResult {
    success: boolean;
    accessToken?: string;
    userId?: string;
    deviceId?: string;
    homeserverUrl?: string;
    error?: {
        errcode?: string;
        message: string;
        httpStatus?: number;
    };
}

export class MatrixAuthService {
    private static instance: MatrixAuthService | null = null;
    private clientService: MatrixClientService;
    private sessionService: SessionService;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
        this.sessionService = SessionService.getInstance();
    }

    /**
     * Get singleton instance of MatrixAuthService.
     */
    public static getInstance(): MatrixAuthService {
        if (!MatrixAuthService.instance) {
            MatrixAuthService.instance = new MatrixAuthService();
        }
        return MatrixAuthService.instance;
    }

    /**
     * Perform password authentication against Matrix homeserver via Matrix JS SDK.
     * On success, persists session via SessionService and initializes shared client.
     */
    public async login(username: string, password: string): Promise<MatrixAuthResult> {
        try {
            // 1. Ensure homeserver configuration is dynamically resolved from config.json
            const config = await this.clientService.configure();
            
            // 2. Create temporary unauthenticated client instance for login request
            const tempClient = this.clientService.createUnauthenticatedClient(config.homeserverUrl);

            // 3. Perform Matrix password authentication (POST /_matrix/client/v3/login)
            const response = await tempClient.login("m.login.password", {
                identifier: {
                    type: "m.id.user",
                    user: username,
                },
                password,
                initial_device_display_name: "Sovereign Messenger Web",
            });

            // 4. Save session via SessionService (single responsibility)
            this.sessionService.saveSession({
                accessToken: response.access_token,
                userId: response.user_id,
                deviceId: response.device_id || "",
                homeserverUrl: config.homeserverUrl,
            });

            // 5. Initialize shared authenticated client in MatrixClientService for future reuse
            this.clientService.createAuthenticatedClient({
                accessToken: response.access_token,
                userId: response.user_id,
                deviceId: response.device_id,
                baseUrl: config.homeserverUrl,
            });

            return {
                success: true,
                accessToken: response.access_token,
                userId: response.user_id,
                deviceId: response.device_id,
                homeserverUrl: config.homeserverUrl,
            };
        } catch (error: unknown) {
            let errcode = "M_UNKNOWN";
            let message = "Authentication failed.";
            let httpStatus: number | undefined = undefined;

            if (typeof error === "object" && error !== null) {
                const errObj = error as Record<string, unknown>;
                const dataObj = typeof errObj.data === "object" && errObj.data !== null 
                    ? (errObj.data as Record<string, unknown>) 
                    : undefined;

                if (typeof errObj.errcode === "string") {
                    errcode = errObj.errcode;
                } else if (typeof dataObj?.errcode === "string") {
                    errcode = dataObj.errcode;
                }

                if (typeof errObj.message === "string") {
                    message = errObj.message;
                } else if (typeof dataObj?.error === "string") {
                    message = dataObj.error;
                } else if (error instanceof Error) {
                    message = error.message;
                }

                if (typeof errObj.httpStatus === "number") {
                    httpStatus = errObj.httpStatus;
                } else if (typeof errObj.statusCode === "number") {
                    httpStatus = errObj.statusCode;
                }
            } else if (typeof error === "string") {
                message = error;
            }

            return {
                success: false,
                error: {
                    errcode,
                    message,
                    httpStatus,
                },
            };
        }
    }

    /**
     * Terminate session, clear storage, and release authenticated client reference.
     */
    public async logout(): Promise<void> {
        this.sessionService.clearSession();
        this.clientService.stopClient();
    }
}
