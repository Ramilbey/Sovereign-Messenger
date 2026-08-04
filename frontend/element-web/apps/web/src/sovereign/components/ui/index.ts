/*
 * Sovereign Messenger — Sprint 3, Milestone 1 (Design Foundation)
 * index.ts — Design System Barrel
 *
 * Single import surface for the Sovereign design system. Later milestones
 * import foundation components from here rather than by individual path, so
 * the component inventory (PRD Appendix C) has one authoritative entry point.
 */

export { Icon, type IconName, type IconSize } from "./Icon";
export { Button, type ButtonVariant, type ButtonSize } from "./Button";
export { IconButton, type IconButtonVariant, type IconButtonSize } from "./IconButton";
export { InputField } from "./InputField";
export { Avatar, type AvatarSize } from "./Avatar";
export { Badge, type BadgeTone } from "./Badge";
export { Tooltip, type TooltipPlacement } from "./Tooltip";
export { Spinner, Skeleton, type SpinnerSize, type SkeletonShape } from "./Spinner";
export { Divider, type DividerTone } from "./Divider";
export { EmptyState, type EmptyStateVariant } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export { ConnectionBanner } from "./ConnectionBanner";
export { SecurityNotice, type SecurityNoticeSeverity } from "./SecurityNotice";
