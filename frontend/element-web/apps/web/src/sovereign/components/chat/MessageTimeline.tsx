/*
 * Sovereign Messenger — Sprint 1, Step 7.2 · Sprint 3, Milestone 3
 * MessageTimeline.tsx — Conversation Timeline
 *
 * FR-32: consecutive messages from one sender within a short interval are
 * grouped, with the sender shown once (CMP-22).
 * FR-33: date separators divide the timeline by day, using relative labels.
 * FR-35: a message that cannot be displayed is rendered as a defined state,
 * never as message text (CMP-23).
 * COM-8: order follows server time, so a message does not move once shown.
 *
 * Auto-scroll policy: outgoing messages always scroll into view; incoming ones
 * only when the reader is already at the bottom, so an arriving message never
 * pulls a reader away from what they are reading (NT-10).
 */

import React, {
    memo,
    useRef,
    useEffect,
    useLayoutEffect,
    useState,
    useCallback,
    useMemo,
    type JSX,
} from "react";

import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { UnavailableMessage } from "./UnavailableMessage";
import { UnreadDivider } from "./UnreadDivider";
import { ModuleStateBoundary } from "../views/ModuleStateBoundary";
import { Icon } from "../ui";
import { CHAT_COPY } from "../../config/chatCopy";
import type { SovereignMessage } from "../../services/MessageService";
import type { ResourceState } from "../../types/resource";

/**
 * FR-32: how close in time two messages from one sender must be to be grouped.
 * Beyond this the sender is shown again, because a later message reads as a
 * new contribution rather than a continuation.
 */
const GROUPING_WINDOW_MS = 5 * 60 * 1000;

/**
 * EDGE-2 / PERF-9: how many messages are kept in the DOM at once.
 *
 * A conversation of 100,000 messages must not put 100,000 nodes on the page,
 * or memory grows without bound over an eight-hour shift. Older messages stay
 * in the loaded model and re-enter the window as the reader scrolls up.
 */
const RENDER_WINDOW = 150;

/** How close to the top counts as "asking for earlier messages" (FR-36). */
const PAGINATION_THRESHOLD_PX = 200;

interface MessageTimelineProps {
    messages: SovereignMessage[];
    currentUserId: string;
    /** ES-1: the timeline carries the same four states as any other surface. */
    state?: ResourceState;
    /** FR-36: whether earlier messages remain to be loaded. */
    hasEarlier?: boolean;
    isLoadingEarlier?: boolean;
    onLoadEarlier?: () => void;
    /** FR-37: the message the reader had read up to on entering. */
    readUpToId?: string | null;
    /** FR-21: called when a message becomes visible to a focused window. */
    onMessageRead?: (eventId: string) => void;
    /** FR-19: opens the acknowledgement summary for one of my messages. */
    onShowAcknowledgement?: (eventId: string) => void;
}

type TimelineItem =
    | { kind: "date"; key: string; label: string }
    | { kind: "unread"; key: string }
    | { kind: "message"; key: string; message: SovereignMessage; showSender: boolean };

