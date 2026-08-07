/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * ProfilePanel.tsx — CMP-13 Person Profile
 *
 * PR-1: full name, official role, department, organisational position,
 * presence, and last seen.
 * PR-3: start a direct conversation, view shared conversations, view shared
 * files.
 * PR-4 / PR-5: the user may change their own display name, avatar, status
 * message, and availability; organisation-governed fields are read-only.
 * PR-8: the account's own sessions, listed without actions.
 * PR-9 / AC-15: this is the only profile presentation. Every surface opens
 * this component, so what a reader sees cannot depend on where they came from.
 *
 * A11Y-3: focus moves into the panel on open, is held while it is open, and
 * returns to whatever opened it on close — the same contract as search and the
 * notification centre.
 */

import React, { memo, useState, type JSX } from "react";

import { Avatar, Button, EmptyState, ErrorState, IconButton, PresenceBadge, Spinner } from "../ui";
import { PROFILE_COPY } from "../../config/profileCopy";
import { PRESENCE_COPY } from "../../config/presenceCopy";
import { RETRY_LABEL } from "../../config/stateCopy";
import { formatAbsoluteTime } from "../../config/timeCopy";
import { useProfile, useProfileEditing, useSessions, useStartDirectConversation } from "../../hooks/useProfile";
import { useDialog } from "../../hooks/useDialog";
import { useManualPresence } from "../../hooks/usePresence";
import { MatrixFileService } from "../../services/MatrixFileService";
import { SELECTABLE_PRESENCE } from "../../types/presence";
import "./profile.css";

interface Props {
    userId: string;
    onClose: () => void;
    /** PR-3: opens a conversation, positioned at a file where given. */
    onOpenConversation: (conversationId: string, eventId?: string) => void;
}

