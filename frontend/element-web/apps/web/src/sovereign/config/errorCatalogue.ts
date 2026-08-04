/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * errorCatalogue.ts — User-Visible Error Catalogue
 *
 * Implements PRD Appendix B (ERR-1 … ERR-20).
 *
 * Every user-visible error in the product is declared here, so that:
 *   - NFR-8 / SUX-1: no protocol terminology, error code, or internal
 *     identifier can reach a user-facing string
 *   - UX-7: every message states what happened and what to do next
 *   - ERR-19: every error offers a retry, a navigation action, or an explicit
 *     statement that no action is available — the type system enforces this by
 *     requiring `recovery` on every entry
 *   - QA can verify AC-32 against a single authoritative table
 */

/** What the user can do next. ERR-19 requires one of these on every error. */
export type ErrorRecovery =
    /** ES-5: the operation can be attempted again. */
    | { kind: "retry"; label: string }
    /** The user should move elsewhere. */
    | { kind: "navigate"; label: string }
    /** No action is available; say so rather than leaving a dead end. */
    | { kind: "none"; reason: string };

export interface CatalogueEntry {
    /** Appendix B identifier. */
    id: string;
    /** Plain-Uzbek statement of what happened. */
    title: string;
    /** Optional supporting sentence. */
    description?: string;
    recovery: ErrorRecovery;
}

const RETRY: ErrorRecovery = { kind: "retry", label: "Qayta urinish" };

/** PRD Appendix B, verbatim. Russian equivalents follow during localisation. */
export const ERROR_CATALOGUE = {
    /** ERR-1 — a composed message could not be delivered. */
    messageSendFailed: {
        id: "ERR-1",
        title: "Xabar yuborilmadi",
        description: "Xabarni qayta yuborishingiz yoki o'chirishingiz mumkin.",
        recovery: RETRY,
    },
    /** ERR-2 — file transfer did not complete. */
    uploadFailed: {
        id: "ERR-2",
        title: "Faylni yuklab bo'lmadi",
        recovery: RETRY,
    },
    /** ERR-3 — a file could not be retrieved. */
    downloadFailed: {
        id: "ERR-3",
        title: "Faylni yuklab olishda xatolik",
        recovery: RETRY,
    },
    /** ERR-4 — selected file type is not permitted. */
    unsupportedFileType: {
        id: "ERR-4",
        title: "Bu turdagi fayllarni yuborib bo'lmaydi",
        recovery: { kind: "none", reason: "Boshqa turdagi fayl tanlang." },
    },
    /** ERR-5 — file exceeds the configured limit. */
    fileTooLarge: {
        id: "ERR-5",
        title: "Fayl juda katta",
        recovery: { kind: "none", reason: "Kichikroq fayl tanlang." },
    },
    /** ERR-6 — local storage cannot accept more data. */
    storageFull: {
        id: "ERR-6",
        title: "Qurilmada joy yetarli emas",
        description: "Joy bo'shatib, qayta urinib ko'ring.",
        recovery: RETRY,
    },
    /** ERR-7 — search did not return within the time budget. */
    searchTimeout: {
        id: "ERR-7",
        title: "Qidiruvni yakunlab bo'lmadi",
        description: "So'rovni aniqroq qilib qayta urinib ko'ring.",
        recovery: RETRY,
    },
    /** ERR-8 — the user is not authorised for the action. */
    permissionDenied: {
        id: "ERR-8",
        title: "Sizda bu amalni bajarish huquqi yo'q",
        recovery: { kind: "none", reason: "Ruxsat uchun bo'lim rahbariga murojaat qiling." },
    },
    /** ERR-9 — the user is not authorised for the resource. SUX-10: no detail disclosed. */
    accessDenied: {
        id: "ERR-9",
        title: "Ushbu bo'limga ruxsat yo'q",
        recovery: { kind: "navigate", label: "Orqaga qaytish" },
    },
    /** ERR-10 — network connectivity is unavailable. */
    connectionLost: {
        id: "ERR-10",
        title: "Ulanish yo'qoldi",
        description: "Qayta ulanmoqda…",
        recovery: { kind: "none", reason: "Ulanish tiklanganda avtomatik davom etadi." },
    },
    /** ERR-11 — the system is reachable but not responding. SUX-7. */
    homeserverUnavailable: {
        id: "ERR-11",
        title: "Server bilan aloqa yo'q",
        description: "Muammo davom etsa, texnik yordamga murojaat qiling.",
        recovery: RETRY,
    },
    /** ERR-12 — too many actions in a short period. SUX-13. */
    rateLimited: {
        id: "ERR-12",
        title: "Juda tez-tez urinildi",
        description: "Biroz kutib, qayta urinib ko'ring.",
        recovery: RETRY,
    },
    /** ERR-13 — the working session is no longer valid. SUX-2. */
    sessionExpired: {
        id: "ERR-13",
        title: "Sessiya muddati tugadi",
        description: "Yozilgan matn saqlanadi.",
        recovery: { kind: "navigate", label: "Qaytadan kirish" },
    },
    /** ERR-14 — a message cannot be displayed. FR-35, SUX-12. */
    messageUnavailable: {
        id: "ERR-14",
        title: "Xabarni ko'rsatib bo'lmadi",
        recovery: { kind: "none", reason: "Bu xabar ushbu qurilmada mavjud emas." },
    },
    /** ERR-15 — a referenced file no longer exists. EDGE-8. */
    attachmentUnavailable: {
        id: "ERR-15",
        title: "Fayl mavjud emas",
        recovery: { kind: "none", reason: "Fayl o'chirilgan yoki mavjud emas." },
    },
    /** ERR-16 — the conversation can no longer be accessed. EDGE-7. */
    conversationUnavailable: {
        id: "ERR-16",
        title: "Suhbat mavjud emas",
        recovery: { kind: "navigate", label: "Suhbatlar ro'yxatiga qaytish" },
    },
    /** ERR-17 — a list or panel could not be populated. */
    contentLoadFailed: {
        id: "ERR-17",
        title: "Ma'lumotni yuklab bo'lmadi",
        recovery: RETRY,
    },
    /** ERR-18 — a general operation did not complete. */
    actionFailed: {
        id: "ERR-18",
        title: "Amalni bajarib bo'lmadi",
        recovery: RETRY,
    },
} as const satisfies Record<string, CatalogueEntry>;

export type ErrorKey = keyof typeof ERROR_CATALOGUE;

/** Resolve a catalogue entry by key. */
export function getError(key: ErrorKey): CatalogueEntry {
    return ERROR_CATALOGUE[key];
}
