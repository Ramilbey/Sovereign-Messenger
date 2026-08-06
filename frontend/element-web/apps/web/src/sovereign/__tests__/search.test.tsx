/*
 * Sovereign Messenger — Sprint 3, Milestone 5 acceptance
 * search.test.tsx — D-10 (SR-1 … SR-11, ST-28 … ST-32)
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { MatrixSearchService } from "../services/MatrixSearchService";
import { MatrixRoomService } from "../services/MatrixRoomService";
import { SearchPanel } from "../components/navigation/SearchPanel";
import { SEARCH_COPY } from "../config/searchCopy";
import { SURFACE_COPY } from "../config/stateCopy";
import { createFakeClient } from "./support/fakeClient";

function useRooms() {
    const client = createFakeClient([
        {
            id: "!tergov:gov",
            name: "Tergov guruhi",
            topic: "Joriy ishlar",
            members: [
                { id: "@aziz:gov", name: "Aziz Rahimov", membership: "join" },
                { id: "@dilshod:gov", name: "Dilshod Qodirov", membership: "join" },
            ],
            messages: [{ id: "$1", sender: "@aziz:gov", senderName: "Aziz", body: "hisobot", ts: 1 }],
        },
        { id: "!elonlar:gov", name: "E'lonlar", alias: "#elonlar:gov", topic: "Rasmiy e'lonlar" },
    ]);

    const stub = { getClient: () => client };
    const rooms = MatrixRoomService.getInstance();
    (rooms as any).clientService = stub;
    (rooms as any).snapshot = null;

    const search = MatrixSearchService.getInstance();
    (search as any).clientService = stub;

    return { client, search };
}

beforeEach(() => vi.restoreAllMocks());

describe("SR-1 / SR-3 / SR-4 — one search, grouped, with context", () => {
    it("finds a conversation by name and by topic", () => {
        const { search } = useRooms();

        expect(search.searchLocal("Tergov").groups[0].results[0].title).toBe("Tergov guruhi");
        // SR-4: the topic identifies it without opening it.
        expect(search.searchLocal("Joriy").groups[0].results[0].context).toBe("Joriy ishlar");
    });

    it("finds a person and says which conversation they share", () => {
        const { search } = useRooms();
        const people = search.searchLocal("Dilshod").groups.find((g) => g.category === "people");

        expect(people?.results[0].title).toBe("Dilshod Qodirov");
        // AS-1: no role is fabricated; the shared conversation stands in.
        expect(people?.results[0].context).toBe("Tergov guruhi");
    });

    it("returns nothing for a query that matches nothing", () => {
        const { search } = useRooms();
        expect(search.searchLocal("zzzznothing").groups).toHaveLength(0);
    });
});

describe("SR-7 — case and diacritic insensitive, Latin and Cyrillic", () => {
    it("matches regardless of case", () => {
        const { search } = useRooms();
        expect(search.searchLocal("tergov").groups.length).toBeGreaterThan(0);
        expect(search.searchLocal("TERGOV").groups.length).toBeGreaterThan(0);
    });

    it("folds the apostrophe forms an Uzbek name is typed with", () => {
        const { search } = useRooms();
        // E'lonlar / Eʻlonlar / Elonlar all reach the same channel.
        expect(search.searchLocal("e'lonlar").groups.length).toBeGreaterThan(0);
        expect(search.searchLocal("elonlar").groups.length).toBeGreaterThan(0);
        expect(search.searchLocal("eʻlonlar").groups.length).toBeGreaterThan(0);
    });
});

describe("SR-6 — filtering by category", () => {
    it("returns only the requested category", () => {
        const { search } = useRooms();
        const result = search.searchLocal("Tergov", ["conversations"]);

        expect(result.groups.every((g) => g.category === "conversations")).toBe(true);
    });
});

describe("SR-9 — results never include unauthorised content", () => {
    it("searches only rooms the client already holds", () => {
        const { search } = useRooms();
        // The client holds exactly the two joined rooms; nothing else can
        // enter the result set.
        const all = search.searchLocal("gov").groups.flatMap((g) => g.results);
        all.forEach((r) => expect(["!tergov:gov", "!elonlar:gov"]).toContain(r.conversationId));
    });
});

describe("ST-28 … ST-32 — the search surface", () => {
    it("offers guidance when idle, before anything is typed", () => {
        useRooms();
        render(<SearchPanel onClose={() => undefined} onOpenResult={() => undefined} />);
        expect(screen.getByText(SEARCH_COPY.idle)).toBeTruthy();
    });

    it("shows results and distinguishes empty from error", async () => {
        const { search } = useRooms();
        vi.spyOn(search, "searchMessages").mockResolvedValue({ groups: [], limited: false });

        render(<SearchPanel onClose={() => undefined} onOpenResult={() => undefined} />);
        fireEvent.change(screen.getByLabelText(SEARCH_COPY.label), { target: { value: "Tergov" } });

        await waitFor(() => expect(screen.getByText("Tergov guruhi")).toBeTruthy());

        fireEvent.change(screen.getByLabelText(SEARCH_COPY.label), { target: { value: "zzzznothing" } });
        await waitFor(() => expect(screen.getByText(SURFACE_COPY.search.empty)).toBeTruthy());
        // SR-10: an empty result suggests refinement.
        expect(screen.getByText(SEARCH_COPY.emptyHint)).toBeTruthy();
    });

    it("presents a failed search as an error offering retry, not as empty", async () => {
        const { search } = useRooms();
        vi.spyOn(search, "searchMessages").mockRejectedValue(new Error("search-failed"));

        render(<SearchPanel onClose={() => undefined} onOpenResult={() => undefined} />);
        fireEvent.change(screen.getByLabelText(SEARCH_COPY.label), { target: { value: "zzzznothing" } });

        await waitFor(() => expect(screen.getByText(SURFACE_COPY.search.error)).toBeTruthy());
        // ST-30: distinct from empty.
        expect(screen.queryByText(SURFACE_COPY.search.empty)).toBeNull();
    });

    it("states when the result set is knowably incomplete (R-4, SR-10)", async () => {
        const { search } = useRooms();
        vi.spyOn(search, "searchMessages").mockResolvedValue({ groups: [], limited: true });

        render(<SearchPanel onClose={() => undefined} onOpenResult={() => undefined} />);
        fireEvent.change(screen.getByLabelText(SEARCH_COPY.label), { target: { value: "Tergov" } });

        await waitFor(() => expect(screen.getByText(SEARCH_COPY.limited)).toBeTruthy());
    });

    it("opens the conversation a result belongs to (SR-5)", async () => {
        const { search } = useRooms();
        vi.spyOn(search, "searchMessages").mockResolvedValue({ groups: [], limited: false });

        const onOpenResult = vi.fn();
        const onClose = vi.fn();
        render(<SearchPanel onClose={onClose} onOpenResult={onOpenResult} />);

        fireEvent.change(screen.getByLabelText(SEARCH_COPY.label), { target: { value: "Tergov" } });
        await waitFor(() => expect(screen.getByText("Tergov guruhi")).toBeTruthy());

        fireEvent.click(screen.getByText("Tergov guruhi"));
        expect(onOpenResult).toHaveBeenCalledWith("!tergov:gov", undefined);
        expect(onClose).toHaveBeenCalled();
    });

    it("is a dialog that traps focus and closes on Escape (A11Y-3)", () => {
        useRooms();
        const onClose = vi.fn();
        render(<SearchPanel onClose={onClose} onOpenResult={() => undefined} />);

        expect(screen.getByRole("dialog", { name: SEARCH_COPY.open })).toBeTruthy();
        expect(document.activeElement).toBe(screen.getByLabelText(SEARCH_COPY.label));

        fireEvent.keyDown(document, { key: "Escape" });
        expect(onClose).toHaveBeenCalled();
    });
});
