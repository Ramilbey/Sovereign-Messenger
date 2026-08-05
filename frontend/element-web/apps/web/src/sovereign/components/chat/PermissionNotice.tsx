/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * PermissionNotice.tsx — CMP-29 Permission Notice
 *
 * FR-43 / COM-3: where a user may not post, the interface explains the rule in
 * a single neutral sentence, in place of the composer.
 *
 * UX-8: permission is communicated by absence rather than by a disabled
 * control — there is no greyed-out composer to click at. The sentence exists
 * because absence alone would be confusing here.
 *
 * The tone is deliberately non-punitive: the rule is stated, not the user's
 * lack of standing.
 */

import React, { memo, type JSX } from "react";

import { Icon } from "../ui";

interface PermissionNoticeProps {
    /** One neutral sentence explaining the rule (COM-3). */
    message: string;
}

export const PermissionNotice = memo(function PermissionNotice({
    message,
}: PermissionNoticeProps): JSX.Element {
    return (
        <div className="svr-permission-notice" role="note">
            <Icon name="info" size="sm" className="svr-permission-notice__icon" />
            <p className="svr-permission-notice__text">{message}</p>
        </div>
    );
});
