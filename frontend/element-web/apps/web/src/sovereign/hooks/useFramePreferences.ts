/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * useFramePreferences.ts — Frame Layout Preferences Hook
 *
 * UI-18 / UI-19: exposes the persisted panel and density preferences to the
 * frame. Per Blueprint section 8, this consumes a service rather than reading
 * storage itself.
 */

import { useCallback, useEffect, useState } from "react";

import {
    FramePreferenceService,
    type FramePreferences,
} from "../services/FramePreferenceService";

export type { FramePreferences };

export interface FramePreferencesApi {
    preferences: FramePreferences;
    update: (change: Partial<FramePreferences>) => void;
}

export function useFramePreferences(): FramePreferencesApi {
    const service = FramePreferenceService.getInstance();
    const [preferences, setPreferences] = useState<FramePreferences>(() => service.get());

    useEffect(() => service.subscribe(setPreferences), [service]);

    const update = useCallback(
        (change: Partial<FramePreferences>) => service.set(change),
        [service],
    );

    return { preferences, update };
}
