/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * ConversationList.tsx — CMP-20 Conversation List
 *
 * NAV-2: replaces the selection control that previously stood in for
 * conversation navigation.
 * NAV-3: filterable by type and sortable by recent activity or name.
 * IA-7: grouped by type, ordered within type by most recent activity.
 * IA-8: favourites appear above all other groupings.
 *
 * States (CMP-20): loading, populated, empty, error, filtered — the first four
 * from the shared state boundary, so this surface cannot invent its own copy.
 */

import React, { memo, useMemo, useState, type JSX } from "react";

import { ConversationItem } from "./ConversationItem";
import { ModuleStateBoundary } from "../views/ModuleStateBoundary";
import { Button, EmptyState } from "../ui";
import { CONVERSATION_COPY } from "../../config/navigationCopy";
import { SURFACE_COPY, type SurfaceId } from "../../config/stateCopy";
import {
    CONVERSATION_TYPE_LABEL,
    type ConversationType,
    type SovereignConversation,
} from "../../types/conversation";
import type { ResourceState } from "../../types/resource";
import "./navigation.css";

type TypeFilter = ConversationType | "all";
type SortMode = "recent" | "name";

interface ConversationListProps {
    conversations: SovereignConversation[];
    state: ResourceState;
    activeConversationId: string;
    onSelect: (conversationId: string) => void;
    /** FR-40: conversations holding unsent text, so the list can say so. */
    draftConversationIds?: ReadonlySet<string>;
    onRetry?: () => void;
    /** Which §8.11 copy block applies. Defaults to the whole conversation surface. */
    surface?: SurfaceId;
    /** NAV-3: hides the filter when the surface already presents one type. */
    showControls?: boolean;
    className?: string;
}

/** IA-7: type order. Favourites are lifted out of this ordering by IA-8. */
const TYPE_ORDER: ConversationType[] = ["channel", "group", "direct"];

const TYPE_GROUP_HEADING: Record<ConversationType, string> = {
    channel: CONVERSATION_COPY.groupChannels,
    group: CONVERSATION_COPY.groupGroups,
    direct: CONVERSATION_COPY.groupDirect,
};

interface ConversationGroup {
    key: string;
    heading: string;
    items: SovereignConversation[];
}

export const ConversationList = memo(function ConversationList({
    conversations,
    state,
    activeConversationId,
    onSelect,
    draftConversationIds,
    onRetry,
    surface = "conversations",
    showControls = true,
    className,
}: ConversationListProps): JSX.Element {
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
    const [sortMode, setSortMode] = useState<SortMode>("recent");

    const groups = useMemo<ConversationGroup[]>(() => {
        const visible =
            typeFilter === "all"
                ? conversations
                : conversations.filter((conversation) => conversation.type === typeFilter);

        /*
         * IA-7: within a grouping, most recent activity first. A conversation
         * with no known activity sorts last rather than to the top, so an
         * absent timestamp never outranks a real one.
         */
        const order = (a: SovereignConversation, b: SovereignConversation): number => {
            if (sortMode === "name") {
                return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
            }
            const aAt = a.lastActivityAt ?? -1;
            const bAt = b.lastActivityAt ?? -1;
            if (aAt !== bAt) return bAt - aAt;
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        };

        const result: ConversationGroup[] = [];

        // IA-8: favourites above all other groupings.
        const favourites = visible.filter((conversation) => conversation.isFavourite).sort(order);
        if (favourites.length > 0) {
            result.push({
                key: "favourites",
                heading: CONVERSATION_COPY.groupFavourites,
                items: favourites,
            });
        }

        TYPE_ORDER.forEach((type) => {
            const items = visible
                .filter((conversation) => conversation.type === type && !conversation.isFavourite)
                .sort(order);

            if (items.length > 0) {
                result.push({ key: type, heading: TYPE_GROUP_HEADING[type], items });
            }
        });

        return result;
    }, [conversations, typeFilter, sortMode]);

    const isFiltered = typeFilter !== "all";
    const hasResults = groups.length > 0;

    return (
        <div
            className={["svr-conversation-list", className].filter(Boolean).join(" ")}
            id="sovereign-conversation-list"
        >
            {/* NAV-3: filter by type, sort by recent activity or name. */}
            {showControls && (
            <div className="svr-conversation-list__controls">
                <label className="svr-conversation-list__control">
                    <span className="svr-visually-hidden">{CONVERSATION_COPY.filterLabel}</span>
                    <select
                        className="svr-conversation-list__select"
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
                    >
                        <option value="all">{CONVERSATION_COPY.filterAll}</option>
                        {TYPE_ORDER.map((type) => (
                            <option key={type} value={type}>
                                {CONVERSATION_TYPE_LABEL[type]}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="svr-conversation-list__control">
                    <span className="svr-visually-hidden">{CONVERSATION_COPY.sortLabel}</span>
                    <select
                        className="svr-conversation-list__select"
                        value={sortMode}
                        onChange={(event) => setSortMode(event.target.value as SortMode)}
                    >
                        <option value="recent">{CONVERSATION_COPY.sortRecent}</option>
                        <option value="name">{CONVERSATION_COPY.sortName}</option>
                    </select>
                </label>
            </div>
            )}

            <ModuleStateBoundary
                state={state}
                surface={surface}
                onRetry={onRetry}
                loadingRows={6}
            >
                {hasResults ? (
                    <nav className="svr-conversation-list__scroll" aria-label={CONVERSATION_COPY.listLabel}>
                        {groups.map((group) => (
                            <section key={group.key} className="svr-conversation-list__group">
                                <h3 className="svr-conversation-list__heading">{group.heading}</h3>
                                <ul className="svr-conversation-list__items">
                                    {group.items.map((conversation) => (
                                        <ConversationItem
                                            key={conversation.id}
                                            conversation={conversation}
                                            isActive={conversation.id === activeConversationId}
                                            hasDraft={draftConversationIds?.has(conversation.id) ?? false}
                                            onSelect={onSelect}
                                        />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </nav>
                ) : (
                    /*
                     * The filtered state: the surface holds conversations, but
                     * none match. Distinct from the empty state, which means
                     * there are none at all (ES-2).
                     */
                    <div className="svr-module-state">
                        <EmptyState
                            variant="empty"
                            title={
                                isFiltered
                                    ? CONVERSATION_COPY.filteredEmpty
                                    : SURFACE_COPY[surface].empty
                            }
                            action={
                                isFiltered ? (
                                    <Button variant="secondary" size="sm" onClick={() => setTypeFilter("all")}>
                                        {CONVERSATION_COPY.filteredEmptyAction}
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                )}
            </ModuleStateBoundary>
        </div>
    );
});
