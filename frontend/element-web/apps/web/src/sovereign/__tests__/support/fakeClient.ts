/*
 * A controlled stand-in for the synchronised platform client.
 *
 * It answers only what the Sovereign service layer actually reads, so a test
 * describes the state of the world rather than the shape of the SDK.
 */

export interface FakeMessage {
    id: string;
    sender: string;
    senderName: string;
    body: string;
    ts: number;
    status?: string;
    encrypted?: boolean;
    decryptionFailure?: boolean;
    /** NT-9 / FR-53: carries the deployment's urgency designation. */
    urgent?: boolean;
    /** NT-2: the people this message declares it mentions. */
    mentions?: string[];
}

export interface FakeRoomSpec {
    id: string;
    name: string;
    alias?: string;
    memberCount?: number;
    topic?: string;
    members?: Array<{ id: string; name: string; membership: string; canPost?: boolean }>;
    messages?: FakeMessage[];
    unread?: number;
    highlight?: number;
    favourite?: boolean;
    /** NT-5: the notification level the user has set for this room. */
    level?: "all" | "mentions" | "none";
    lastActive?: number;
    canPost?: boolean;
    /** Earlier history the room can page in (FR-36). */
    earlier?: FakeMessage[];
}

function toEvent(m: FakeMessage): any {
    return {
        getType: () => (m.encrypted ? "m.room.encrypted" : "m.room.message"),
        getContent: () => ({
            body: m.body,
            ...(m.urgent ? { "uz.gov.urgent": true } : {}),
            ...(m.mentions ? { "m.mentions": { user_ids: m.mentions } } : {}),
        }),
        getId: () => m.id,
        getSender: () => m.sender,
        getTs: () => m.ts,
        getRoomId: () => undefined,
        isDecryptionFailure: () => Boolean(m.decryptionFailure),
        sender: { name: m.senderName },
        status: m.status,
    };
}

export function createFakeClient(specs: FakeRoomSpec[], userId = "@me:gov.uz") {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

    const rooms = specs.map((spec) => {
        const live = [...(spec.messages ?? [])].map(toEvent);
        let backToken: string | null = (spec.earlier?.length ?? 0) > 0 ? "tok" : null;
        const remaining = [...(spec.earlier ?? [])];

        const timeline = {
            getEvents: () => live,
            getPaginationToken: () => backToken,
        };

        return {
            roomId: spec.id,
            name: spec.name,
            tags: spec.favourite ? { "m.favourite": {} } : {},
            timeline: live,
            getMyMembership: () => "join",
            getJoinedMemberCount: () => spec.memberCount ?? 5,
            getCanonicalAlias: () => spec.alias ?? null,
            getMxcAvatarUrl: () => undefined,
            getLastActiveTimestamp: () => spec.lastActive ?? 0,
            getUnreadNotificationCount: (type: string) =>
                type === "highlight" ? (spec.highlight ?? 0) : (spec.unread ?? 0),
            getLiveTimeline: () => timeline,
            getEventReadUpTo: () => spec.messages?.[0]?.id ?? null,
            getMember: (who: string) => {
                const member = (spec.members ?? []).find((x) => x.id === who);
                return member ? { name: member.name } : null;
            },
            getMembers: () =>
                (spec.members ?? []).map((member) => ({
                    userId: member.id,
                    name: member.name,
                    rawDisplayName: member.name,
                    membership: member.membership,
                    getMxcAvatarUrl: () => undefined,
                })),
            currentState: {
                getStateEvents: (type: string) =>
                    type === "m.room.topic" && spec.topic
                        ? { getContent: () => ({ topic: spec.topic }) }
                        : null,
                maySendMessage: (who?: string) => {
                    const m = (spec.members ?? []).find((x) => x.id === who);
                    if (m) return m.canPost ?? true;
                    return spec.canPost ?? true;
                },
            },
            /** Test control: apply one page of earlier history. */
            __paginate: () => {
                const page = remaining.splice(Math.max(0, remaining.length - 20), 20);
                live.unshift(...page.map(toEvent));
                if (remaining.length === 0) backToken = null;
                return remaining.length > 0;
            },
        };
    });

    return {
        getUserId: () => userId,
        getRooms: () => rooms,
        getRoom: (id: string) => rooms.find((r) => r.roomId === id) ?? null,
        /*
         * NT-5: the three levels are expressed by which push rules exist — a
         * room rule silences ordinary messages, an override rule silences
         * everything including mentions.
         */
        pushRules: {
            global: {
                override: specs
                    .filter((s) => s.level === "none")
                    .map((s) => ({
                        rule_id: s.id,
                        enabled: true,
                        actions: ["dont_notify"],
                        conditions: [{ kind: "event_match", key: "room_id", pattern: s.id }],
                    })),
            },
        },
        getRoomPushRule: (_scope: string, id: string) => {
            const spec = specs.find((s) => s.id === id);
            return spec?.level === "mentions"
                ? { rule_id: id, enabled: true, actions: ["dont_notify"] }
                : undefined;
        },
        paginateEventTimeline: async (tl: any) => {
            const room = rooms.find((r) => r.getLiveTimeline() === tl);
            return room ? room.__paginate() : false;
        },
        on: (event: string, cb: (...args: unknown[]) => void) => {
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event)!.add(cb);
        },
        removeListener: (event: string, cb: (...args: unknown[]) => void) => {
            listeners.get(event)?.delete(cb);
        },
        /** Test control: fire a platform event. */
        __emit: (event: string) => listeners.get(event)?.forEach((cb) => cb()),
        __rooms: rooms,
    };
}
