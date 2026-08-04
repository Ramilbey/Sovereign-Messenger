/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Tooltip.tsx — CMP-6 Tooltip
 *
 * Purpose: supplementary label for an adjacent control.
 * States (UI-5): hidden, visible.
 * Responsibility: reachable by keyboard as well as pointer (A11Y-1) — it opens
 * on focus, not only on hover — and dismissible with Escape. A tooltip must
 * never be the sole carrier of meaning; it supplements a control that already
 * has an accessible name.
 */

import React, {
    memo,
    useCallback,
    useId,
    useState,
    type JSX,
    type KeyboardEvent,
    type ReactNode,
} from "react";

import "./ui.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
    /** Supplementary text. Never the only source of this information. */
    content: string;
    placement?: TooltipPlacement;
    children: ReactNode;
    className?: string;
}

export const Tooltip = memo(function Tooltip({
    content,
    placement = "top",
    children,
    className,
}: TooltipProps): JSX.Element {
    const [visible, setVisible] = useState(false);
    const tooltipId = useId();

    const show = useCallback(() => setVisible(true), []);
    const hide = useCallback(() => setVisible(false), []);

    // A11Y-1: Escape dismisses without moving focus.
    const onKeyDown = useCallback((event: KeyboardEvent<HTMLSpanElement>) => {
        if (event.key === "Escape") {
            setVisible(false);
        }
    }, []);

    return (
        <span
            className={["svr-tooltip-anchor", className].filter(Boolean).join(" ")}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocusCapture={show}
            onBlurCapture={hide}
            onKeyDown={onKeyDown}
            aria-describedby={visible ? tooltipId : undefined}
        >
            {children}
            {visible && (
                <span role="tooltip" id={tooltipId} className={`svr-tooltip svr-tooltip--${placement}`}>
                    {content}
                </span>
            )}
        </span>
    );
});
