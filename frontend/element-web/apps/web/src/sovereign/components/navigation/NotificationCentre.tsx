/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * NotificationCentre.tsx — CMP-42 Notification Centre
 *
 * NT-3: recent mentions, direct messages, and official channel activity in
 * reverse chronological order, each navigable to its source.
 * NT-4: individual and wholesale marking as read.
 * NT-7: the audible alert, off until the user turns it on.
 * NT-9: an urgent official message is elevated, and says so in words.
 * NT-10: the centre overlays the supporting side of the frame, so it covers
 * neither the composer nor the message being read.
 *
 * A11Y-3: focus moves into the panel on open, is held while it is open, and
 * returns to whatever opened it on close — the same contract as search.
 */

import React, { memo, type JSX } from "react";

import { EmptyState, Icon, IconButton, Button } from "../ui";
import { NOTIFICATION_COPY, NOTIFICATION_KIND_LABEL } from "../../config/notificationCopy";
import { useNotificationActions, useNotificationFeed } from "../../hooks/useNotifications";
import { useFramePreferences } from "../../hooks/useFramePreferences";
import { useDialog } from "../../hooks/useDialog";
import { formatAbsoluteTime, formatRelativeTime } from "../../config/timeCopy";
import type { NotificationEntry } from "../../types/notification";
import "./navigation.css";

interface Props {
    onClose: () => void;
    /** NT-3: each entry is navigable to the message that produced it. */
    onOpenEntry: (conversationId: string, eventId: string) => void;
}

export const NotificationCentre = memo(function NotificationCentre({
    onClose,
    onOpenEntry,
}: Props): JSX.Element {
    const { data: entries, state } = useNotificationFeed();
    const { markRead, markAllRead } = useNotificationActions();
    const { preferences, update } = useFramePreferences();

    // A11Y-3 / CMP-47: focus enters, stays, and is put back on close.
    const { ref: panel } = useDialog<HTMLDivElement>(onClose);

    const open = (entry: NotificationEntry): void => {
        onOpenEntry(entry.conversationId, entry.id);
        // Opening the source is reading it: the entry, the unread count, and
        // the conversation list clear together (NT-4).
        markRead(entry);
        onClose();
    };

    return (
        <div
            ref={panel}
            className="svr-notifications"
            role="dialog"
            aria-modal="true"
            aria-label={NOTIFICATION_COPY.centreTitle}
        >
            <div className="svr-notifications__bar">
                <h2 className="svr-notifications__title">{NOTIFICATION_COPY.centreTitle}</h2>

                {entries.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={markAllRead}>
                        {NOTIFICATION_COPY.markAllRead}
                    </Button>
                )}

                <IconButton
                    icon="close"
                    label={NOTIFICATION_COPY.close}
                    variant="ghost"
                    onClick={onClose}
                />
            </div>

            {/* NT-7: the alert is a setting of the centre, off by default. */}
            <label className="svr-notifications__sound">
                <input
                    type="checkbox"
                    checked={preferences.notificationSound}
                    onChange={(event) => update({ notificationSound: event.target.checked })}
                />
                <span>
                    <span className="svr-notifications__sound-label">{NOTIFICATION_COPY.soundLabel}</span>
                    <span className="svr-notifications__sound-hint">
                        {NOTIFICATION_COPY.soundDescription}
                    </span>
                </span>
            </label>

            <div className="svr-notifications__list-region">
                {/* ES-1 / FR-1: Demo Mode holds no notification state of its own. */}
                {state === "unavailable" && (
                    <div className="svr-module-state">
                        <EmptyState
                            variant="unavailable"
                            icon="bell-off"
                            title={NOTIFICATION_COPY.unavailableTitle}
                            description={NOTIFICATION_COPY.unavailableBody}
                        />
                    </div>
                )}

                {/* ES-2: nothing waiting is not the same as not available. */}
                {state === "empty" && (
                    <div className="svr-module-state">
                        <EmptyState
                            variant="empty"
                            icon="bell"
                            title={NOTIFICATION_COPY.emptyTitle}
                            description={NOTIFICATION_COPY.emptyBody}
                        />
                    </div>
                )}

                {entries.length > 0 && (
                    <ul className="svr-notifications__list">
                        {entries.map((entry) => (
                            <li key={entry.id} className="svr-notifications__item">
                                <button
                                    type="button"
                                    className={`svr-notifications__entry${entry.isUrgent ? " is-urgent" : ""}`}
                                    onClick={() => open(entry)}
                                >
                                    <span className="svr-notifications__entry-line">
                                        <Icon
                                            name={entry.kind === "mention" ? "person" : "message"}
                                            size="sm"
                                            className="svr-notifications__entry-icon"
                                        />
                                        <span className="svr-notifications__entry-name">
                                            {entry.conversationName}
                                        </span>

                                        {/* A11Y-5: the kind is stated, not coloured. */}
                                        <span className="svr-notifications__entry-kind">
                                            {NOTIFICATION_KIND_LABEL[entry.kind]}
                                        </span>

                                        {entry.isUrgent && (
                                            <span className="svr-conversation-item__urgent">
                                                {NOTIFICATION_COPY.urgentLabel}
                                            </span>
                                        )}

                                        {entry.sentAt > 0 && (
                                            <time
                                                className="svr-notifications__entry-time"
                                                dateTime={new Date(entry.sentAt).toISOString()}
                                                title={formatAbsoluteTime(entry.sentAt)}
                                            >
                                                {formatRelativeTime(entry.sentAt)}
                                            </time>
                                        )}
                                    </span>

                                    {/* SR-4 in spirit: enough to identify without opening. */}
                                    <span className="svr-notifications__entry-body">
                                        {`${entry.senderName}: ${entry.body}`}
                                    </span>
                                </button>

                                {/* NT-4: dismissed without leaving the centre. */}
                                <IconButton
                                    icon="check"
                                    label={NOTIFICATION_COPY.markRead}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => markRead(entry)}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
});
