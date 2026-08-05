/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * ConversationDirectoryView.tsx — Conversation Directory
 *
 * One surface for all three conversation types (IA-6). It replaces the
 * separate channel and group views, which each carried their own inline-styled
 * copy of the same list and could drift apart in appearance, ordering, and
 * state handling.
 *
 * ES-1: states come from the shared boundary via the conversation list, so
 * this surface cannot omit one or invent its own copy.
 */

import React, { memo, useMemo, type JSX } from "react";

import { ConversationList } from "../navigation/ConversationList";
import { useChat } from "../../context/ChatContext";
import { useDrafts } from "../../hooks/useDrafts";
import { CONVERSATION_TYPE_LABEL, type ConversationType } from "../../types/conversation";
import type { SurfaceId } from "../../config/stateCopy";
import "./ModuleViews.css";

interface Props {
    /** Which conversation type this module presents. */
    type: ConversationType;
    /** Which §8.11 copy block applies to the surface. */
    surface: SurfaceId;
}

export const ConversationDirectoryView = memo(function ConversationDirectoryView({
    type,
    surface,
}: Props): JSX.Element {
    const { activeChannelId, setActiveChannelId, conversations, conversationsState: state } = useChat();
    const draftConversationIds = useDrafts();

    const scoped = useMemo(
        () => conversations.filter((conversation) => conversation.type === type),
        [conversations, type],
    );

    /*
     * ES-2: the surface is empty when this type has no conversations, even
     * though other types do — the count, not the whole list, decides.
     */
    const scopedState = state === "ready" && scoped.length === 0 ? "empty" : state;

    return (
        <div id={`module-view-${type}`} className="svr-module-view-root">
            <div className="svr-module-header">
                <span className="svr-module-header-title">{CONVERSATION_TYPE_LABEL[type]}</span>
                {scopedState === "ready" && (
                    <span className="svr-module-header-count">{scoped.length}</span>
                )}
            </div>

            <ConversationList
                conversations={scoped}
                state={scopedState}
                activeConversationId={activeChannelId}
                onSelect={setActiveChannelId}
                draftConversationIds={draftConversationIds}
                surface={surface}
                /* NAV-3: the type filter is redundant where the surface is one type. */
                showControls={false}
                className="svr-conversation-list--embedded"
            />
        </div>
    );
});
