/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Spinner.tsx — CMP-7 Spinner / Skeleton
 *
 * Purpose: loading indication.
 * States (UI-5): indeterminate (Spinner), skeleton (Skeleton).
 * Responsibility: ES-6 and UX-13 require loading states to reserve the final
 * layout dimensions so content does not shift when it arrives. Skeleton exists
 * precisely for that: it is given the shape of the content it stands in for.
 * Motion respects the reduced-motion preference via the duration tokens (TOK-9).
 */

import React, { memo, type CSSProperties, type JSX } from "react";

import "./ui.css";

export type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
    size?: SpinnerSize;
    /**
     * Accessible description of what is loading. Omit when the spinner sits
     * inside a control that already announces its busy state (e.g. Button).
     */
    label?: string;
    className?: string;
}

export const Spinner = memo(function Spinner({
    size = "md",
    label,
    className,
}: SpinnerProps): JSX.Element {
    return (
        <span
            className={["svr-spinner", `svr-spinner--${size}`, className].filter(Boolean).join(" ")}
            role={label ? "status" : undefined}
            aria-label={label}
            aria-hidden={label ? undefined : true}
        >
            <span className="svr-spinner__track" />
        </span>
    );
});

export type SkeletonShape = "text" | "title" | "circle" | "block";

interface SkeletonProps {
    shape?: SkeletonShape;
    /** CSS width, e.g. "100%" or "180px". */
    width?: string;
    /** CSS height. Defaults are derived from `shape`. */
    height?: string;
    /** Number of stacked lines. Applies to the text shape only. */
    lines?: number;
    className?: string;
}

export const Skeleton = memo(function Skeleton({
    shape = "text",
    width,
    height,
    lines = 1,
    className,
}: SkeletonProps): JSX.Element {
    const style: CSSProperties = {};
    if (width) style.width = width;
    if (height) style.height = height;

    const classes = ["svr-skeleton", `svr-skeleton--${shape}`, className].filter(Boolean).join(" ");

    if (shape === "text" && lines > 1) {
        return (
            /* Decorative placeholder — the surrounding region announces loading. */
            <span className="svr-skeleton-group" aria-hidden="true">
                {Array.from({ length: lines }, (_, index) => (
                    <span
                        key={index}
                        className={classes}
                        /* Final line is shortened so the block reads as prose. */
                        style={index === lines - 1 ? { ...style, width: "62%" } : style}
                    />
                ))}
            </span>
        );
    }

    return <span className={classes} style={style} aria-hidden="true" />;
});
