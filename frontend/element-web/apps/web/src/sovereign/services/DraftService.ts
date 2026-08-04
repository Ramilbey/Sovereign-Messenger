/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * DraftService.ts — Per-Conversation Draft Persistence
 *
 * Implements FR-40, UX-9 and SUX-15: the user must never lose composed text
 * through navigation, error, connection loss, or a security interruption such
 * as session expiry.
 *
 * Drafts are held per conversation and persisted, so composed text survives a
 * reload and is restored when the user returns to the conversation.
 *
 * Scope: drafts only. This service stores no credentials, no message history,
 * and no personal data beyond text the user has typed and not yet sent. It
 * performs no network calls and touches no Matrix state.
 */

const STORAGE_KEY = "sovereign_drafts";

type DraftMap = Record<string, string>;

export class DraftService {
    private static instance: DraftService | null = null;

    /** In-memory cache so reads do not hit storage on every keystroke. */
    private drafts: DraftMap = {};
    private loaded = false;

    private constructor() {}

    public static getInstance(): DraftService {
        if (!DraftService.instance) {
            DraftService.instance = new DraftService();
        }
        return DraftService.instance;
    }

    /** Read the draft for a conversation, or an empty string when there is none. */
    public get(conversationId: string): string {
        if (!conversationId) return "";
        this.load();
        return this.drafts[conversationId] ?? "";
    }

    /**
     * Store the draft for a conversation. An empty or whitespace-only draft is
     * removed rather than stored, so an emptied composer does not leave a
     * phantom draft indicator behind.
     */
    public set(conversationId: string, text: string): void {
        if (!conversationId) return;
        this.load();

        if (text.trim() === "") {
            delete this.drafts[conversationId];
        } else {
            this.drafts[conversationId] = text;
        }

        this.persist();
    }

    /** Remove a draft, e.g. once its message has been sent successfully. */
    public clear(conversationId: string): void {
        if (!conversationId) return;
        this.load();
        if (conversationId in this.drafts) {
            delete this.drafts[conversationId];
            this.persist();
        }
    }

    /** Whether a conversation currently holds unsent text. */
    public has(conversationId: string): boolean {
        return this.get(conversationId) !== "";
    }

    private load(): void {
        if (this.loaded) return;
        this.loaded = true;

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                // Keep only string values; ignore anything unexpected.
                for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
                    if (typeof value === "string") {
                        this.drafts[key] = value;
                    }
                }
            }
        } catch {
            // A corrupt or unavailable store must never prevent composing.
            this.drafts = {};
        }
    }

    private persist(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.drafts));
        } catch {
            // Storage may be full or unavailable; drafts remain in memory for
            // this session rather than the composer failing (ERR-6).
        }
    }
}
