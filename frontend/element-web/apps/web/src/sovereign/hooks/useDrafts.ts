/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * useDrafts.ts — Conversations Holding Unsent Text
 *
 * CMP-19 / FR-40: the conversation list marks conversations holding a draft,
 * so a user who navigated away can see where their unfinished work is without
 * opening each conversation to check.
 */

import { useEffect, useState } from "react";

import { DraftService } from "../services/DraftService";

/** Ids of conversations that currently hold unsent text. */
export function useDrafts(): ReadonlySet<string> {
    const service = DraftService.getInstance();
    const [ids, setIds] = useState<ReadonlySet<string>>(
        () => new Set(service.getConversationIdsWithDrafts()),
    );

    useEffect(() => {
        // Re-read on subscribe as well: a draft may have been stored between
        // the initial state and this effect running.
        const sync = (): void => setIds(new Set(service.getConversationIdsWithDrafts()));
        sync();
        return service.subscribe(sync);
    }, [service]);

    return ids;
}
