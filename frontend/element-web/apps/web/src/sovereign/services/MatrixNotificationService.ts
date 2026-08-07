/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * MatrixNotificationService.ts — Notification Level, Feed, and Reconciliation
 *
 * Implements D-11 (FR-49 … FR-54, NT-1 … NT-10).
 *
 * Two things belong to the platform and are read, never derived:
 *
 *   the unread counts, which the server carries on synchronisation, and
 *   the notification rules, which decide what counts as a notification.
 *
 * Deriving either locally is what NT-8 and EDGE-5 forbid: a tally kept in one
 * tab cannot agree with another tab, another device, or the server, and a
 * message read elsewhere would stay unread here. Everything below therefore
 * reads platform state and writes platform state; nothing is remembered
 * locally except the user's own choice of alert sound (NT-7).
 *
 * Changes no protocol behaviour and starts no synchronisation of its own
 * (PRD §6.1).
 */

import {
    ClientEvent,
    ConditionKind,
    PushRuleActionName,
    PushRuleKind,
    RoomEvent,
    type IPushRule,
} from "matrix-js-sdk/src/matrix";

import { MatrixClientService } from "./MatrixClientService";
import { MatrixReceiptService } from "./MatrixReceiptService";
import { getNotificationPolicy } from "../config/sovereignPolicy";
import type { NotificationEntry, NotificationKind, NotificationLevel } from "../types/notification";

export type NotificationListener = () => void;

/**
 * How far back into a conversation the centre looks for activity to report.
 *
 * NT-3 lists *recent* activity; a bound keeps the cost of building the feed
 * proportional to how many conversations the user has, not to how long they
 * have been running (PERF-10, EDGE-2).
 */
const FEED_SCAN_LIMIT = 30;

/** NT-3: how many entries the centre presents at once. */
const FEED_LIMIT = 50;

export class MatrixNotificationService {
    private static instance: MatrixNotificationService | null = null;

    private clientService: MatrixClientService;
    private receiptService: MatrixReceiptService;
    private listeners = new Set<NotificationListener>();
    private detach: (() => void) | null = null;

    private constructor() {
        this.clientService = MatrixClientService.getInstance();
        this.receiptService = MatrixReceiptService.getInstance();
    }

    public static getInstance(): MatrixNotificationService {
        if (!MatrixNotificationService.instance) {
            MatrixNotificationService.instance = new MatrixNotificationService();
        }
        return MatrixNotificationService.instance;
    }

