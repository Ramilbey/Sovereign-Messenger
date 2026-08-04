/*
 * Sovereign Messenger — Sprint 2 Architectural Alignment
 * MatrixClientBridge.ts — Matrix Client Bridge Adapter.
 *
 * Architecture & Blueprint Principles:
 * - Single Matrix Client Principle: Host (Element Web) owns the authenticated MatrixClient.
 * - Matrix Client Bridge: Synchronizes the authenticated MatrixClient instance from MatrixClientPeg to MatrixClientService.
 * - Zero network authentication, zero client creation, zero duplicate sync.
 * - Listens for Element Web lifecycle events (Action.OnLoggedIn, Action.OnLoggedOut, Action.TriggerLogout).
 */

import { type MatrixClient } from "matrix-js-sdk/src/matrix";
import defaultDispatcher from "../../dispatcher/dispatcher";
import { Action } from "../../dispatcher/actions";
import { type ActionPayload, isAction } from "../../dispatcher/payloads";
import { type OnLoggedInPayload } from "../../dispatcher/payloads/OnLoggedInPayload";
import { MatrixClientPeg } from "../../MatrixClientPeg";
import { MatrixClientService } from "../services/MatrixClientService";
import { SessionService } from "../services/SessionService";
import { BootstrapCoordinator } from "../services/BootstrapCoordinator";

export class MatrixClientBridge {
    private static instance: MatrixClientBridge | null = null;
    private isInitialized = false;

    private constructor() {}

    /**
     * Get singleton instance of MatrixClientBridge.
     */
    public static getInstance(): MatrixClientBridge {
        if (!MatrixClientBridge.instance) {
            MatrixClientBridge.instance = new MatrixClientBridge();
        }
        return MatrixClientBridge.instance;
    }

    /**
     * Initializes the bridge listener for Element Web lifecycle events.
     * Also immediately checks if MatrixClientPeg already holds an authenticated client.
     */
    public initialize(): void {
        if (this.isInitialized) {
            this.syncFromPeg();
            return;
        }

        this.isInitialized = true;

        // 1. Register dispatcher listener for Element Web lifecycle actions
        defaultDispatcher.register(this.onDispatch);

        // 2. Immediately sync if MatrixClientPeg already holds an active client (e.g. restored session)
        this.syncFromPeg();
    }

    /**
     * Synchronizes the authenticated client reference from MatrixClientPeg if present.
     */
    public syncFromPeg(): void {
        const client = MatrixClientPeg.get();
        if (client) {
            this.handleLoggedIn(client);
        }
    }

    /**
     * Flux dispatcher callback handling OnLoggedIn, OnLoggedOut, and TriggerLogout.
     */
    private onDispatch = (payload: ActionPayload): void => {
        if (isAction<OnLoggedInPayload>(payload, Action.OnLoggedIn)) {
            const client = payload.client || MatrixClientPeg.get();
            if (client) {
                this.handleLoggedIn(client);
            }
        } else if (payload.action === Action.OnLoggedOut || payload.action === Action.TriggerLogout) {
            this.handleLoggedOut();
        }
    };

    /**
     * Sets the shared authenticated client reference in MatrixClientService and initializes session coordinator.
     */
    public handleLoggedIn(client: MatrixClient): void {
        const clientService = MatrixClientService.getInstance();
        clientService.setClient(client);

        const sessionService = SessionService.getInstance();
        sessionService.saveSession({
            accessToken: client.getAccessToken() || "",
            userId: client.getUserId() || "",
            deviceId: client.getDeviceId() || "",
            homeserverUrl: client.baseUrl || "",
        });

        BootstrapCoordinator.getInstance().initialize();
    }

    /**
     * Clears client and session references on logout.
     */
    public handleLoggedOut(): void {
        MatrixClientService.getInstance().clearClient();
        SessionService.getInstance().clearSession();
        BootstrapCoordinator.getInstance().reset();
    }
}

// Auto-initialize singleton bridge on module import
MatrixClientBridge.getInstance().initialize();
