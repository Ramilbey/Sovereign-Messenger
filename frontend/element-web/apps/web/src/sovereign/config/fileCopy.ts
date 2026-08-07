/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * fileCopy.ts — Attachment Copy and Size Formatting
 *
 * NFR-4: no attachment text is embedded in a component.
 * SUX-1 / NFR-8: no protocol terminology, error code, or internal identifier
 * appears in any string below.
 */

import { ERROR_CATALOGUE } from "./errorCatalogue";

/** Units as an Uzbek reader sees them. */
const UNITS = ["B", "KB", "MB", "GB"] as const;

/**
 * FR-24: a file's size, stated so a user can judge it against the limit.
 * Rounded to one decimal above kilobytes, which is the precision that helps.
 */
export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "";

    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < UNITS.length - 1) {
        value /= 1024;
        unit += 1;
    }

    const rounded = unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded} ${UNITS[unit]}`;
}

export const FILE_COPY = {
    /** CMP-37 drop zone. */
    dropHere: "Fayllarni shu yerga tashlang",
    dropRejected: "Bu turdagi fayllarni qabul qilib bo'lmaydi",

    /** FR-23 attachment entry points. */
    attach: "Fayl biriktirish",
    attachedLabel: "Biriktirilgan fayllar",

    /** FR-24 pre-send review. */
    remove: "Olib tashlash",

    /** FR-25 / ST-12 transfer. */
    uploading: "Yuborilmoqda",
    cancel: "Bekor qilish",
    cancelled: "Bekor qilindi",
    /** FR-30 / ST-14: recoverable without re-selecting the file. */
    retry: "Qayta urinish",
    queued: "Navbatda",
    completed: "Yuborildi",

    /** FR-27 download. */
    download: "Yuklab olish",
    openImage: "Rasmni to'liq ochish",
    closeViewer: "Yopish",

    /** EDGE-8: the file a message referred to no longer exists. */
    unavailable: ERROR_CATALOGUE.attachmentUnavailable.title,
    unavailableReason: "Fayl o'chirilgan yoki mavjud emas.",

    /** ERR-3: the download itself failed. */
    downloadFailed: ERROR_CATALOGUE.downloadFailed.title,
    /** EDGE-4 / CMP-35: the image could not be displayed. */
    imageFailed: "Rasmni ko'rsatib bo'lmadi",

    /*
     * FR-28 / FR-29 / SUX-11: a refusal states the reason AND the applicable
     * limit, so the user knows what would be accepted rather than only that
     * this was not.
     */
    tooLarge: (limit: string): string => `Fayl juda katta. Ruxsat etilgan hajm: ${limit}`,
    unsupportedType: (types: string): string =>
        `Bu turdagi fayllarni yuborib bo'lmaydi. Ruxsat etilgan turlar: ${types}`,

    /** A11Y-8: the sender's own description of an image. */
    describeLabel: "Rasm tavsifi",
    describePlaceholder: "Rasmda nima aks etgan? (ixtiyoriy)",
} as const;