    /**
     * NT-5 / FR-52: the level now in force for a conversation.
     *
     * Two rules can silence a conversation and they do not mean the same thing.
     * A rule scoped to the room suppresses ordinary messages while leaving the
     * mention rules — which are evaluated first — free to fire, which is
     * "mentions only". A rule that matches the room ahead of those mention
     * rules suppresses everything, which is "none". Reading them in that order
     * is what keeps the two distinguishable.
     */
    public getLevel(roomId: string): NotificationLevel {
        const client = this.clientService.getClient();
        if (!client || !roomId) return "all";

        try {
            if (this.isSuppressing(this.findOverrideRule(roomId))) return "none";
            if (this.isSuppressing(client.getRoomPushRule("global", roomId))) return "mentions";
            return "all";
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixNotificationService] Unable to read the level for ${roomId}:`, detail);
            return "all";
        }
    }

    /**
     * NT-5: set the level for a conversation.
     *
     * Written to the server rather than held locally, so the choice follows the
     * user to every tab and every device (NT-8).
     */
    public async setLevel(roomId: string, level: NotificationLevel): Promise<void> {
        const client = this.clientService.getClient();
        if (!client || !roomId) return;

        // Start from a clean slate: the three levels are expressed by which
        // rules exist, so a level is only unambiguous once the others are gone.
        await this.clearRule(PushRuleKind.Override, roomId);
        await this.clearRule(PushRuleKind.RoomSpecific, roomId);

        if (level === "all") return;

        const kind = level === "none" ? PushRuleKind.Override : PushRuleKind.RoomSpecific;

        try {
            await client.addPushRule("global", kind, roomId, {
                actions: [PushRuleActionName.DontNotify],
                ...(kind === PushRuleKind.Override
                    ? {
                          conditions: [
                              { kind: ConditionKind.EventMatch, key: "room_id", pattern: roomId },
                          ],
                      }
                    : {}),
            });
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixNotificationService] Unable to set the level for ${roomId}:`, detail);
            throw error instanceof Error ? error : new Error(detail);
        }
    }

    /**
     * NT-3: recent mentions, direct messages, and official channel activity, in
     * reverse chronological order.
     *
     * Built from what each conversation has waiting past this user's own read
     * position, so an entry disappears when the message behind it is read —
     * including when it is read on another device (NT-8). Because entries are
     * identified by their event, the same message cannot appear twice however
     * it arrived (EDGE-5).
     *
     * NT-9 / FR-53: an urgent official message appears even where the user has
     * silenced the conversation.
     */
    public getFeed(): NotificationEntry[] {
        const client = this.clientService.getClient();
        if (!client) return [];

        try {
            const me = client.getUserId() ?? "";
            const entries = new Map<string, NotificationEntry>();

            for (const room of client.getRooms() ?? []) {
                if (typeof (room as any).getMyMembership === "function" && room.getMyMembership() !== "join") {
                    continue;
                }

                const level = this.getLevel(room.roomId);
                for (const entry of this.readRoomEntries(room, me, level)) {
                    entries.set(entry.id, entry);
                }
            }

            return [...entries.values()]
                .sort((a, b) => b.sentAt - a.sentAt)
                .slice(0, FEED_LIMIT);
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixNotificationService] Unable to read notifications:", detail);
            return [];
        }
    }

    /**
     * NT-4: mark one entry read.
     *
     * Reported to the platform as a read position, which is the same fact the
     * timeline and the unread counts are built from — so the entry, the unread
     * count, and the conversation list all clear together, in every tab and on
     * every device (EDGE-9, EDGE-10).
     */
    public async markRead(entry: NotificationEntry): Promise<void> {
        await this.receiptService.markRead(entry.conversationId, entry.id);
    }

    /** NT-4: mark everything the centre is showing as read. */
    public async markAllRead(): Promise<void> {
        // The newest entry per conversation carries the rest of that
        // conversation with it: a read position is a position, not a list.
        const newestPerRoom = new Map<string, NotificationEntry>();

        for (const entry of this.getFeed()) {
            const held = newestPerRoom.get(entry.conversationId);
            if (!held || entry.sentAt > held.sentAt) newestPerRoom.set(entry.conversationId, entry);
        }

        await Promise.all([...newestPerRoom.values()].map((entry) => this.markRead(entry)));
    }

    public subscribe(listener: NotificationListener): () => void {
        this.listeners.add(listener);
        this.attach();

        return () => {
            this.listeners.delete(listener);
            if (this.listeners.size === 0) {
                this.detach?.();
                this.detach = null;
            }
        };
    }

    /**
     * NT-9 / FR-53: whether a message content carries the urgency designation.
     *
     * Public because the conversation list needs the same answer while it is
     * already walking a room's recent events for its preview — asking a second
     * service to walk them again would double the cost of every room (PERF-10).
     * The designation itself is declared once, here.
     */
    public isUrgentContent(content: unknown): boolean {
        if (!content || typeof content !== "object") return false;
        return (content as Record<string, unknown>)[getNotificationPolicy().urgencyKey] === true;
    }

    /** The entries one conversation contributes to the feed. */
    private readRoomEntries(room: any, me: string, level: NotificationLevel): NotificationEntry[] {
        const kind = this.classifyRoom(room);

        return this.readUnreadEvents(room, me)
            .map((event) => {
                const urgent = this.isUrgent(event);
                const mention = this.isMention(event, room, me);

                /*
                 * NT-5 in force: a silenced conversation contributes nothing,
                 * and a mentions-only conversation contributes only mentions —
                 * except for an urgent official message, which NT-9 admits
                 * regardless of the level.
                 */
                if (!urgent) {
                    if (level === "none") return null;
                    if (level === "mentions" && !mention) return null;
                }

                const content = typeof event.getContent === "function" ? event.getContent() : {};
                const body = typeof content?.body === "string" ? content.body : "";
                if (body === "") return null;

                const senderId: string = event.getSender?.() ?? "";
                const entryKind: NotificationKind = mention ? "mention" : kind;

                return {
                    id: event.getId?.() ?? "",
                    conversationId: room.roomId,
                    conversationName: room.name || room.roomId,
                    kind: entryKind,
                    senderName: room.getMember?.(senderId)?.name || event.sender?.name || senderId,
                    body,
                    sentAt: typeof event.getTs === "function" ? event.getTs() : 0,
                    isUrgent: urgent,
                } satisfies NotificationEntry;
            })
            .filter((entry): entry is NotificationEntry => entry !== null && entry.id !== "");
    }

    /**
     * The messages in a room that sit past this user's read position.
     *
     * Bounded to the recent window: a conversation the user has never opened
     * would otherwise contribute its entire history to the feed (EDGE-2).
     */
    private readUnreadEvents(room: any, me: string): any[] {
        const timeline = typeof room.getLiveTimeline === "function" ? room.getLiveTimeline() : null;
        const events: any[] = timeline?.getEvents?.() ?? (Array.isArray(room.timeline) ? room.timeline : []);

        const readUpTo: string | null =
            typeof room.getEventReadUpTo === "function" ? room.getEventReadUpTo(me, true) : null;

        const window = events.slice(Math.max(0, events.length - FEED_SCAN_LIMIT));
        const readIndex = readUpTo ? window.findIndex((event) => event?.getId?.() === readUpTo) : -1;

        return window
            .slice(readIndex + 1)
            .filter(
                (event) =>
                    typeof event?.getType === "function" &&
                    event.getType() === "m.room.message" &&
                    event.getSender?.() !== me,
            );
    }

    /** NT-3: which of the three kinds of activity a conversation produces. */
    private classifyRoom(room: any): NotificationKind {
        const alias = typeof room.getCanonicalAlias === "function" ? room.getCanonicalAlias() : null;
        if (alias) return "channel";

        const memberCount =
            typeof room.getJoinedMemberCount === "function" ? room.getJoinedMemberCount() : 0;
        return memberCount <= 2 ? "direct" : "channel";
    }

    /**
     * NT-2: whether this message mentions the reader.
     *
     * The intentional mentions the sender declared are authoritative where they
     * exist; a name appearing in the body is the fallback for clients that do
     * not declare them.
     */
    private isMention(event: any, room: any, me: string): boolean {
        try {
            const content = typeof event.getContent === "function" ? event.getContent() : {};

            const declared = content?.["m.mentions"]?.user_ids;
            if (Array.isArray(declared)) return declared.includes(me);

            const body = typeof content?.body === "string" ? content.body : "";
            if (body === "") return false;

            const displayName = room.getMember?.(me)?.name;
            return (
                body.includes(me) ||
                (typeof displayName === "string" && displayName !== "" && body.includes(displayName))
            );
        } catch {
            return false;
        }
    }

    /** NT-9 / FR-53: the urgency designation the deployment declares. */
    private isUrgent(event: any): boolean {
        try {
            return this.isUrgentContent(typeof event.getContent === "function" ? event.getContent() : null);
        } catch {
            return false;
        }
    }

    /** The override rule this service wrote for a room, if it is there. */
    private findOverrideRule(roomId: string): IPushRule | undefined {
        const client = this.clientService.getClient();
        const rules = client?.pushRules?.global?.override;
        if (!Array.isArray(rules)) return undefined;

        return rules.find(
            (rule) =>
                rule?.rule_id === roomId ||
                (Array.isArray(rule?.conditions) &&
                    rule.conditions.some(
                        (condition: any) => condition?.key === "room_id" && condition?.pattern === roomId,
                    )),
        );
    }

    /** A rule that is on and notifies about nothing is a rule that silences. */
    private isSuppressing(rule: IPushRule | undefined): boolean {
        if (!rule || rule.enabled === false) return false;

        const actions: unknown[] = Array.isArray(rule.actions) ? rule.actions : [];
        // The historic "dont_notify" action and the modern empty action list
        // mean the same thing to the user.
        return actions.length === 0 || actions.includes(PushRuleActionName.DontNotify);
    }

    private async clearRule(kind: PushRuleKind, roomId: string): Promise<void> {
        const client = this.clientService.getClient();
        if (!client) return;

        const existing =
            kind === PushRuleKind.Override
                ? this.findOverrideRule(roomId)
                : client.getRoomPushRule("global", roomId);
        if (!existing) return;

        try {
            await client.deletePushRule("global", kind, existing.rule_id);
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn(`[MatrixNotificationService] Unable to clear a rule for ${roomId}:`, detail);
        }
    }

    private attach(): void {
        if (this.detach) return;

        const client = this.clientService.getClient();
        if (!client) return;

        const notify = (): void => {
            this.listeners.forEach((listener) => {
                try {
                    listener();
                } catch (error: unknown) {
                    const detail = error instanceof Error ? error.message : String(error);
                    console.warn("[MatrixNotificationService] Error in subscriber:", detail);
                }
            });
        };

        /*
         * Blueprint §8: this is the only place these platform events are read,
         * so no hook or component imports the SDK to watch them. Receipts are
         * included because a message read on another device clears an entry
         * here without anything new arriving (NT-8, EDGE-9, EDGE-10).
         */
        const events = [
            ClientEvent.Sync,
            ClientEvent.AccountData,
            RoomEvent.Timeline,
            RoomEvent.Receipt,
        ] as const;

        try {
            events.forEach((event) => client.on(event as any, notify));
        } catch (error: unknown) {
            const detail = error instanceof Error ? error.message : String(error);
            console.warn("[MatrixNotificationService] Unable to observe notifications:", detail);
            return;
        }

        this.detach = () => {
            try {
                events.forEach((event) => client.removeListener(event as any, notify));
            } catch {
                // The listeners go out of scope with the client.
            }
        };
    }
}
