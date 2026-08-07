/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * notificationCopy.ts — Notification Copy
 *
 * NFR-4: every string the notification surfaces present lives here, alongside
 * the navigation and state tables the earlier milestones established.
 *
 * SUX-1 / NFR-8: no protocol terminology, error code, or internal identifier
 * appears in any string below.
 */

import type { NotificationKind, NotificationLevel } from "../types/notification";

/** NT-5 / FR-52: the three settings, named as the user chooses between them. */
export const NOTIFICATION_LEVEL_LABEL: Record<NotificationLevel, string> = {
    all: "Barcha xabarlar",
    mentions: "Faqat murojaatlar",
    none: "O'chirilgan",
};

/** Why a user would choose each, in one line (SUX-1). */
export const NOTIFICATION_LEVEL_DESCRIPTION: Record<NotificationLevel, string> = {
    all: "Har bir yangi xabar haqida xabardor bo'lasiz",
    mentions: "Faqat sizga murojaat qilinganda xabardor bo'lasiz",
    none: "Bu suhbat haqida xabar berilmaydi",
};

/** NT-3: what brought an entry into the centre, stated rather than coloured. */
export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
    mention: "Sizga murojaat",
    direct: "Shaxsiy xabar",
    channel: "Rasmiy kanal",
};

export const NOTIFICATION_COPY = {
    /** NT-3: the centre itself. */
    centreTitle: "Bildirishnomalar",
    open: "Bildirishnomalarni ochish",
    close: "Yopish",

    /** A11Y-6: the control states what is waiting without relying on the badge. */
    openWith: (unread: number, mentions: number): string => {
        if (mentions > 0 && unread > 0) {
            return `Bildirishnomalar: ${mentions} ta murojaat, ${unread} ta o'qilmagan xabar`;
        }
        if (mentions > 0) return `Bildirishnomalar: ${mentions} ta murojaat`;
        if (unread > 0) return `Bildirishnomalar: ${unread} ta o'qilmagan xabar`;
        return "Bildirishnomalar: yangilik yo'q";
    },

    /** NT-4: marking read, individually and altogether. */
    markRead: "O'qilgan deb belgilash",
    markAllRead: "Barchasini o'qilgan deb belgilash",

    /** ES-1: the centre carries the same four states as any other surface. */
    emptyTitle: "Yangi bildirishnoma yo'q",
    emptyBody: "Sizga murojaat qilinganda yoki yangi xabar kelganda shu yerda ko'rinadi.",
    unavailableTitle: "Bildirishnomalar mavjud emas",
    unavailableBody: "Bildirishnomalar namoyish rejimida yuritilmaydi.",

    /** NT-9 / FR-53: an urgent official message, marked in words as well. */
    urgentLabel: "Shoshilinch",

    /** NT-7: the audible alert, off until the user turns it on. */
    soundLabel: "Ovozli ogohlantirish",
    soundDescription: "Murojaat va shaxsiy xabar kelganda qisqa signal beriladi",

    /** NT-5: where the per-conversation setting is chosen. */
    levelLabel: "Bildirishnoma darajasi",
    levelFor: (name: string): string => `${name} uchun bildirishnoma darajasi`,
    levelUnavailable: "Bildirishnoma darajasini hozir o'zgartirib bo'lmaydi",

    /** NT-1: aggregated totals, described for assistive technology (A11Y-5). */
    aggregateLabel: (unread: number, mentions: number): string => {
        if (mentions > 0 && unread > 0) return `${mentions} ta murojaat, ${unread} ta o'qilmagan xabar`;
        if (mentions > 0) return `${mentions} ta murojaat`;
        return `${unread} ta o'qilmagan xabar`;
    },
} as const;
