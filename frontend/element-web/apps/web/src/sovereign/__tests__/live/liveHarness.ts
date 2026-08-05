/*
 * Sovereign Messenger — Sprint 3 acceptance
 * liveHarness.ts — two authenticated clients against a real homeserver
 *
 * Acceptance strategy §15.2 requires acceptance in Production Mode against the
 * live homeserver with at least two concurrent real users. This harness
 * provides exactly that: two genuinely authenticated Matrix clients, actually
 * synchronising, driving the real Sovereign service layer.
 *
 * The homeserver is a disposable instance created for testing. The deployment
 * configuration under backend/ is untouched (PRD §6.1).
 */

import { createClient, type MatrixClient } from "matrix-js-sdk/src/matrix";

export const HOMESERVER = process.env.SVR_TEST_HS ?? "http://localhost:8008";

export interface LiveUser {
    client: MatrixClient;
    userId: string;
}

export async function login(user: string, password: string): Promise<LiveUser> {
    const client = createClient({ baseUrl: HOMESERVER });
    const res: any = await client.login("m.login.password", {
        identifier: { type: "m.id.user", user },
        password,
    });

    const authed = createClient({
        baseUrl: HOMESERVER,
        accessToken: res.access_token,
        userId: res.user_id,
        deviceId: res.device_id,
    });

    return { client: authed, userId: res.user_id };
}

/** Starts synchronisation and resolves once the client has caught up. */
export async function startSync(user: LiveUser): Promise<void> {
    await user.client.startClient({ initialSyncLimit: 20 });
    await waitFor(() => user.client.getSyncState() === "SYNCING", 20000, "initial sync");
}

/** Polls a condition, which is how a real distributed system is observed. */
export async function waitFor(
    predicate: () => boolean,
    timeoutMs: number,
    what: string,
): Promise<number> {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        if (predicate()) return Date.now() - started;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Timed out after ${timeoutMs}ms waiting for: ${what}`);
}

/** Binds a Sovereign service singleton to one of the live clients. */
export function bind(service: unknown, user: LiveUser): void {
    (service as { clientService: unknown }).clientService = { getClient: () => user.client };
    (service as { snapshot?: unknown }).snapshot = null;
}
