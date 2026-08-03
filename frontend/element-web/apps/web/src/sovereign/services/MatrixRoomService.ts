/*
 * Sovereign Messenger — Sprint 2, Phase 4
 * MatrixRoomService.ts — Matrix Room Discovery Service.
 *
 * PRD §3.1 & Phase 4 Requirements:
 * - Owns all Matrix room discovery logic.
 * - Uses existing authenticated MatrixClient from MatrixClientService. Never creates new client.
 * - Loads rooms strictly from synchronized MatrixClient (client.getRooms()).
 * - Zero manual HTTP requests / REST API calls.
 * - Exposes clean SovereignRoom interface (roomId, name, topic, avatarUrl, canonicalAlias, isDirect, membership).
 * - Sorts rooms consistently: Joined first, Invited second, Alphabetical inside each group.
 * - Zero React/Provider/Context changes, zero UI rendering, zero timeline/message loading.
 */

import { MatrixClientService } from "./MatrixClientService";

export interface SovereignRoom {
    roomId: string;
    name: string;
    topic?: string;
    avatarUrl?: string;
    canonicalAlias?: string;
    isDirect: boolean;
    membership: "join" | "invite" | "leave";
}

export class MatrixRoomService {
    private static instance: MatrixRoomService | null = null;
    private clientService: MatrixClientService;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
    }

    /**
     * Get singleton instance of MatrixRoomService.
     */
    public static getInstance(): MatrixRoomService {
        if (!MatrixRoomService.instance) {
            MatrixRoomService.instance = new MatrixRoomService();
        }
        return MatrixRoomService.instance;
    }

    /**
     * Retrieves all discovered Matrix rooms sorted (Joined first, Invited second, Alphabetical).
     */
    public getAllRooms(): SovereignRoom[] {
        const client = this.clientService.getClient();
        if (!client) {
            return [];
        }

        try {
            const rawRooms = client.getRooms() || [];
            const sovereignRooms = rawRooms.map((room) => this.transformRoom(room));
            return this.sortRooms(sovereignRooms);
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixRoomService] Error retrieving rooms from client:", detail);
            return [];
        }
    }

    /**
     * Returns only rooms where current user's membership is "join".
     */
    public getJoinedRooms(): SovereignRoom[] {
        return this.getAllRooms().filter((room) => room.membership === "join");
    }

    /**
     * Returns only rooms where current user's membership is "invite".
     */
    public getInvitedRooms(): SovereignRoom[] {
        return this.getAllRooms().filter((room) => room.membership === "invite");
    }

    /**
     * Get details for a specific Matrix room by roomId.
     */
    public getRoom(roomId: string): SovereignRoom | null {
        if (!roomId) {
            return null;
        }
        const client = this.clientService.getClient();
        if (!client) {
            return null;
        }

        try {
            const rawRoom = client.getRoom(roomId);
            return rawRoom ? this.transformRoom(rawRoom) : null;
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixRoomService] Error fetching room ${roomId}:`, detail);
            return null;
        }
    }

    /**
     * Triggers a fresh discovery of all synchronized rooms.
     */
    public refresh(): SovereignRoom[] {
        return this.getAllRooms();
    }

    /**
     * Transforms Matrix SDK Room object to clean SovereignRoom interface.
     */
    private transformRoom(room: any): SovereignRoom {
        const membershipRaw = typeof room.getMyMembership === "function" ? room.getMyMembership() : "leave";
        const membership: "join" | "invite" | "leave" =
            membershipRaw === "join" ? "join" : membershipRaw === "invite" ? "invite" : "leave";

        let topic: string | undefined = undefined;
        try {
            const topicEvent = room.currentState?.getStateEvents("m.room.topic", "");
            topic = topicEvent?.getContent()?.topic || undefined;
        } catch {
            topic = undefined;
        }

        let canonicalAlias: string | undefined = undefined;
        try {
            canonicalAlias = typeof room.getCanonicalAlias === "function" ? room.getCanonicalAlias() : undefined;
        } catch {
            canonicalAlias = undefined;
        }

        let avatarUrl: string | undefined = undefined;
        try {
            avatarUrl = typeof room.getMxcAvatarUrl === "function" ? room.getMxcAvatarUrl() : undefined;
        } catch {
            avatarUrl = undefined;
        }

        const isDirect = typeof room.getJoinedMemberCount === "function"
            ? room.getJoinedMemberCount() <= 2 && !canonicalAlias
            : false;

        return {
            roomId: room.roomId,
            name: room.name || canonicalAlias || room.roomId,
            topic,
            avatarUrl,
            canonicalAlias,
            isDirect,
            membership,
        };
    }

    /**
     * Sorts rooms: Joined rooms first, Invited rooms second, Alphabetical inside each group.
     */
    private sortRooms(rooms: SovereignRoom[]): SovereignRoom[] {
        const joined = rooms.filter((r) => r.membership === "join");
        const invited = rooms.filter((r) => r.membership === "invite");
        const others = rooms.filter((r) => r.membership !== "join" && r.membership !== "invite");

        const sortByName = (a: SovereignRoom, b: SovereignRoom) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

        joined.sort(sortByName);
        invited.sort(sortByName);
        others.sort(sortByName);

        return [...joined, ...invited, ...others];
    }
}
