/*
 * Sovereign Messenger — Sprint 3, Milestone 5
 * MatrixSearchService.ts — Query, Filter, Result Mapping
 *
 * Implements D-10 (SR-1 … SR-11, ST-28 … ST-32).
 *
 * Readiness Review R-4: server-side search cannot index content the server
 * cannot read. The reviewed mitigation is to scope the requirement to
 * searchable content and state the limitation in the interface — which is what
 * this does. Whether to state it is deployment policy (sovereignPolicy.ts).
 *
 * Conversations, people, and files are matched locally against data the client
 * already holds; message text is the only category that needs the server.
 * SR-9: nothing is searched that the user is not already a member of, so no
 * result can disclose content they are not authorised to see.
 */

import { MatrixClientService } from "./MatrixClientService";
import { MatrixRoomService } from "./MatrixRoomService";
import { getSearchPolicy } from "../config/sovereignPolicy";
import type { SearchCategory, SearchResult, SearchResults } from "../types/search";

/** How many results one category contributes before the rest are dropped. */
const PER_CATEGORY_LIMIT = 20;

/**
 * SR-7: matching is case- and diacritic-insensitive, and works for Uzbek Latin
 * and Cyrillic alike. Normalising to NFD and stripping combining marks folds
 * o'/oʻ/ó and similar together, which is what a user typing quickly produces.
 */
function fold(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/['‘’ʻʼ]/g, "")
        .toLowerCase();
}

function matches(haystack: string, needle: string): boolean {
    return fold(haystack).includes(needle);
}

export class MatrixSearchService {
    private static instance: MatrixSearchService | null = null;

    private clientService: MatrixClientService;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    public static getInstance(): MatrixSearchService {
        if (!MatrixSearchService.instance) {
            MatrixSearchService.instance = new MatrixSearchService();
        }
        return MatrixSearchService.instance;
    }

    /**
     * SR-1 / SR-8: conversations, people, and files, matched against what the
     * client already holds. Returned synchronously so the user sees something
     * immediately rather than waiting on the server (PERF-5).
     */
    public searchLocal(query: string, categories?: SearchCategory[]): SearchResults {
        const needle = fold(query.trim());
        if (needle === "") return { groups: [], limited: false };

        const wanted = (category: SearchCategory): boolean =>
            !categories || categories.includes(category);

        const rooms = MatrixRoomService.getInstance().getAllRooms();
        const groups: SearchResults["groups"] = [];

        if (wanted("conversations")) {
            const results = rooms
                .filter((room) => matches(room.name, needle) || matches(room.topic ?? "", needle))
                .slice(0, PER_CATEGORY_LIMIT)
                .map((room): SearchResult => ({
                    id: room.roomId,
                    category: "conversations",
                    title: room.name,
                    // SR-4: enough to identify it without opening it.
                    context: room.topic ?? "",
                    conversationId: room.roomId,
                    timestamp: room.lastActivityAt ?? undefined,
                }));
            if (results.length > 0) groups.push({ category: "conversations", results });
        }

        if (wanted("people")) {
            const seen = new Set<string>();
            const results: SearchResult[] = [];

            for (const room of rooms) {
                for (const member of MatrixRoomService.getInstance().getMembers(room.roomId)) {
                    if (seen.has(member.id) || !matches(member.displayName, needle)) continue;
                    seen.add(member.id);
                    results.push({
                        id: member.id,
                        category: "people",
                        title: member.displayName,
                        // SR-4: a person is identified by role and department;
                        // neither has an authoritative source yet (AS-1), so
                        // the conversation they share stands in rather than a
                        // fabricated designation (FR-1).
                        context: room.name,
                        conversationId: room.roomId,
                    });
                    if (results.length >= PER_CATEGORY_LIMIT) break;
                }
                if (results.length >= PER_CATEGORY_LIMIT) break;
            }

            if (results.length > 0) groups.push({ category: "people", results });
        }

        if (wanted("files")) {
            const results: SearchResult[] = [];

            for (const room of rooms) {
                const timeline = this.readAttachments(room.roomId);
                for (const entry of timeline) {
                    if (!matches(entry.name, needle)) continue;
                    results.push({
                        id: `${room.roomId}:${entry.eventId}`,
                        category: "files",
                        title: entry.name,
                        context: room.name,
                        conversationId: room.roomId,
                        eventId: entry.eventId,
                        timestamp: entry.timestamp,
                    });
                    if (results.length >= PER_CATEGORY_LIMIT) break;
                }
                if (results.length >= PER_CATEGORY_LIMIT) break;
            }

            if (results.length > 0) {
                results.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
                groups.push({ category: "files", results });
            }
        }

        return { groups, limited: false };
    }

    /**
     * SR-1: message text, which only the server can search.
     *
     * R-4 / SR-10: where the deployment holds content the server cannot index,
     * the result set is knowably incomplete and says so rather than letting a
     * user believe nothing else matched.
     */
    public async searchMessages(query: string): Promise<SearchResults> {
        const client = this.clientService.getClient();
        if (!client || query.trim() === "") return { groups: [], limited: false };

        try {
            const response = await client.searchMessageText({ query });
            const raw = response?.search_categories?.room_events?.results ?? [];

            const results: SearchResult[] = raw
                .slice(0, PER_CATEGORY_LIMIT)
                .map((entry: any): SearchResult | null => {
                    const event = entry?.result;
                    const body = event?.content?.body;
                    if (typeof body !== "string" || body.trim() === "") return null;

                    const roomId: string = event.room_id;
                    const room = MatrixRoomService.getInstance().getRoom(roomId);

                    return {
                        id: event.event_id,
                        category: "messages",
                        title: room?.name ?? roomId,
                        // SR-4: the conversation, and the matched text.
                        context: body,
                        conversationId: roomId,
                        eventId: event.event_id,
                        timestamp: typeof event.origin_server_ts === "number"
                            ? event.origin_server_ts
                            : undefined,
                    };
                })
                .filter((result): result is SearchResult => result !== null);

            return {
                groups: results.length > 0 ? [{ category: "messages", results }] : [],
                limited: getSearchPolicy().includeUnsearchableNotice,
            };
        } catch (error: unknown) {
            // ERR-7 / ST-31: the surface offers retry and refinement.
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixSearchService] Message search failed:", detail);
            throw new Error("search-failed");
        }
    }

    /** Attachments the client already holds for a room, for the file category. */
    private readAttachments(roomId: string): Array<{ name: string; eventId: string; timestamp: number }> {
        const client = this.clientService.getClient();
        if (!client) return [];

        try {
            const room: any = client.getRoom(roomId);
            const events: any[] = room?.getLiveTimeline?.()?.getEvents?.() ?? [];

            return events
                .filter((event) => {
                    const type = event?.getContent?.()?.msgtype;
                    return type === "m.file" || type === "m.image";
                })
                .map((event) => ({
                    name: String(event.getContent()?.body ?? ""),
                    eventId: String(event.getId() ?? ""),
                    timestamp: Number(event.getTs?.() ?? 0),
                }))
                .filter((entry) => entry.name !== "");
        } catch {
            return [];
        }
    }
}
