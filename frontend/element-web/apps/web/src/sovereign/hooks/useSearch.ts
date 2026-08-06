/*
 * Sovereign Messenger — Sprint 3, Milestone 5
 * useSearch.ts — Global Search
 *
 * SR-1 … SR-11, ST-28 … ST-32.
 *
 * SR-8: local categories resolve immediately and are shown while the server
 * is still answering, so the user never waits for every category before
 * seeing any result (PERF-5).
 *
 * Per Blueprint §8, this consumes a service and never reads the platform SDK.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { MatrixSearchService } from "../services/MatrixSearchService";
import { isDemoMode } from "../config/SovereignConfig";
import type { SearchCategory, SearchResults } from "../types/search";

/** How long to wait after the last keystroke before asking the server. */
const DEBOUNCE_MS = 250;

/** SR-11: how many recent searches are offered. */
const RECENT_LIMIT = 5;

export type SearchState = "idle" | "searching" | "results" | "empty" | "error";

export interface SearchApi {
    query: string;
    setQuery: (value: string) => void;
    /** SR-6: narrow to one category. */
    categories: SearchCategory[] | undefined;
    setCategories: (value: SearchCategory[] | undefined) => void;
    state: SearchState;
    results: SearchResults;
    /** SR-11: offered when the field is focused and empty. */
    recent: string[];
    retry: () => void;
    reset: () => void;
}

const EMPTY: SearchResults = { groups: [], limited: false };

export function useSearch(): SearchApi {
    const [query, setQuery] = useState("");
    const [categories, setCategories] = useState<SearchCategory[] | undefined>(undefined);
    const [state, setState] = useState<SearchState>("idle");
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [recent, setRecent] = useState<string[]>([]);
    const [attempt, setAttempt] = useState(0);

    /*
     * ST-32 / EDGE-17: a superseded query's results must never overwrite the
     * ones the user is now looking at.
     */
    const generation = useRef(0);

    const run = useCallback(async () => {
        const trimmed = query.trim();
        const mine = ++generation.current;

        if (trimmed === "") {
            setState("idle");
            setResults(EMPTY);
            return;
        }

        setState("searching");

        const service = MatrixSearchService.getInstance();

        // SR-8: what the client already holds, shown at once.
        const local = service.searchLocal(trimmed, categories);
        if (generation.current === mine) {
            setResults(local);
            if (local.groups.length > 0) setState("results");
        }

        /*
         * FR-1: Demo Mode has no server to search, so message text is not
         * offered there rather than the surface pretending to have searched it.
         */
        const wantsMessages = !categories || categories.includes("messages");
        if (isDemoMode() || !wantsMessages) {
            if (generation.current === mine) {
                setState(local.groups.length > 0 ? "results" : "empty");
            }
            return;
        }

        try {
            const remote = await service.searchMessages(trimmed);
            if (generation.current !== mine) return;

            const merged: SearchResults = {
                groups: [...local.groups, ...remote.groups],
                limited: remote.limited,
            };
            setResults(merged);
            setState(merged.groups.length > 0 ? "results" : "empty");
        } catch {
            if (generation.current !== mine) return;
            // ST-30: an error is distinct from an empty result. Anything the
            // client already found stays on screen.
            setState(local.groups.length > 0 ? "results" : "error");
        }
    }, [query, categories]);

    useEffect(() => {
        const timer = setTimeout(() => void run(), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [run, attempt]);

    /* SR-11: a query is recorded once it has actually produced something. */
    useEffect(() => {
        if (state !== "results") return;
        const trimmed = query.trim();
        if (trimmed === "") return;

        setRecent((current) => [trimmed, ...current.filter((q) => q !== trimmed)].slice(0, RECENT_LIMIT));
    }, [state, query]);

    return {
        query,
        setQuery,
        categories,
        setCategories,
        state,
        results,
        recent,
        // ST-31: retry without the user retyping.
        retry: useCallback(() => setAttempt((a) => a + 1), []),
        reset: useCallback(() => {
            setQuery("");
            setCategories(undefined);
            setResults(EMPTY);
            setState("idle");
        }, []),
    };
}
