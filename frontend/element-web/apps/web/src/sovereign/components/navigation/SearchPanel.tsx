/*
 * Sovereign Messenger — Sprint 3, Milestone 5
 * SearchPanel.tsx — CMP-38 / CMP-39 / CMP-40 / CMP-41 Search
 *
 * SR-2: reachable from any screen by keyboard and by the header control.
 * SR-3: results grouped by category.
 * SR-4: each result carries enough context to be identified without opening.
 * SR-5: selecting a message result opens its conversation at that message.
 * SR-6: filterable by category.
 * SR-10: an empty result is distinct from a failure, and suggests refinement.
 * SR-11: recent searches are offered when the field is focused and empty.
 *
 * A11Y-3: focus moves into the panel on open, is trapped while it is open, and
 * returns to whatever opened it on close.
 */

import React, { memo, useRef, type JSX } from "react";

import { Button, EmptyState, ErrorState, Icon, IconButton, Spinner } from "../ui";
import { SEARCH_COPY } from "../../config/searchCopy";
import { SURFACE_COPY, RETRY_LABEL } from "../../config/stateCopy";
import { useSearch } from "../../hooks/useSearch";
import { useDialog } from "../../hooks/useDialog";
import { useProfileViewer } from "../../context/ProfileContext";
import type { SearchCategory, SearchResult } from "../../types/search";
import "./navigation.css";

const CATEGORIES: SearchCategory[] = ["conversations", "people", "messages", "files"];

interface Props {
    onClose: () => void;
    /** SR-5: opens a conversation, positioned at a message where given. */
    onOpenResult: (conversationId: string, eventId?: string) => void;
}

export const SearchPanel = memo(function SearchPanel({ onClose, onOpenResult }: Props): JSX.Element {
    const search = useSearch();
    const { openProfile } = useProfileViewer();
    // A11Y-3 / CMP-47: focus enters, stays, and is put back on close.
    const { ref: panel } = useDialog<HTMLDivElement>(onClose);
    const field = useRef<HTMLInputElement | null>(null);

    const select = (result: SearchResult): void => {
        // PR-2: a person found by search opens the same profile as a person
        // found anywhere else — not the conversation they happen to share.
        if (result.category === "people") {
            openProfile(result.id);
            onClose();
            return;
        }

        if (!result.conversationId) return;
        onOpenResult(result.conversationId, result.eventId);
        onClose();
    };

    return (
        <div className="svr-search" role="dialog" aria-modal="true" aria-label={SEARCH_COPY.open} ref={panel}>
            <div className="svr-search__bar">
                {/* CMP-38 */}
                <Icon name="search" size="md" className="svr-search__icon" />
                <input
                    ref={field}
                    data-svr-autofocus="true"
                    type="search"
                    className="svr-search__field"
                    value={search.query}
                    onChange={(event) => search.setQuery(event.target.value)}
                    placeholder={SEARCH_COPY.placeholder}
                    aria-label={SEARCH_COPY.label}
                />
                <IconButton icon="close" label={SEARCH_COPY.close} variant="ghost" onClick={onClose} />
            </div>

            {/* CMP-41 / SR-6: narrow to one category. */}
            <div className="svr-search__filters" role="group" aria-label={SEARCH_COPY.open}>
                <Button
                    variant={search.categories === undefined ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => search.setCategories(undefined)}
                >
                    {SEARCH_COPY.allCategories}
                </Button>
                {CATEGORIES.map((category) => (
                    <Button
                        key={category}
                        variant={search.categories?.includes(category) ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => search.setCategories([category])}
                    >
                        {SEARCH_COPY.category[category]}
                    </Button>
                ))}
            </div>

            <div className="svr-search__results">
                {/* ST-28 / SR-11: idle offers recent searches. */}
                {search.state === "idle" && (
                    <div className="svr-module-state">
                        {search.recent.length > 0 ? (
                            <>
                                <h3 className="svr-search__heading">{SEARCH_COPY.recent}</h3>
                                <ul className="svr-search__list">
                                    {search.recent.map((entry) => (
                                        <li key={entry}>
                                            <button
                                                type="button"
                                                className="svr-search__result"
                                                onClick={() => search.setQuery(entry)}
                                            >
                                                {entry}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <EmptyState variant="empty" icon="search" title={SEARCH_COPY.idle} />
                        )}
                    </div>
                )}

                {/* ST-29 / SR-8: results already found stay visible while the
                    server is still answering, so nothing waits on everything. */}
                {search.state === "searching" && search.results.groups.length === 0 && (
                    <div className="svr-module-state" aria-busy="true">
                        <Spinner size="md" />
                        <span className="svr-visually-hidden">{SURFACE_COPY.search.loading}</span>
                    </div>
                )}

                {/* ST-30: empty is visually distinct from error, and suggests. */}
                {search.state === "empty" && (
                    <div className="svr-module-state">
                        <EmptyState
                            variant="empty"
                            icon="search"
                            title={SURFACE_COPY.search.empty}
                            description={SEARCH_COPY.emptyHint}
                        />
                    </div>
                )}

                {/* ST-31 / ERR-7: retry, and refine. */}
                {search.state === "error" && (
                    <div className="svr-module-state">
                        <ErrorState
                            title={SURFACE_COPY.search.error}
                            onRetry={search.retry}
                            retryLabel={RETRY_LABEL}
                        />
                    </div>
                )}

                {search.results.groups.map((group) => (
                    <section key={group.category} className="svr-search__group">
                        <h3 className="svr-search__heading">{SEARCH_COPY.category[group.category]}</h3>
                        <ul className="svr-search__list">
                            {group.results.map((result) => (
                                <li key={result.id}>
                                    {/* CMP-40 */}
                                    <button
                                        type="button"
                                        className="svr-search__result"
                                        onClick={() => select(result)}
                                    >
                                        <span className="svr-search__result-title">{result.title}</span>
                                        {/* SR-4: identifying context. */}
                                        {result.context && (
                                            <span className="svr-search__result-context">
                                                {result.context}
                                            </span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                {/* R-4 / SR-10: the result set is knowably incomplete. */}
                {search.results.limited && search.results.groups.length > 0 && (
                    <p className="svr-search__limited">{SEARCH_COPY.limited}</p>
                )}
            </div>
        </div>
    );
});
