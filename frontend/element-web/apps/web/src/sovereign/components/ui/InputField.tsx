/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * InputField.tsx — CMP-3 Input Field
 *
 * Purpose: single-line text entry.
 * States (UI-5): default, focus, filled, error, disabled.
 * Responsibility: programmatically associates its label, hint, and validation
 * message with the control (A11Y-11), so an error is announced rather than
 * only shown. Error state carries an icon and text, never colour alone (A11Y-5).
 */

import React, { memo, useId, type InputHTMLAttributes, type JSX } from "react";

import { Icon, type IconName } from "./Icon";
import "./ui.css";

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
    /** Visible label. Always rendered; use `labelHidden` to hide it visually only. */
    label: string;
    /** Hides the label visually while keeping it available to assistive technology. */
    labelHidden?: boolean;
    /** Supporting text shown beneath the field. */
    hint?: string;
    /** Validation message. Presence of this value puts the field in its error state. */
    error?: string;
    /** Optional leading icon (decorative). */
    icon?: IconName;
}

export const InputField = memo(function InputField({
    label,
    labelHidden = false,
    hint,
    error,
    icon,
    disabled,
    className,
    ...rest
}: InputFieldProps): JSX.Element {
    const inputId = useId();
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);

    // A11Y-11: associate hint and error with the control
    const describedBy = [hint ? hintId : null, hasError ? errorId : null].filter(Boolean).join(" ");

    return (
        <div
            className={[
                "svr-field",
                hasError ? "is-error" : "",
                disabled ? "is-disabled" : "",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <label
                htmlFor={inputId}
                className={["svr-field__label", labelHidden ? "svr-visually-hidden" : ""]
                    .filter(Boolean)
                    .join(" ")}
            >
                {label}
            </label>

            <div className="svr-field__control">
                {icon && <Icon name={icon} size="sm" className="svr-field__icon" />}
                <input
                    {...rest}
                    id={inputId}
                    disabled={disabled}
                    aria-invalid={hasError || undefined}
                    aria-describedby={describedBy || undefined}
                    className="svr-field__input"
                />
            </div>

            {hint && !hasError && (
                <p id={hintId} className="svr-field__hint">
                    {hint}
                </p>
            )}

            {hasError && (
                <p id={errorId} className="svr-field__error" role="alert">
                    <Icon name="error" size="sm" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
});
