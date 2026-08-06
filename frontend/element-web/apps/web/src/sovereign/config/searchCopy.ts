/*
 * Sovereign Messenger — Sprint 3, Milestone 5
 * searchCopy.ts — Search Copy
 *
 * NFR-4: no search text is embedded in a component.
 */

import type { SearchCategory } from "../types/search";

export const SEARCH_COPY = {
    /** NAV-4: the entry point in the application header. */
    open: "Qidiruv",
    /** NAV-4 / SR-2: reachable by keyboard from anywhere. */
    shortcutHint: "Ctrl+K",
    placeholder: "Suhbatlar, xodimlar, xabarlar, fayllar",
    label: "Qidiruv so'rovi",
    close: "Yopish",
    clear: "Tozalash",

    /** SR-3: results grouped by category, most relevant first. */
    category: {
        conversations: "Suhbatlar",
        people: "Xodimlar",
        messages: "Xabarlar",
        files: "Fayllar",
    } as Record<SearchCategory, string>,

    /** SR-11: recent searches offered when the field is focused and empty. */
    allCategories: "Barchasi",
    recent: "Oxirgi qidiruvlar",
    /** ST-28: the idle state, before anything has been typed. */
    idle: "Qidirish uchun yozing",

    /** SR-10: an empty result is distinct from a failed one, and suggests. */
    emptyHint: "So'rovni qisqartiring yoki boshqa so'z bilan urinib ko'ring",

    /**
     * R-4 / SR-10: the result set is knowably incomplete, because the server
     * cannot index content it cannot read. Said plainly, without protocol or
     * cryptographic vocabulary (SUX-1, SUX-12).
     */
    limited: "Ba'zi xabarlar qidiruvga kirmasligi mumkin",
} as const;
