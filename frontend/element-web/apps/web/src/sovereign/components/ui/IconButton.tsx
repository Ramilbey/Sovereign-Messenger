/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * IconButton.tsx — CMP-2 Icon Button
 *
 * Purpose: compact icon-only action.
 * States (UI-5): default, hover, focus, active, disabled, loading.
 * Responsibility: an icon-only control has no visible text, so an accessible
 * name is mandatory (A11Y-6). `label` is required by the type signature and is
 * applied both as the accessible name and as the hover tooltip.
 */

import React, { memo, type ButtonHTMLAttributes, type JSX } from "react";

import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Spinner";
import "./ui.css";

export type IconButtonVariant = "ghost" | "solid" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    icon: IconName;
    /** Accessible name — required (A11Y-6). Also used as the native tooltip. */
    label: string;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    loading?: boolean;
}

export const IconButton = memo(function IconButton({
    icon,
    label,
    variant = "ghost",
    size = "md",
    loading = false,
    disabled,
    className,
    ...rest
}: IconButtonProps): JSX.Element {
    const isInoperable = disabled || loading;

    return (
        <button
            type="button"
            {...rest}
            disabled={isInoperable}
            aria-label={label}
            aria-busy={loading || undefined}
            title={label}
            className={[
                "svr-icon-button",
                `svr-icon-button--${variant}`,
                `svr-icon-button--${size}`,
                loading ? "is-loading" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {loading ? <Spinner size="sm" /> : <Icon name={icon} size={size === "sm" ? "sm" : "md"} />}
        </button>
    );
});
