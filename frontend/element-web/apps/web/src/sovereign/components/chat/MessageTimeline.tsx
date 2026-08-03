/*
 * Sovereign Messenger — Sprint 1, Step 7.2
 * MessageTimeline.tsx — Pure presentation component for scrollable chat timeline.
 *
 * Implements Smart Auto-Scroll Policy:
 *   - Outgoing messages: Always auto-scrolls to bottom smoothly.
 *   - Incoming messages: Auto-scrolls ONLY IF user is near the bottom (<100px).
 *   - Otherwise preserves scroll position and shows "Yangi xabarlar" scroll button.
 */

import React, { memo, useRef, useEffect, useState, useCallback, useMemo, type JSX } from "react";
import type { SovereignMessage } from "../../services/MessageService";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";

interface MessageTimelineProps {
    messages: SovereignMessage[];
    currentUserId: string;
    userInitialsMap?: Record<string, string>;
}

export const MessageTimeline = memo(function MessageTimeline({
    messages,
    currentUserId,
    userInitialsMap = {},
}: MessageTimelineProps): JSX.Element {
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
    const prevMessagesLength = useRef<number>(messages.length);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior,
            });
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        setShowScrollBottomBtn(distanceFromBottom > 150);
    }, []);

    // Smart Auto-Scroll Effect
    useEffect(() => {
        if (!scrollRef.current) return;

        const container = scrollRef.current;
        const isNewMessage = messages.length > prevMessagesLength.current;
        prevMessagesLength.current = messages.length;

        if (isNewMessage) {
            const lastMsg = messages[messages.length - 1];
            const isOutgoing = lastMsg?.senderId === currentUserId;
            const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
            const isNearBottom = distanceFromBottom < 120;

            if (isOutgoing || isNearBottom) {
                scrollToBottom("smooth");
            }
        }
    }, [messages, currentUserId, scrollToBottom]);

    // Initial scroll on mount/channel switch
    useEffect(() => {
        scrollToBottom("instant");
    }, [scrollToBottom]);

    // Group messages by date
    const groupedItems = useMemo(() => {
        const result: Array<{ type: "date"; label: string } | { type: "msg"; message: SovereignMessage }> = [];
        let lastDate = "";

        messages.forEach((msg) => {
            if (msg.date !== lastDate) {
                lastDate = msg.date;
                result.push({ type: "date", label: msg.date });
            }
            result.push({ type: "msg", message: msg });
        });

        return result;
    }, [messages]);

    return (
        <div className="svr-timeline-container">
            <div ref={scrollRef} className="svr-timeline-scroll" onScroll={handleScroll}>
                {groupedItems.map((item, index) => {
                    if (item.type === "date") {
                        return <DateSeparator key={`date-${item.label}-${index}`} dateLabel={item.label} />;
                    }

                    const msg = item.message;
                    const isOutgoing = msg.senderId === currentUserId;
                    const avatarInitials = userInitialsMap[msg.senderId] || msg.senderName.slice(0, 2).toUpperCase();

                    return (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOutgoing={isOutgoing}
                            avatarInitials={avatarInitials}
                        />
                    );
                })}
            </div>

            {/* Floating scroll to bottom pill */}
            {showScrollBottomBtn && (
                <button
                    className="svr-scroll-bottom-btn"
                    onClick={() => scrollToBottom("smooth")}
                    title="Pastga tushish"
                >
                    ↓ Yangi xabarlar
                </button>
            )}
        </div>
    );
});
