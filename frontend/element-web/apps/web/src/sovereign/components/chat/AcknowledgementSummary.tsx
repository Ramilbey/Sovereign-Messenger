/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * AcknowledgementSummary.tsx — CMP-31 Read Receipt Summary
 *
 * FR-19: the sender can see how many recipients and which recipients have read
 * a message.
 * FR-20 / GW-2 / GW-3: presentable to a department head — total recipients,
 * how many have read, and the names of those who have not.
 *
 * The names of those still pending are the point. A count answers "how many";
 * only the names answer "who do I still need to chase".
 *
 * R-2: the summary states which reading of "has read" produced it, so a figure
 * reported to leadership is never ambiguous.
 */

import React, { memo, type JSX } from "react";

import { ModuleStateBoundary } from "../views/ModuleStateBoundary";
import { ACKNOWLEDGEMENT_COPY } from "../../config/chatCopy";
import type { AcknowledgementSummary as Summary } from "../../types/receipt";
import type { ResourceState } from "../../types/resource";

interface Props {
    summary: Summary;
    state: ResourceState;
    /** R-2: which reading produced these figures. */
    semantic: "read-position" | "explicit";
    onRetry?: () => void;
}

export const AcknowledgementSummary = memo(function AcknowledgementSummary({
    summary,
    state,
    semantic,
    onRetry,
}: Props): JSX.Element {
    const readCount = summary.readers.length;

    return (
        <section className="svr-ack" aria-label={ACKNOWLEDGEMENT_COPY.title}>
            <h3 className="svr-ack__heading">{ACKNOWLEDGEMENT_COPY.title}</h3>

            <ModuleStateBoundary state={state} surface="members" onRetry={onRetry} loadingRows={3}>
                <>
                    <p className="svr-ack__count">
                        {ACKNOWLEDGEMENT_COPY.readOf(readCount, summary.totalRecipients)}
                    </p>

                    {/* FR-20: who it is still waiting on, by name. */}
                    {summary.pending.length > 0 ? (
                        <>
                            <h4 className="svr-ack__subheading">{ACKNOWLEDGEMENT_COPY.pending}</h4>
                            <ul className="svr-ack__list">
                                {summary.pending.map((person) => (
                                    <li key={person.userId} className="svr-ack__person">
                                        {person.displayName}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="svr-ack__complete">{ACKNOWLEDGEMENT_COPY.allRead}</p>
                    )}

                    {/*
                     * R-2: a department head reporting this figure upward is
                     * told what it counts, so it cannot be over-read.
                     */}
                    <p className="svr-ack__semantic">{ACKNOWLEDGEMENT_COPY.semantic[semantic]}</p>
                </>
            </ModuleStateBoundary>
        </section>
    );
});
