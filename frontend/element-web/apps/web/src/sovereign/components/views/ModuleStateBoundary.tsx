/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * ModuleStateBoundary.tsx — Per-Surface State Renderer
 *
 * Implements ES-1 (all four states on every surface) and ES-2 (empty and
 * unavailable are visually and textually distinct) in one place, so that no
 * surface can accidentally omit a state or invent its own copy.
 *
 * Children render only in the `ready` state. Every other state is rendered
 * from the authoritative copy table (ES-7), which is why call sites pass a
 * surface identifier rather than strings.
 */

import React, { memo, type JSX, type ReactNode } from "react";

import { EmptyState, ErrorState, Skeleton } from "../ui";
import { RETRY_LABEL, SURFACE_COPY, type SurfaceId } from "../../config/stateCopy";
import type { ResourceState } from "../../types/resource";

interface ModuleStateBoundaryProps {
    state: ResourceState;
    /** Identifies which copy block from PRD section 8.11 applies. */
    surface: SurfaceId;
    /** ES-5: retry action for the error state. */
    onRetry?: () => void;
    /** Number of skeleton rows to reserve while loading (ES-6). */
    loadingRows?: number;
    children: ReactNode;
}

export const ModuleStateBoundary = memo(function ModuleStateBoundary({
    state,
    surface,
    onRetry,
    loadingRows = 4,
    children,
}: ModuleStateBoundaryProps): JSX.Element {
    const copy = SURFACE_COPY[surface];

    if (state === "loading") {
        // ES-6 / UX-13: reserve the final dimensions so content does not shift.
        return (
            <div className="svr-module-state" aria-busy="true" aria-live="polite">
                <span className="svr-visually-hidden">{copy.loading}</span>
                {Array.from({ length: loadingRows }, (_, i) => (
                    <Skeleton key={i} shape="block" />
                ))}
            </div>
        );
    }

    if (state === "error") {
        return (
            <div className="svr-module-state">
                <ErrorState
                    title={copy.error}
                    onRetry={onRetry}
                    retryLabel={RETRY_LABEL}
                    noActionReason={onRetry ? undefined : "Iltimos, keyinroq qayta urinib ko'ring."}
                />
            </div>
        );
    }

    if (state === "unavailable") {
        // FR-2 / ES-2: distinct from empty — this is not part of the release.
        return (
            <div className="svr-module-state">
                <EmptyState
                    variant="unavailable"
                    title={copy.unavailable ?? copy.empty}
                    icon="lock"
                />
            </div>
        );
    }

    if (state === "empty") {
        return (
            <div className="svr-module-state">
                <EmptyState variant="empty" title={copy.empty} description={copy.emptyDescription} />
            </div>
        );
    }

    return <>{children}</>;
});
