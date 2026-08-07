/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * NotificationLevelControl.tsx — CMP-20 Per-Conversation Notification Setting
 *
 * NT-5 / FR-52: all messages, mentions only, or none — set per conversation.
 *
 * A native select rather than a bespoke menu: it is operable by keyboard and
 * by screen reader on every supported browser without a single line of focus
 * management (A11Y-1, A11Y-3), and this control has no behaviour a menu would
 * add. The choice is written to the platform, so it holds in every tab and on
 * every device (NT-8).
 */

import React, { memo, useId, type JSX } from "react";

import { Icon } from "../ui";
import { useNotificationLevel } from "../../hooks/useNotifications";
import {
    NOTIFICATION_COPY,
    NOTIFICATION_LEVEL_DESCRIPTION,
    NOTIFICATION_LEVEL_LABEL,
} from "../../config/notificationCopy";
import { NOTIFICATION_LEVELS, type NotificationLevel } from "../../types/notification";

interface Props {
    conversationId: string;
    /** The conversation's name, so the control names what it governs (A11Y-6). */
    conversationName: string;
}

export const NotificationLevelControl = memo(function NotificationLevelControl({
    conversationId,
    conversationName,
}: Props): JSX.Element {
    const { level, setLevel, failed, pending } = useNotificationLevel(conversationId);
    const describedBy = useId();

    return (
        <div className="svr-notification-level">
            <Icon
                name={level === "none" ? "bell-off" : "bell"}
                size="sm"
                className="svr-notification-level__icon"
            />

            <select
                className="svr-notification-level__select"
                aria-label={NOTIFICATION_COPY.levelFor(conversationName)}
                aria-describedby={describedBy}
                value={level}
                disabled={pending}
                onChange={(event) => setLevel(event.target.value as NotificationLevel)}
            >
                {NOTIFICATION_LEVELS.map((option) => (
                    <option key={option} value={option}>
                        {NOTIFICATION_LEVEL_LABEL[option]}
                    </option>
                ))}
            </select>

            {/*
             * A11Y-11: what the current choice means, associated with the
             * control rather than sitting beside it unattached. ERR-*: a
             * refused change says so here rather than silently reverting.
             */}
            <span id={describedBy} className="svr-visually-hidden" role={failed ? "alert" : undefined}>
                {failed ? NOTIFICATION_COPY.levelUnavailable : NOTIFICATION_LEVEL_DESCRIPTION[level]}
            </span>
        </div>
    );
});
