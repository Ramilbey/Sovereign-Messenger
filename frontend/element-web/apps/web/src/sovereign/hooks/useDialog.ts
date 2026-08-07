/*
 * Sovereign Messenger — Sprint 3, Milestone 5 (Discovery & Polish)
 * useDialog.ts — CMP-47 Dialog behaviour
 *
 * A11Y-1 / A11Y-3: focus moves into the surface when it opens, stays inside
 * while it is open, and returns to whatever opened it on close. Escape closes.
 *
 * Search, the notification centre, and the profile each carried their own copy
 * of this — three chances for one of them to drift, and three places to fix a
 * focus bug. The behaviour is the same in all three because the requirement is
 * the same in all three, so it is written once.
 */

import { useCallback, useEffect, useRef, type RefObject } from "react";

/** Everything that can hold focus inside a dialog. */
const FOCUSABLE = 'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])';

export interface DialogBehaviour<T extends HTMLElement> {
    /** Attach to the dialog's own element. */
    ref: RefObject<T | null>;
}

export function useDialog<T extends HTMLElement>(onClose: () => void): DialogBehaviour<T> {
    const ref = useRef<T | null>(null);
    const returnFocusTo = useRef<Element | null>(null);

    const focusable = useCallback((): HTMLElement[] => {
        const elements = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
        return elements ? Array.from(elements) : [];
    }, []);

    // A11Y-3: focus enters on open and is put back on close. Where the caller
    // marks its own entry point, that is where focus lands; otherwise the
    // first control is a sound default.
    useEffect(() => {
        returnFocusTo.current = document.activeElement;

        const preferred = ref.current?.querySelector<HTMLElement>("[data-svr-autofocus]");
        (preferred ?? focusable()[0])?.focus();

        return () => (returnFocusTo.current as HTMLElement | null)?.focus?.();
    }, [focusable]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== "Tab") return;

            const elements = focusable();
            if (elements.length === 0) return;

            const first = elements[0];
            const last = elements[elements.length - 1];

            // A11Y-1: the wrap is what keeps this a dialog rather than a trap
            // — tabbing never leaves it, and Escape always does.
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose, focusable]);

    return { ref };
}