export const MessageTimeline = memo(function MessageTimeline({
    messages,
    currentUserId,
    state = "ready",
    hasEarlier = false,
    isLoadingEarlier = false,
    onLoadEarlier,
    readUpToId = null,
    onMessageRead,
    onShowAcknowledgement,
}: MessageTimelineProps): JSX.Element {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
    const prevMessagesLength = useRef<number>(messages.length);

    /*
     * EDGE-2: how far back the reader has scrolled, in messages. Grows as they
     * move up; the newest RENDER_WINDOW messages before this point are the
     * ones actually rendered.
     */
    const [windowSize, setWindowSize] = useState<number>(RENDER_WINDOW);

    /*
     * FR-36: the scroll anchor captured before a page of earlier messages is
     * inserted, so the reader keeps their position instead of being thrown to
     * the top when the content above them grows.
     */
    const anchor = useRef<{ height: number; top: number } | null>(null);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
        }
    }, []);

    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        setShowScrollBottomBtn(scrollHeight - scrollTop - clientHeight > 150);

        if (scrollTop > PAGINATION_THRESHOLD_PX) return;

        /*
         * Nearing the top: first widen the render window over messages already
         * loaded, and only ask the transport for more once everything held is
         * on screen (FR-36, EDGE-2).
         */
        if (windowSize < messages.length) {
            anchor.current = { height: scrollHeight, top: scrollTop };
            setWindowSize((size) => Math.min(size + RENDER_WINDOW, messages.length));
            return;
        }

        if (hasEarlier && !isLoadingEarlier && onLoadEarlier) {
            anchor.current = { height: scrollHeight, top: scrollTop };
            onLoadEarlier();
        }
    }, [windowSize, messages.length, hasEarlier, isLoadingEarlier, onLoadEarlier]);

    /*
     * FR-36: restore the reader's position after content is inserted above
     * them. Runs before paint, so the timeline never visibly jumps.
     */
    useLayoutEffect(() => {
        const container = scrollRef.current;
        if (!container || !anchor.current) return;

        const { height, top } = anchor.current;
        anchor.current = null;
        container.scrollTop = top + (container.scrollHeight - height);
    }, [messages, windowSize]);

    // A new conversation starts at the newest messages again.
    useEffect(() => {
        setWindowSize(RENDER_WINDOW);
    }, [readUpToId]);

    useEffect(() => {
        if (!scrollRef.current) return;

        const container = scrollRef.current;
        const isNewMessage = messages.length > prevMessagesLength.current;
        prevMessagesLength.current = messages.length;

        // An older page arriving is not a new message and must not scroll.
        if (anchor.current) return;

        if (isNewMessage) {
            const lastMsg = messages[messages.length - 1];
            const isOutgoing = lastMsg?.senderId === currentUserId;
            const isNearBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 120;

            if (isOutgoing || isNearBottom) {
                scrollToBottom("smooth");
            }
        }
    }, [messages, currentUserId, scrollToBottom]);

    useEffect(() => {
        scrollToBottom("instant");
    }, [scrollToBottom]);

    /*
     * FR-21: a message is read when it becomes visible and the window has
     * focus. The newest visible message carries the position, so reporting it
     * marks everything above it too — that is what a read position means.
     */
    useEffect(() => {
        if (!onMessageRead || messages.length === 0) return;

        const container = scrollRef.current;
        if (!container) return;

        const report = (): void => {
            const distanceFromBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight;
            if (distanceFromBottom > 150) return;

            const newest = messages[messages.length - 1];
            if (newest && !newest.unavailable) onMessageRead(newest.id);
        };

        report();
        window.addEventListener("focus", report);
        return () => window.removeEventListener("focus", report);
    }, [messages, onMessageRead]);

    /**
     * FR-32 / FR-33: day boundaries and sender grouping are decided once here,
     * so the render pass has no decisions left to make.
     */
    const items = useMemo<TimelineItem[]>(() => {
        const result: TimelineItem[] = [];
        let lastDate = "";
        let previous: SovereignMessage | null = null;

        /*
         * EDGE-2 / PERF-9: only the newest `windowSize` messages are rendered.
         * The rest stay in the model and re-enter as the reader scrolls up, so
         * a 100,000-message history costs a bounded number of DOM nodes.
         */
        const visible = messages.slice(Math.max(0, messages.length - windowSize));

        /*
         * FR-37: the divider goes above the first message after the one the
         * reader had read up to. Resolved against the whole loaded history,
         * not the window, so scrolling does not move it.
         */
        const readIndex = readUpToId ? messages.findIndex((m) => m.id === readUpToId) : -1;
        const firstUnreadId =
            readIndex >= 0 && readIndex < messages.length - 1 ? messages[readIndex + 1].id : null;

        visible.forEach((message, index) => {
            if (message.date !== lastDate) {
                lastDate = message.date;
                result.push({ kind: "date", key: `date-${message.date}-${index}`, label: message.date });
                previous = null;
            }

            /*
             * A different sender, a gap longer than the grouping window, or an
             * unavailable message on either side starts a new group — a
             * continuation must genuinely continue something readable.
             */
            /*
             * FR-37: drawn once, above the first unread message. A message the
             * reader sent themselves does not open an unread boundary.
             */
            if (message.id === firstUnreadId && message.senderId !== currentUserId) {
                result.push({ kind: "unread", key: `unread-${message.id}` });
                previous = null;
            }

            const previousMessage: SovereignMessage | null = previous;
            const sameSender = previousMessage?.senderId === message.senderId;
            const withinWindow =
                previousMessage?.sentAt !== undefined && message.sentAt !== undefined
                    ? message.sentAt - previousMessage.sentAt <= GROUPING_WINDOW_MS
                    : // Demonstration data carries no clock, so grouping falls
                      // back to sender identity rather than guessing a time.
                      true;
            const readable = !message.unavailable && !previousMessage?.unavailable;

            result.push({
                kind: "message",
                key: message.id,
                message,
                showSender: !(sameSender && withinWindow && readable),
            });

            previous = message;
        });

        return result;
    }, [messages, windowSize, readUpToId, currentUserId]);

    return (
        <div className="svr-timeline-container">
            <ModuleStateBoundary state={state} surface="timeline" loadingRows={5}>
                <div
                    ref={scrollRef}
                    className="svr-timeline-scroll"
                    onScroll={handleScroll}
                    /* A11Y-7: arriving messages are announced without stealing focus. */
                    aria-live="polite"
                    aria-relevant="additions"
                >
                    {/* FR-36: progress while an earlier page is on its way (UX-6). */}
                    {isLoadingEarlier && (
                        <p className="svr-timeline__loading-earlier" role="status" aria-live="polite">
                            {CHAT_COPY.loadingEarlier}
                        </p>
                    )}

                    {items.map((item) => {
                        if (item.kind === "date") {
                            return <DateSeparator key={item.key} dateLabel={item.label} />;
                        }

                        if (item.kind === "unread") {
                            return <UnreadDivider key={item.key} />;
                        }

                        const { message } = item;

                        // FR-35 / COM-6: never rendered as message text.
                        if (message.unavailable) {
                            return (
                                <UnavailableMessage
                                    key={item.key}
                                    senderName={message.senderName}
                                    timestamp={message.timestamp}
                                />
                            );
                        }

                        return (
                            <MessageBubble
                                key={item.key}
                                message={message}
                                isOutgoing={message.senderId === currentUserId}
                                showSender={item.showSender}
                                onShowAcknowledgement={onShowAcknowledgement}
                            />
                        );
                    })}
                </div>
            </ModuleStateBoundary>

            {showScrollBottomBtn && (
                <button
                    type="button"
                    className="svr-scroll-bottom-btn"
                    onClick={() => scrollToBottom("smooth")}
                    aria-label={CHAT_COPY.scrollToLatest}
                >
                    <Icon name="chevron-down" size="sm" />
                    {CHAT_COPY.newMessages}
                </button>
            )}
        </div>
    );
});
