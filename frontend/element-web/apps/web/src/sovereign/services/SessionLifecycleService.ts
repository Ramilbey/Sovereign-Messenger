/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * SessionLifecycleService.ts — Sign-Out Data Hygiene
 *
 * Clears locally held user content when the session ends.
 *
 * Why this exists: Sovereign Messenger is deployed on SHARED government
 * workstations. Unsent text may contain case details, names, or other
 * sensitive material, and must not remain readable to the next person who
 * signs in at the same machine.
 *
 * Why the dispatcher rather than a React unmount: React StrictMode simulates
 * an unmount during development, and a component unmount is not a sign-out.
 * Clearing on unmount would destroy a user's drafts every time the interface
 * remounted. Sign-out is a session event, so it is observed as one.
 *
 * This service only OBSERVES the host's existing lifecycle actions. It does
 * not authenticate, does not modify the login or logout flow, and does not
 * touch the bridge or the client (PRD section 6.1).
 *
 * FUTURE ENHANCEMENT (not implemented here): encryption at rest for locally
 * held drafts and outbox records. That decision is tied to the platform's
 * unresolved encryption and retention model (PRD Future Recommendations
 * FUT-1) and should not be invented locally.
 */

import defaultDispatcher from "../../dispatcher/dispatcher";
import { Action } from "../../dispatcher/actions";
import type { ActionPayload } from "../../dispatcher/payloads";

import { DraftService } from "./DraftService";
import { OutboxService } from "./OutboxService";
import { ConnectionStateService } from "./ConnectionStateService";

export class SessionLifecycleService {
    private static instance: SessionLifecycleService | null = null;
    private registered = false;

    private constructor() {}

    public static getInstance(): SessionLifecycleService {
        if (!SessionLifecycleService.instance) {
            SessionLifecycleService.instance = new SessionLifecycleService();
        }
        return SessionLifecycleService.instance;
    }

    /** Begin observing session lifecycle actions. Idempotent. */
    public initialize(): void {
        if (this.registered) return;
        this.registered = true;

        defaultDispatcher.register(this.onDispatch);
    }

    private onDispatch = (payload: ActionPayload): void => {
        if (payload.action === Action.OnLoggedOut || payload.action === Action.TriggerLogout) {
            this.clearSessionData();
        }
    };

    /**
     * Remove everything this application holds locally for the signed-out user.
     * Called on sign-out so no user content outlives the session.
     */
    public clearSessionData(): void {
        try {
            DraftService.getInstance().clearAll();
        } catch {
            // Clearing is best-effort per store; one failure must not skip the others.
        }

        try {
            OutboxService.getInstance().clearAll();
        } catch {
            // As above.
        }

        try {
            // Release the sync listener so no stale client observation survives.
            ConnectionStateService.getInstance().detach();
        } catch {
            // As above.
        }
    }
}
