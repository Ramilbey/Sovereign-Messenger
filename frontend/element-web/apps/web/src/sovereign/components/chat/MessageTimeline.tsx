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

import React, { memo, useRef, useEffect, useState, useCallback, useMemo, type JSX } from "react";

import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { UnavailableMessage } from "./UnavailableMessage";
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

interface MessageTimelineProps {
    messages: SovereignMessage[];
    currentUserId: string;
    /** ES-1: the timeline carries the same four states as any other surface. */
    state?: ResourceState;
}

type TimelineItem =
    | { kind: "date"; key: string; label: string }
    | { kind: "message"; key: string; message: SovereignMessage; showSender: boolean };

export const MessageTimeline = memo(function MessageTimeline({
    messages,
    currentUserId,
    state = "ready",
}: MessageTimelineProps): JSX.Element {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
    const prevMessagesLength = useRef<number>(messages.length);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBottomBtn(scrollHeight - scrollTop - clientHeight > 150);
    }, []);

    useEffect(() => {
        if (!scrollRef.current) return;

        const container = scrollRef.current;
        const isNewMessage = messages.length > prevMessagesLength.current;
        prevMessagesLength.current = messages.length;

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

    /**
     * FR-32 / FR-33: day boundaries and sender grouping are decided once here,
     * so the render pass has no decisions left to make.
     */
    const items = useMemo<TimelineItem[]>(() => {
        const result: TimelineItem[] = [];
        let lastDate = "";
        let previous: SovereignMessage | null = null;

        messages.forEach((message, index) => {
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
    }, [messages]);

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
                    {items.map((item) => {
                        if (item.kind === "date") {
                            return <DateSeparator key={item.key} dateLabel={item.label} />;
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
