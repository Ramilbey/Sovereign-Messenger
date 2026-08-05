/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * timeCopy.ts — Time Presentation
 *
 * UX-14: time is displayed in the user's local time, with relative labels for
 * recent items and absolute values on hover or focus.
 * FR-33: date separators use relative labels where appropriate.
 * NFR-4: the labels are here rather than embedded in components.
 */

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const TIME_COPY = {
    justNow: "Hozir",
    today: "Bugun",
    yesterday: "Kecha",
    minutesAgo: (minutes: number): string => `${minutes} daqiqa oldin`,
} as const;

/** Start of the local day containing `timestamp`. */
function startOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

/** Local clock time, e.g. "14:05". */
export function formatClockTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/**
 * UX-14: a short relative label for recent activity, falling back to a date
 * once "when" matters more than "how long ago".
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
    const elapsed = now - timestamp;

    if (elapsed < MINUTE_MS) return TIME_COPY.justNow;
    if (elapsed < HOUR_MS) return TIME_COPY.minutesAgo(Math.floor(elapsed / MINUTE_MS));

    const dayStart = startOfDay(now);
    if (timestamp >= dayStart) return formatClockTime(timestamp);
    if (timestamp >= dayStart - DAY_MS) return TIME_COPY.yesterday;

    return new Date(timestamp).toLocaleDateString();
}

/** UX-14: the full local value, shown on hover and focus. */
export function formatAbsoluteTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
}

/** FR-33: day label for a timeline separator, relative where appropriate. */
export function formatDayLabel(timestamp: number, now: number = Date.now()): string {
    const dayStart = startOfDay(now);

    if (timestamp >= dayStart) return TIME_COPY.today;
    if (timestamp >= dayStart - DAY_MS) return TIME_COPY.yesterday;

    return new Date(timestamp).toLocaleDateString();
}
