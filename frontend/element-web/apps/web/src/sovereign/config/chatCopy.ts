/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * chatCopy.ts — Conversation Surface Copy
 *
 * NFR-4: no user-facing text is hardcoded in the conversation components.
 * SUX-1 / NFR-8: no protocol terminology, error code, or internal identifier
 * appears in any string below — including the explanation for a message that
 * cannot be displayed, which must avoid cryptographic vocabulary (SUX-12).
 */

export const CHAT_COPY = {
    /** CMP-30 conversation header. */
    headerLabel: "Suhbat ma'lumoti",
    participants: (count: number): string => `${count} ishtirokchi`,
    noConversation: "Suhbat tanlanmagan",
    noConversationDescription: "Chapdagi ro'yxatdan suhbatni tanlang.",

    /** CMP-28 composer. */
    composerPlaceholder: "Xabar yozing…",
    composerLabel: "Xabar matni",
    send: "Yuborish",
    /** FR-39: the send action and the newline action, stated to the user. */
    sendHint: "Yuborish uchun Enter, yangi qator uchun Shift+Enter",

    /** CMP-29 permission notice (COM-3, FR-43 — one neutral sentence). */
    readOnlyChannel: "Ushbu rasmiy kanalda xabarlarni faqat rahbarlar yuboradi.",
    readOnlyConversation: "Ushbu suhbatda xabar yuborish imkoni yo'q.",

    /** SUX-9: a change of posting rights, explained at the point of effect. */
    postingGranted: "Endi ushbu suhbatda xabar yuborishingiz mumkin.",
    postingRevoked: "Ushbu suhbatda xabar yuborish imkoni olib tashlandi. Yozgan matningiz saqlanib qoldi.",

    /** CMP-23 unavailable message (FR-35, SUX-12, ERR-14). */
    messageUnavailable: "Xabarni ko'rsatib bo'lmadi",
    messageUnavailableReason: "Bu xabar ushbu qurilmada mavjud emas.",

    /** COM-5 delivery states, so no state rests on a tick shape alone. */
    stateQueued: "Navbatda",
    stateSending: "Yuborilmoqda",
    stateSent: "Yuborildi",
    stateDelivered: "Yetkazildi",
    stateRead: "O'qildi",
    stateFailed: "Yuborilmadi",

    /** FR-37 / CMP-27: the read boundary the reader left behind. */
    unreadDivider: "Yangi xabarlar",
    /** FR-36 / UX-6: an earlier page is on its way. */
    loadingEarlier: "Oldingi xabarlar yuklanmoqda…",

    /** Timeline affordances. */
    newMessages: "Yangi xabarlar",
    scrollToLatest: "Oxirgi xabarlarga o'tish",
} as const;

/** CMP-26 typing indicator (FR-7). */
export const TYPING_COPY = {
    single: (name: string): string => `${name} yozmoqda…`,
    multiple: (count: number): string => `${count} kishi yozmoqda…`,
} as const;

/** CMP-12 conversation participants (FR-45, COM-4). */
export const MEMBER_COPY = {
    listLabel: "Ishtirokchilar",
    invited: "Taklif qilingan",
    departed: "Suhbatni tark etgan",
    readOnly: "Faqat o'qiy oladi",
} as const;

/** CMP-31 acknowledgement summary (FR-19, FR-20, GW-2, GW-3). */
export const ACKNOWLEDGEMENT_COPY = {
    title: "Tanishib chiqilganlik",
    readOf: (read: number, total: number): string => `${total} tadan ${read} ta xodim o'qidi`,
    pending: "Hali o'qimaganlar",
    allRead: "Barcha xodimlar o'qib chiqdi",
    open: "Kim o'qiganini ko'rish",
    close: "Yopish",
    /*
     * R-2: what the figure counts. Stated because a department head may report
     * it upward, and a number whose meaning is ambiguous is worse than none.
     */
    semantic: {
        "read-position": "Xodim ushbu xabarga yetib borgani hisobga olinadi.",
        explicit: "Xodim tanishganini alohida tasdiqlagani hisobga olinadi.",
    },
} as const;
