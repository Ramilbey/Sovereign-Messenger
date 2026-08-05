/*
 * Sovereign Messenger — Sprint 3, Milestone 3 (Structure & Navigation)
 * useOrganisation.ts — Organisation Model Hook
 *
 * Exposes OrganisationService to the interface layer as a truthful surface
 * (Milestone 2 resource contract): a malformed or missing hierarchy resolves
 * to `error`, never to an empty sidebar that reads as "you belong to nothing".
 *
 * Per Blueprint section 8, hooks never import the Matrix SDK; they consume a
 * service, which is the only layer permitted to.
 */

import { useCallback, useMemo, useState } from "react";

import {
    OrganisationService,
    type OrgLanguage,
    type OrgNode,
} from "../services/OrganisationService";
import { failed, ready, type SovereignResource } from "../types/resource";

export interface OrganisationView {
    /** ES-5: re-reads the configuration after a failure. */
    retry: () => void;
    /** IA-4: the branch of the hierarchy this user may see. */
    tree: OrgNode | null;
    /** NAV-5: root → current node, inclusive. Every entry is navigable. */
    path: OrgNode[];
    /** ORG-4: the user's own position, which decides their default context. */
    positionId: string;
    /** IA-3: where the user currently is, which may be below their position. */
    currentId: string;
    /** The node the user is currently looking at. */
    current: OrgNode | null;
    /** ORG-7: identifying code of the current node. */
    code: string | null;
    /** ORG-6 / IA-11: module ids the current node enables; null places no limit. */
    enabledModuleIds: string[] | null;
    /** Interface language the display names were resolved for. */
    language: OrgLanguage;
}

interface UseOrganisationOptions {
    /**
     * AS-1: the department carried on the user's identity data, where present.
     * Absent or unrecognised values fall back to the configured default
     * position rather than inventing one.
     */
    departmentHint?: string | null;
    /** IA-3: the node the user has navigated to. Defaults to their position. */
    currentNodeId?: string;
    language?: OrgLanguage;
}

/**
 * The organisation hierarchy as the current user may see it.
 *
 * ORG-3: the shape returned is whatever the configuration declares — this hook
 * imposes no depth or breadth of its own, so a new department renders without
 * a code change (AC-14).
 */
export function useOrganisation(options: UseOrganisationOptions = {}): SovereignResource<OrganisationView> {
    const { departmentHint = null, currentNodeId, language = "uz" } = options;

    // Bumped by retry, so the configuration is read again rather than the
    // previous failed result being served from the memo.
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => {
        OrganisationService.reset();
        setAttempt((value) => value + 1);
    }, []);

    return useMemo(() => {
        const service = OrganisationService.getInstance();

        const positionId = service.resolvePosition(departmentHint);

        // ORG-5: navigating outside the authorised branch is not honoured —
        // the user falls back to their own position rather than being shown a
        // branch they have no claim to.
        const requested = currentNodeId ?? positionId;
        const currentId = service.isAuthorised(positionId, requested) ? requested : positionId;

        const view: OrganisationView = {
            retry,
            tree: service.getVisibleTree(positionId),
            path: service.getPath(currentId),
            positionId,
            currentId,
            current: service.getNode(currentId),
            code: service.getCode(currentId),
            enabledModuleIds: service.getEnabledModuleIds(currentId),
            language,
        };

        if (!service.isValid() || !view.tree || !view.current) {
            console.warn("[useOrganisation] Organisation configuration is unusable:", service.getProblems());
            return failed(view);
        }

        return ready(view, false);
    }, [departmentHint, currentNodeId, language, retry, attempt]);
}
