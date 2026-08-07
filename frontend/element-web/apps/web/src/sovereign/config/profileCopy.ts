/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * profileCopy.ts — Profile Copy
 *
 * NFR-4: every string the profile presents lives here.
 * SUX-1 / NFR-8: no protocol terminology, error code, or internal identifier.
 */

export const PROFILE_COPY = {
    title: "Profil",
    close: "Yopish",
    open: (name: string): string => `${name} profilini ochish`,

    /** PR-1 / PR-5: organisation-governed fields, shown as read-only. */
    role: "Lavozim",
    department: "Bo'lim",
    position: "Tashkiliy o'rin",
    lastSeen: "Oxirgi faollik",
    statusMessage: "Holat",
    /** AS-1: absent rather than invented. */
    unknownField: "Ma'lumot yo'q",
    governedNote: "Bu ma'lumotlar tashkilot tomonidan belgilanadi",

    /** PR-3: what a profile lets the reader do. */
    startDirect: "Shaxsiy suhbat boshlash",
    sharedConversations: "Umumiy suhbatlar",
    sharedFiles: "Umumiy fayllar",
    noSharedConversations: "Umumiy suhbat yo'q",
    noSharedFiles: "Umumiy fayl yo'q",
    startDirectFailed: "Shaxsiy suhbatni ochib bo'lmadi. Qaytadan urinib ko'ring.",

    /** PR-4: what the user may change about themselves. */
    editTitle: "Profilingiz",
    displayName: "Ismingiz",
    save: "Saqlash",
    saved: "Saqlandi",
    saveFailed: "O'zgarishni saqlab bo'lmadi. Qaytadan urinib ko'ring.",
    availability: "Holatingiz",
    availabilityAuto: "Avtomatik",
    avatar: "Rasm",
    avatarChange: "Rasmni o'zgartirish",
    avatarFailed: "Rasmni yuklab bo'lmadi. Qaytadan urinib ko'ring.",

    /** PR-8: the account's own sessions, listed without actions. */
    sessions: "Faol seanslar",
    sessionCurrent: "Joriy seans",
    sessionsUnavailable: "Seanslar ro'yxatini hozir olib bo'lmadi",
    sessionsReadOnly: "Seanslarni boshqarish keyingi bosqichda taqdim etiladi",
    unnamedSession: "Nomsiz qurilma",

    /** ES-1: the profile carries the same states as any other surface. */
    unavailableTitle: "Profil mavjud emas",
    unavailableBody: "Bu foydalanuvchi haqida ma'lumot topilmadi.",
} as const;
