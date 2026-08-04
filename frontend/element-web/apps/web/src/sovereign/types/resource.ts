/*
 * Sovereign Messenger — Sprint 3, Milestone 2 (Truthful Surfaces)
 * resource.ts — Resource State Model
 *
 * Implements the four-state contract required by FR-3 and ES-1, plus the
 * "unavailable" state required by FR-2.
 *
 * Why an envelope rather than a bare array: a bare array cannot distinguish
 * "still loading", "loaded and genuinely empty", "not part of this release",
 * and "failed to load". ES-2 requires empty and unavailable to be visually and
 * textually distinct, so the distinction has to survive the data layer.
 */

/**
 * The state of a data surface.
 *
 * - `loading`     — request in flight; the surface reserves its final size (ES-6)
 * - `ready`       — authoritative data is present
 * - `empty`       — loaded successfully, but there is nothing to show
 * - `unavailable` — no authoritative data source exists in this release (FR-2)
 * - `error`       — retrieval failed; the surface offers retry (ES-5)
 */
export type ResourceState = "loading" | "ready" | "empty" | "unavailable" | "error";

/**
 * A data surface and its state.
 *
 * `data` is always a usable value of type T (an empty collection rather than
 * null) so consumers never guard against null before rendering. `state` tells
 * the consumer what to render.
 */
export interface SovereignResource<T> {
    data: T;
    state: ResourceState;
}

/** Authoritative data is present. Resolves to `empty` when the collection is empty. */
export function ready<T>(data: T, isEmpty?: boolean): SovereignResource<T> {
    const empty = isEmpty ?? (Array.isArray(data) && data.length === 0);
    return { data, state: empty ? "empty" : "ready" };
}

/**
 * FR-2: no authoritative data source exists for this surface in the current
 * release. Distinct from `empty` — the surface is not broken and not waiting;
 * it is simply not part of this release.
 */
export function unavailable<T>(fallback: T): SovereignResource<T> {
    return { data: fallback, state: "unavailable" };
}

/** ES-5: retrieval failed. The consumer must offer a retry action. */
export function failed<T>(fallback: T): SovereignResource<T> {
    return { data: fallback, state: "error" };
}

/** ES-6: request in flight. The consumer reserves the final layout dimensions. */
export function loading<T>(fallback: T): SovereignResource<T> {
    return { data: fallback, state: "loading" };
}
