/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * Button.tsx — CMP-1 Button
 *
 * Purpose: primary, secondary, danger, and ghost actions.
 * States (UI-5, TOK-16): default, hover, focus, active, disabled, loading.
 * Responsibility: consistent action affordance; never conveys state by
 * colour alone (A11Y-5) — the loading state carries a spinner and the
 * disabled state is exposed to assistive technology.
 */

import React, { memo, type ButtonHTMLAttributes, type JSX, type ReactNode } from "react";

import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Spinner";
import "./ui.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Renders the loading state and blocks activation. */
    loading?: boolean;
    /** Optional leading icon. Decorative — the label carries the meaning. */
    icon?: IconName;
    /** Stretches the button to the width of its container. */
    fullWidth?: boolean;
    children: ReactNode;
}

export const Button = memo(function Button({
    variant = "secondary",
    size = "md",
    loading = false,
    icon,
    fullWidth = false,
    disabled,
    className,
    children,
    ...rest
}: ButtonProps): JSX.Element {
    const isInoperable = disabled || loading;

    return (
        <button
            type="button"
            {...rest}
            disabled={isInoperable}
            aria-busy={loading || undefined}
            className={[
                "svr-button",
                `svr-button--${variant}`,
                `svr-button--${size}`,
                fullWidth ? "svr-button--full" : "",
                loading ? "is-loading" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {loading ? (
                <Spinner size="sm" />
            ) : (
                icon && <Icon name={icon} size={size === "lg" ? "md" : "sm"} />
            )}
            <span className="svr-button__label">{children}</span>
        </button>
    );
});
