/*
 * Sovereign Messenger — Sprint 2, Phase 2.1 Refactoring
 * SovereignConfig.ts — Dynamic Homeserver Configuration & Runtime Strategy.
 *
 * Blueprint & PRD §6 Requirements:
 * - Loads homeserver configuration dynamically from config.json.
 * - ZERO hardcoded URL fallbacks (no "https://gov.local" hardcoding).
 * - Caches configuration after first load.
 * - Preserves both runtimes:
 *     SOVEREIGN_MODE=true  -> Demo Providers
 *     SOVEREIGN_MODE=false -> Matrix Providers
 */

export interface SovereignConfigOptions {
    homeserverUrl: string;
    serverName: string;
    brandName: string;
    defaultTheme: string;
}

export type RuntimeMode = "demo" | "production";

/**
 * Determine active runtime mode from environment flag.
 * Demo Mode (SOVEREIGN_MODE=true) is permanently supported and must never be removed.
 */
export function getRuntimeMode(): RuntimeMode {
    return process.env.SOVEREIGN_MODE === "true" ? "demo" : "production";
}

export function isDemoMode(): boolean {
    return getRuntimeMode() === "demo";
}

let cachedConfig: SovereignConfigOptions | null = null;

/**
 * Loads homeserver configuration dynamically from config.json or injected options.
 * No hardcoded URL fallbacks allowed.
 */
export async function loadSovereignConfig(
    customConfigUrl = "/config.json",
    injectedConfig?: Partial<SovereignConfigOptions>
): Promise<SovereignConfigOptions> {
    if (injectedConfig && injectedConfig.homeserverUrl && injectedConfig.serverName) {
        cachedConfig = {
            homeserverUrl: injectedConfig.homeserverUrl,
            serverName: injectedConfig.serverName,
            brandName: injectedConfig.brandName || "Sovereign Messenger",
            defaultTheme: injectedConfig.defaultTheme || "dark",
        };
        return cachedConfig;
    }

    if (cachedConfig) {
        return cachedConfig;
    }

    try {
        const response = await fetch(customConfigUrl);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText} fetching ${customConfigUrl}`);
        }
        const json = await response.json();
        const hsConfig = json?.default_server_config?.["m.homeserver"];

        if (!hsConfig?.base_url || !hsConfig?.server_name) {
            throw new Error(`Invalid configuration in ${customConfigUrl}: missing m.homeserver base_url or server_name.`);
        }

        cachedConfig = {
            homeserverUrl: hsConfig.base_url,
            serverName: hsConfig.server_name,
            brandName: json.brand || "Sovereign Messenger",
            defaultTheme: json.default_theme || "dark",
        };
        return cachedConfig;
    } catch (error: unknown) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`[SovereignConfig] Unable to load configuration: ${detail}`);
    }
}

/**
 * Returns cached configuration synchronously.
 * Throws an error if loadSovereignConfig() has not been called yet.
 */
export function getSovereignConfig(): SovereignConfigOptions {
    if (!cachedConfig) {
        throw new Error("[SovereignConfig] Configuration has not been loaded. Call loadSovereignConfig() first.");
    }
    return cachedConfig;
}

/**
 * Resets cached configuration (useful for testing or reinitialization).
 */
export function resetSovereignConfig(): void {
    cachedConfig = null;
}
