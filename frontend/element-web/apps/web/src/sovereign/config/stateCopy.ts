/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * stateCopy.ts — Per-Surface State Copy
 *
 * Implements the copy table in PRD section 8.11 (ES-7).
 *
 * All user-facing state copy lives here rather than being embedded in
 * components, so that:
 *   - NFR-4: no user-facing text is hardcoded in the interface
 *   - ES-7: every surface's copy is reviewable in one place for Uzbek and,
 *     during localisation (D-20), Russian
 *   - QA can verify AC-30 (every surface shows the specified copy) against a
 *     single authoritative table
 */

/** Surfaces that present state copy. Keys match PRD section 8.11. */
export type SurfaceId =
    | "conversations"
    | "channels"
    | "groups"
    | "directChats"
    | "timeline"
    | "search"
    | "members"
    | "documents"
    | "notifications"
    | "organisation"
    | "pinned"
    | "favourites"
    | "conversationFiles"
    | "profile"
    | "tasks"
    | "calendar"
    | "dashboard"
    | "cases"
    | "suspects"
    | "evidence"
    | "records"
    | "courtMaterials";

export interface SurfaceCopy {
    /** Shown while the request is in flight. */
    loading: string;
    /** Shown when the surface loaded successfully with nothing to display. */
    empty: string;
    /** Optional supporting sentence for the empty state. */
    emptyDescription?: string;
    /** FR-2: shown when no authoritative source exists in this release. */
    unavailable?: string;
    /** Shown when retrieval failed. */
    error: string;
}

/** Standard "not in this release" message (PRD section 8.11). */
const NOT_IN_RELEASE = "Ushbu bo'lim keyingi bosqichda taqdim etiladi";

/** Standard loading message. */
const LOADING = "Yuklanmoqda…";

/**
 * PRD section 8.11 copy table, verbatim.
 * Russian equivalents are added during localisation (D-20).
 */
export const SURFACE_COPY: Record<SurfaceId, SurfaceCopy> = {
    conversations: {
        loading: LOADING,
        empty: "Suhbatlar yo'q",
        error: "Suhbatlarni yuklab bo'lmadi",
    },
    channels: {
        loading: LOADING,
        empty: "Kanallar yo'q",
        emptyDescription: "Siz hali birorta rasmiy kanalga qo'shilmagansiz.",
        error: "Kanallarni yuklab bo'lmadi",
    },
    groups: {
        loading: LOADING,
        empty: "Guruhlar yo'q",
        emptyDescription: "Siz hali birorta ishchi guruhga qo'shilmagansiz.",
        error: "Guruhlarni yuklab bo'lmadi",
    },
    directChats: {
        loading: LOADING,
        empty: "Shaxsiy suhbatlar yo'q",
        error: "Suhbatlarni yuklab bo'lmadi",
    },
    timeline: {
        loading: "Xabarlar yuklanmoqda…",
        empty: "Hali xabarlar yo'q",
        error: "Xabarlarni yuklab bo'lmadi",
    },
    search: {
        loading: "Qidirilmoqda…",
        empty: "Natija topilmadi",
        error: "Qidiruvni yakunlab bo'lmadi",
    },
    members: {
        loading: LOADING,
        empty: "Xodimlar yo'q",
        unavailable: NOT_IN_RELEASE,
        error: "Xodimlar ro'yxatini yuklab bo'lmadi",
    },
    documents: {
        loading: LOADING,
        empty: "Hujjatlar yo'q",
        unavailable: NOT_IN_RELEASE,
        error: "Hujjatlarni yuklab bo'lmadi",
    },
    notifications: {
        loading: LOADING,
        empty: "Bildirishnomalar yo'q",
        error: "Bildirishnomalarni yuklab bo'lmadi",
    },
    organisation: {
        loading: LOADING,
        empty: "Bo'limlar yo'q",
        error: "Tuzilmani yuklab bo'lmadi",
    },
    pinned: {
        loading: LOADING,
        empty: "Mahkamlangan xabarlar yo'q",
        unavailable: NOT_IN_RELEASE,
        error: "Yuklab bo'lmadi",
    },
    favourites: {
        loading: LOADING,
        empty: "Sevimlilar yo'q",
        unavailable: NOT_IN_RELEASE,
        error: "Yuklab bo'lmadi",
    },
    conversationFiles: {
        loading: LOADING,
        empty: "Fayllar yo'q",
        error: "Fayllarni yuklab bo'lmadi",
    },
    profile: {
        loading: LOADING,
        empty: "Ma'lumot yo'q",
        error: "Profilni yuklab bo'lmadi",
    },

    /*
     * Work modules with no authoritative data source in Sprint 3 (FR-2).
     * These present the unavailable state in Production Mode and full
     * demonstration data in Demo Mode (ADR-004).
     */
    tasks: { loading: LOADING, empty: "Vazifalar yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    calendar: { loading: LOADING, empty: "Tadbirlar yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    dashboard: { loading: LOADING, empty: "Ma'lumot yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    cases: { loading: LOADING, empty: "Ishlar yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    suspects: { loading: LOADING, empty: "Gumonlanuvchilar yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    evidence: { loading: LOADING, empty: "Dalillar yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    records: { loading: LOADING, empty: "Bayonnomalar yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
    courtMaterials: { loading: LOADING, empty: "Sud materiallari yo'q", unavailable: NOT_IN_RELEASE, error: "Yuklab bo'lmadi" },
};

/** Retry action label (ES-5). */
export const RETRY_LABEL = "Qayta urinish";
