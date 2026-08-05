/*
 * Sovereign Messenger — Sprint 1, Step 4 · Sprint 3, Milestone 3
 * WorkspaceNavigation.tsx — CMP-16 Module List
 *
 * IA-10: modules are grouped as Communication, Work, and Personal, with
 * application configuration separated from content modules.
 * IA-12: grouping and order come from configuration — this component renders
 * the catalogue it is given and imposes no order of its own.
 */

import React, { memo, type JSX } from "react";

import { Icon } from "../ui";
import { NAVIGATION_COPY } from "../../config/navigationCopy";
import {
    type WorkspaceModuleItem,
    TERGOV_WORKSPACE_MODULES,
} from "../../config/workspaceModules";

interface Props {
    activeModuleId: string;
    onSelectModule: (moduleId: string) => void;
    modules?: WorkspaceModuleItem[];
    /** NAV-1: icon-only rail when the sidebar is collapsed. */
    collapsed?: boolean;
}

/** Sections in display order. A section with no modules is not rendered. */
const SECTIONS: ReadonlyArray<{
    category: WorkspaceModuleItem["category"];
    heading?: string;
}> = [
    { category: "universal", heading: NAVIGATION_COPY.moduleSectionUniversal },
    { category: "special", heading: NAVIGATION_COPY.moduleSectionSpecial },
    { category: "personal" },
    { category: "favorites" },
    { category: "settings" },
];

export const WorkspaceNavigation = memo(function WorkspaceNavigation({
    activeModuleId,
    onSelectModule,
    modules = TERGOV_WORKSPACE_MODULES,
    collapsed = false,
}: Props): JSX.Element {
    return (
        <nav
            id="sovereign-workspace-nav"
            className={`svr-module-nav${collapsed ? " is-collapsed" : ""}`}
            aria-label={NAVIGATION_COPY.moduleListLabel}
        >
            {SECTIONS.map(({ category, heading }) => {
                const items = modules.filter((module) => module.category === category);
                if (items.length === 0) return null;

                return (
                    <div key={category} className="svr-module-nav__section">
                        {heading && !collapsed && <h3 className="svr-module-nav__heading">{heading}</h3>}

                        <ul className="svr-module-nav__list">
                            {items.map((item) => {
                                const isActive = item.id === activeModuleId;

                                return (
                                    <li key={item.id}>
                                        <button
                                            id={`ws-nav-item-${item.id}`}
                                            type="button"
                                            className={`svr-module-nav__item${isActive ? " is-active" : ""}`}
                                            /* A11Y-6: the active module is stated, not only coloured. */
                                            aria-current={isActive ? "page" : undefined}
                                            onClick={() => onSelectModule(item.id)}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <Icon name={item.icon} size="sm" className="svr-module-nav__icon" />
                                            <span
                                                className={
                                                    collapsed
                                                        ? "svr-visually-hidden"
                                                        : "svr-module-nav__label"
                                                }
                                            >
                                                {item.label}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </nav>
    );
});
