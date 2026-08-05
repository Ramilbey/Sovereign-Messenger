/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * FramePreferenceService.ts — Frame Layout Preferences
 *
 * UI-18: panel state adjusted by the user persists across sessions.
 * UI-19: message density is user-selectable between comfortable and compact.
 *
 * Scope: layout preference only. This service stores no credentials, no
 * message content, and no Matrix state, and performs no network calls — so
 * unlike drafts, it is not cleared on sign-out: how a workstation is laid out
 * is a property of the workstation, not of the person signed in.
 */

const STORAGE_KEY = "sovereign_frame_preferences";

/** UI-19: how much vertical room a message occupies. */
export type MessageDensity = "comfortable" | "compact";

export interface FramePreferences {
    /** NAV-1: the organisation sidebar is collapsed to an icon rail. */
    sidebarCollapsed: boolean;
    /** UI-14 / UI-15: the supporting panel is shown. */
    panelOpen: boolean;
    /** UI-14 / UI-15: the work module surface is shown beside the conversation. */
    workspaceOpen: boolean;
    density: MessageDensity;
}

/*
 * UX-2 / NFR-2: the conversation must be the dominant surface on the minimum
 * government workstation (1366x768). With the sidebar, conversation list, work
 * module, and supporting panel all open at once, the conversation is left the
 * narrowest column on screen — 266px against 300px for the list beside it.
 *
 * UI-14 permits the supporting surfaces alongside the conversation at wide; it
 * does not require them open. The work module opens when a module is chosen,
 * which is the moment it is wanted.
 */
const DEFAULTS: FramePreferences = {
    sidebarCollapsed: false,
    panelOpen: true,
    workspaceOpen: false,
    density: "comfortable",
};

export type FramePreferenceListener = (preferences: FramePreferences) => void;

export class FramePreferenceService {
    private static instance: FramePreferenceService | null = null;

    private preferences: FramePreferences = { ...DEFAULTS };
    private loaded = false;
    private listeners = new Set<FramePreferenceListener>();

    private constructor() {}

    public static getInstance(): FramePreferenceService {
        if (!FramePreferenceService.instance) {
            FramePreferenceService.instance = new FramePreferenceService();
        }
        return FramePreferenceService.instance;
    }

    public get(): FramePreferences {
        this.load();
        return this.preferences;
    }

    /** Applies a partial change and persists the result (UI-18). */
    public set(change: Partial<FramePreferences>): void {
        this.load();
        this.preferences = { ...this.preferences, ...change };
        this.persist();
        this.listeners.forEach((listener) => listener(this.preferences));
    }

    public subscribe(listener: FramePreferenceListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private load(): void {
        if (this.loaded) return;
        this.loaded = true;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;

            const parsed: unknown = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;

            const stored = parsed as Partial<Record<keyof FramePreferences, unknown>>;

            // Each field is validated rather than trusted: a corrupt store must
            // never produce an unusable layout the user cannot recover from.
            this.preferences = {
                sidebarCollapsed:
                    typeof stored.sidebarCollapsed === "boolean"
                        ? stored.sidebarCollapsed
                        : DEFAULTS.sidebarCollapsed,
                panelOpen: typeof stored.panelOpen === "boolean" ? stored.panelOpen : DEFAULTS.panelOpen,
                workspaceOpen:
                    typeof stored.workspaceOpen === "boolean"
                        ? stored.workspaceOpen
                        : DEFAULTS.workspaceOpen,
                density:
                    stored.density === "compact" || stored.density === "comfortable"
                        ? stored.density
                        : DEFAULTS.density,
            };
        } catch {
            this.preferences = { ...DEFAULTS };
        }
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
        } catch {
            // Storage may be full or unavailable; the preference still applies
            // for this session rather than the control failing.
        }
    }
}
