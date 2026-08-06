/*
 * Sovereign Messenger — Sprint 3, Milestone 5
 * search.ts — Search Model
 *
 * SR-1: one search covering conversations, people, messages, and files.
 * SR-3: results grouped by category.
 */

export type SearchCategory = "conversations" | "people" | "messages" | "files";

/** SR-4: enough context to identify a result without opening it. */
export interface SearchResult {
    id: string;
    category: SearchCategory;
    /** The conversation name, the person's name, or the file name. */
    title: string;
    /** SR-4: for a message, the matched text; for a person, role and department. */
    context: string;
    /** SR-5: where selecting this result navigates to. */
    conversationId?: string;
    /** SR-5: the message to position at and highlight. */
    eventId?: string;
    /** Ordering within a category — most recent first where known. */
    timestamp?: number;
}

export interface SearchResults {
    /** SR-3 / SR-8: categories arrive progressively; each carries its own state. */
    groups: Array<{ category: SearchCategory; results: SearchResult[] }>;
    /**
     * R-4 / SR-10: server-side search cannot index content the server cannot
     * read. True when the result set is knowably incomplete for that reason.
     */
    limited: boolean;
}
