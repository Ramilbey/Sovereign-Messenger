/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * useBreakpoint.ts — Responsive Breakpoint
 *
 * UI-13: three breakpoints — compact (below 768px), standard (768–1279px),
 * and wide (1280px and above).
 *
 * The frame needs to know which one applies, because the difference is
 * structural rather than cosmetic: at compact one surface is presented at a
 * time (UI-16), and a stylesheet cannot decide which. The same boundaries are
 * mirrored in SovereignLayout.css, which handles the purely visual part.
 *
 * NFR-2 / A11Y-9: the boundaries are in pixels rather than viewport units so
 * they behave predictably at 200% zoom, where the effective viewport narrows
 * and the interface is expected to adopt a narrower layout rather than break.
 */

import { useEffect, useState } from "react";

export type Breakpoint = "compact" | "standard" | "wide";

/** UI-13. Mirrored by the media queries in SovereignLayout.css. */
export const BREAKPOINT_STANDARD_MIN = 768;
export const BREAKPOINT_WIDE_MIN = 1280;

function resolve(width: number): Breakpoint {
    if (width >= BREAKPOINT_WIDE_MIN) return "wide";
    if (width >= BREAKPOINT_STANDARD_MIN) return "standard";
    return "compact";
}

/** The breakpoint currently in force. */
export function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
        typeof window === "undefined" ? "wide" : resolve(window.innerWidth),
    );

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

        const standard = window.matchMedia(`(min-width: ${BREAKPOINT_STANDARD_MIN}px)`);
        const wide = window.matchMedia(`(min-width: ${BREAKPOINT_WIDE_MIN}px)`);

        const update = (): void => setBreakpoint(resolve(window.innerWidth));
        update();

        standard.addEventListener("change", update);
        wide.addEventListener("change", update);

        return () => {
            standard.removeEventListener("change", update);
            wide.removeEventListener("change", update);
        };
    }, []);

    return breakpoint;
}
