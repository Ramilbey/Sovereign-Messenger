/*
 * Sovereign Messenger — Sprint 3, Milestone 4 (Real-Time Capabilities)
 * DropZone.tsx — CMP-37 Drop Zone
 *
 * FR-23: a user can attach files by dragging them onto the conversation.
 *
 * States (CMP-37): idle, active, rejecting.
 *
 * The zone wraps the conversation rather than occupying its own strip, so the
 * whole surface is a target — a user dragging a case document should not have
 * to find a small rectangle to aim at.
 */

import React, { memo, useCallback, useRef, useState, type JSX, type ReactNode } from "react";

import { Icon } from "../ui";
import { FILE_COPY } from "../../config/fileCopy";

interface Props {
    onFiles: (files: File[]) => void;
    /** COM-2: no drop target where the user may not post. */
    disabled?: boolean;
    children: ReactNode;
}

export const DropZone = memo(function DropZone({ onFiles, disabled = false, children }: Props): JSX.Element {
    const [active, setActive] = useState(false);
    /*
     * Drag events fire for every child element entered and left, so a plain
     * boolean flickers as the pointer crosses the timeline. Counting entries
     * against leaves keeps the state steady.
     */
    const depth = useRef(0);

    const reset = useCallback(() => {
        depth.current = 0;
        setActive(false);
    }, []);

    const onDragEnter = useCallback(
        (event: React.DragEvent) => {
            if (disabled || !event.dataTransfer?.types?.includes("Files")) return;
            event.preventDefault();
            depth.current += 1;
            setActive(true);
        },
        [disabled],
    );

    const onDragLeave = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) reset();
    }, [reset]);

    const onDragOver = useCallback(
        (event: React.DragEvent) => {
            if (disabled || !event.dataTransfer?.types?.includes("Files")) return;
            // Without this the browser navigates to the dropped file.
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
        },
        [disabled],
    );

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            if (disabled) return;
            event.preventDefault();
            reset();

            const files = Array.from(event.dataTransfer?.files ?? []);
            if (files.length > 0) onFiles(files);
        },
        [disabled, onFiles, reset],
    );

    return (
        <div
            className={`svr-drop-zone${active ? " is-active" : ""}`}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {children}

            {/*
             * The overlay is presentational: dragging is a pointer gesture, and
             * the keyboard route to the same outcome is the attach button
             * beside the composer (FR-23).
             */}
            {active && (
                <div className="svr-drop-zone__overlay" aria-hidden="true">
                    <Icon name="attachment" size="lg" />
                    <span>{FILE_COPY.dropHere}</span>
                </div>
            )}
        </div>
    );
});
