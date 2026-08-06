/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * ImageViewer.tsx — CMP-36 Image Viewer
 *
 * FR-27 / EDGE-4: full resolution loads only on explicit open, so a large
 * evidence photograph costs nothing until someone asks to see it.
 *
 * A11Y-3: focus moves into the viewer on open and returns to the control that
 * opened it on close; Escape closes it; focus cannot leave while it is open.
 */

import React, { memo, useEffect, useRef, type JSX } from "react";

import { IconButton } from "../ui";
import { FILE_COPY } from "../../config/fileCopy";

interface Props {
    src: string;
    name: string;
    onClose: () => void;
}

export const ImageViewer = memo(function ImageViewer({ src, name, onClose }: Props): JSX.Element {
    const dialog = useRef<HTMLDivElement | null>(null);
    const closeButton = useRef<HTMLButtonElement | null>(null);
    const returnFocusTo = useRef<Element | null>(null);

    useEffect(() => {
        returnFocusTo.current = document.activeElement;
        closeButton.current?.focus();

        // A11Y-3: focus returns where it came from, so a keyboard user is not
        // dropped at the top of the document when the viewer closes.
        return () => (returnFocusTo.current as HTMLElement | null)?.focus?.();
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
                return;
            }

            // A11Y-1 / A11Y-3: a focus trap, so Tab cycles within the viewer
            // rather than wandering into the page behind it.
            if (event.key !== "Tab") return;

            const focusable = dialog.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
            );
            if (!focusable || focusable.length === 0) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

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
    }, [onClose]);

    return (
        <div
            className="svr-image-viewer"
            role="dialog"
            aria-modal="true"
            aria-label={name}
            ref={dialog}
            onClick={(event) => {
                // Clicking the surrounding scrim closes; clicking the image
                // does not, so a mis-aimed click does not lose the view.
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="svr-image-viewer__bar">
                <span className="svr-image-viewer__name">{name}</span>
                <IconButton
                    ref={closeButton}
                    icon="close"
                    label={FILE_COPY.closeViewer}
                    variant="ghost"
                    onClick={onClose}
                />
            </div>

            {/* A11Y-8: the filename is the text alternative; it is the only
                description the platform actually holds for this image. */}
            <img className="svr-image-viewer__image" src={src} alt={name} />
        </div>
    );
});