export const ProfilePanel = memo(function ProfilePanel({
    userId,
    onClose,
    onOpenConversation,
}: Props): JSX.Element {
    const { data, state } = useProfile(userId);
    const profile = data.profile;

    const editing = useProfileEditing();
    const startDirect = useStartDirectConversation();
    const { manual, setManual } = useManualPresence();
    const sessions = useSessions(profile?.isSelf === true);

    // A11Y-3 / CMP-47: focus enters, stays, and is put back on close.
    const { ref: panel } = useDialog<HTMLDivElement>(onClose);

    /** PR-4: what the user has typed but not yet saved. */
    const [draftName, setDraftName] = useState<string | null>(null);
    const [draftStatus, setDraftStatus] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const openDirect = async (): Promise<void> => {
        try {
            const conversationId = await startDirect(userId);
            if (!conversationId) {
                setNotice(PROFILE_COPY.startDirectFailed);
                return;
            }
            onOpenConversation(conversationId);
            onClose();
        } catch {
            // ERR-*: stated in plain language, with the action still available.
            setNotice(PROFILE_COPY.startDirectFailed);
        }
    };

    const save = async (action: Promise<void>, failure: string): Promise<void> => {
        try {
            await action;
            setNotice(PROFILE_COPY.saved);
        } catch {
            setNotice(failure);
        }
    };

    const chooseAvatar = async (file: File | undefined): Promise<void> => {
        if (!file) return;

        try {
            const contentUri = await MatrixFileService.getInstance().upload(file, () => undefined)
                .promise;
            if (!contentUri) return;
            await save(editing.setAvatar(contentUri), PROFILE_COPY.avatarFailed);
        } catch {
            setNotice(PROFILE_COPY.avatarFailed);
        }
    };

    return (
        <div
            ref={panel}
            className="svr-profile"
            role="dialog"
            aria-modal="true"
            aria-label={PROFILE_COPY.title}
        >
            <div className="svr-profile__bar">
                <h2 className="svr-profile__title">
                    {profile?.isSelf ? PROFILE_COPY.editTitle : PROFILE_COPY.title}
                </h2>
                <IconButton icon="close" label={PROFILE_COPY.close} variant="ghost" onClick={onClose} />
            </div>

            {/* ES-1 / FR-1: a person the platform holds nothing about. */}
            {state !== "ready" || !profile ? (
                <div className="svr-module-state">
                    <EmptyState
                        variant="unavailable"
                        icon="person"
                        title={PROFILE_COPY.unavailableTitle}
                        description={PROFILE_COPY.unavailableBody}
                    />
                </div>
            ) : (
                <div className="svr-profile__body">
                    <section className="svr-profile__identity">
                        {/* PR-6: image where one exists, initials otherwise. */}
                        <Avatar
                            name={profile.displayName}
                            id={profile.userId}
                            src={
                                profile.avatarUrl
                                    ? (MatrixFileService.getInstance().resolveUrl(profile.avatarUrl) ??
                                      undefined)
                                    : undefined
                            }
                            size="lg"
                        />

                        <div className="svr-profile__identity-text">
                            <p className="svr-profile__name">{profile.displayName}</p>

                            {/* PR-1 / FR-13: availability wherever a person appears. */}
                            <PresenceBadge state={profile.presence.state} showLabel />

                            {/* FR-14: last seen, where the platform reports it. */}
                            {profile.presence.lastActiveAt !== null && (
                                <p className="svr-profile__meta">
                                    {`${PROFILE_COPY.lastSeen}: ${formatAbsoluteTime(profile.presence.lastActiveAt)}`}
                                </p>
                            )}

                            {profile.statusMessage && (
                                <p className="svr-profile__meta">{profile.statusMessage}</p>
                            )}
                        </div>
                    </section>

                    {/* PR-1 / PR-5: organisation-governed, and read-only. */}
                    <section className="svr-profile__section">
                        <dl className="svr-profile__fields">
                            {(
                                [
                                    [PROFILE_COPY.role, profile.role],
                                    [PROFILE_COPY.department, profile.department],
                                    [PROFILE_COPY.position, profile.position],
                                ] as const
                            ).map(([label, value]) => (
                                <div key={label} className="svr-profile__field">
                                    <dt className="svr-profile__field-label">{label}</dt>
                                    {/* AS-1: absent rather than invented. */}
                                    <dd className="svr-profile__field-value">
                                        {value ?? PROFILE_COPY.unknownField}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        <p className="svr-profile__note">{PROFILE_COPY.governedNote}</p>
                    </section>

                    {/* PR-4: what the user may change about themselves. */}
                    {profile.isSelf ? (
                        <section className="svr-profile__section">
                            <label className="svr-profile__control">
                                <span className="svr-profile__control-label">
                                    {PROFILE_COPY.displayName}
                                </span>
                                <input
                                    type="text"
                                    className="svr-profile__input"
                                    value={draftName ?? profile.displayName}
                                    onChange={(event) => setDraftName(event.target.value)}
                                />
                            </label>

                            <label className="svr-profile__control">
                                <span className="svr-profile__control-label">
                                    {PROFILE_COPY.statusMessage}
                                </span>
                                <input
                                    type="text"
                                    className="svr-profile__input"
                                    value={draftStatus ?? profile.statusMessage ?? ""}
                                    onChange={(event) => setDraftStatus(event.target.value)}
                                />
                            </label>

                            <label className="svr-profile__control">
                                <span className="svr-profile__control-label">{PROFILE_COPY.avatar}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    aria-label={PROFILE_COPY.avatarChange}
                                    onChange={(event) => void chooseAvatar(event.target.files?.[0])}
                                />
                            </label>

                            {/* FR-15 / ST-8: availability set by hand, until cleared. */}
                            <fieldset className="svr-profile__choice">
                                <legend className="svr-profile__control-label">
                                    {PROFILE_COPY.availability}
                                </legend>

                                <label className="svr-profile__choice-option">
                                    <input
                                        type="radio"
                                        name="svr-availability"
                                        checked={manual === null}
                                        onChange={() => setManual(null)}
                                    />
                                    <span>{PROFILE_COPY.availabilityAuto}</span>
                                </label>

                                {SELECTABLE_PRESENCE.map((option) => (
                                    <label key={option} className="svr-profile__choice-option">
                                        <input
                                            type="radio"
                                            name="svr-availability"
                                            checked={manual === option}
                                            onChange={() => setManual(option)}
                                        />
                                        <span>{PRESENCE_COPY.state[option]}</span>
                                    </label>
                                ))}
                            </fieldset>

                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                    void save(
                                        Promise.all([
                                            draftName !== null
                                                ? editing.setDisplayName(draftName)
                                                : Promise.resolve(),
                                            draftStatus !== null
                                                ? editing.setStatusMessage(draftStatus)
                                                : Promise.resolve(),
                                        ]).then(() => undefined),
                                        PROFILE_COPY.saveFailed,
                                    )
                                }
                            >
                                {PROFILE_COPY.save}
                            </Button>
                        </section>
                    ) : (
                        /* PR-3: the actions a profile offers about someone else. */
                        <section className="svr-profile__section">
                            <Button variant="primary" size="sm" onClick={() => void openDirect()}>
                                {PROFILE_COPY.startDirect}
                            </Button>
                        </section>
                    )}

                    {/* A11Y-11: the outcome of an action, announced where it happened. */}
                    {notice && (
                        <p className="svr-profile__notice" role="status" aria-live="polite">
                            {notice}
                        </p>
                    )}

                    {/* PR-3: what the reader shares with this person. */}
                    {!profile.isSelf && (
                        <>
                            <section className="svr-profile__section">
                                <h3 className="svr-profile__heading">
                                    {PROFILE_COPY.sharedConversations}
                                </h3>

                                {data.sharedConversations.length === 0 ? (
                                    <p className="svr-profile__empty">
                                        {PROFILE_COPY.noSharedConversations}
                                    </p>
                                ) : (
                                    <ul className="svr-profile__list">
                                        {data.sharedConversations.map((conversation) => (
                                            <li key={conversation.id}>
                                                <button
                                                    type="button"
                                                    className="svr-profile__link"
                                                    onClick={() => {
                                                        onOpenConversation(conversation.id);
                                                        onClose();
                                                    }}
                                                >
                                                    {conversation.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>

                            <section className="svr-profile__section">
                                <h3 className="svr-profile__heading">{PROFILE_COPY.sharedFiles}</h3>

                                {data.sharedFiles.length === 0 ? (
                                    <p className="svr-profile__empty">{PROFILE_COPY.noSharedFiles}</p>
                                ) : (
                                    <ul className="svr-profile__list">
                                        {data.sharedFiles.map((file) => (
                                            <li key={file.id}>
                                                <button
                                                    type="button"
                                                    className="svr-profile__link"
                                                    onClick={() => {
                                                        onOpenConversation(
                                                            file.conversationId,
                                                            file.eventId,
                                                        );
                                                        onClose();
                                                    }}
                                                >
                                                    {file.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </>
                    )}

                    {/* PR-8: the account's own sessions. Read-only, and says so. */}
                    {profile.isSelf && (
                        <section className="svr-profile__section">
                            <h3 className="svr-profile__heading">{PROFILE_COPY.sessions}</h3>

                            {sessions.state === "loading" && (
                                <div className="svr-module-state" aria-busy="true">
                                    <Spinner size="sm" />
                                </div>
                            )}

                            {sessions.state === "error" && (
                                <ErrorState
                                    title={PROFILE_COPY.sessionsUnavailable}
                                    retryLabel={RETRY_LABEL}
                                />
                            )}

                            {sessions.data.length > 0 && (
                                <ul className="svr-profile__list">
                                    {sessions.data.map((device) => (
                                        <li key={device.id} className="svr-profile__session">
                                            <span>{device.displayName ?? PROFILE_COPY.unnamedSession}</span>
                                            {device.isCurrent && (
                                                <span className="svr-profile__session-current">
                                                    {PROFILE_COPY.sessionCurrent}
                                                </span>
                                            )}
                                            {device.lastSeenAt !== null && (
                                                <time
                                                    dateTime={new Date(device.lastSeenAt).toISOString()}
                                                    className="svr-profile__meta"
                                                >
                                                    {formatAbsoluteTime(device.lastSeenAt)}
                                                </time>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className="svr-profile__note">{PROFILE_COPY.sessionsReadOnly}</p>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
});
