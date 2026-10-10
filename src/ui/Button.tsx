import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { cx } from "./cx";
import s from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, CommonProps {
  loading?: boolean;
}

function classes({ variant = "secondary", size = "md", fullWidth }: CommonProps, extra?: string) {
  return cx(s.button, s[variant], size !== "md" && s[size], fullWidth && s.full, extra);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, iconRight, fullWidth, loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes({ variant, size, fullWidth }, cx(loading && s.loading, className))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
      {loading && <Loader2 size={16} className={cx(s.spinner, "spin")} aria-hidden />}
    </button>
  );
});

export interface ButtonLinkProps extends LinkProps, CommonProps {}

/** A router link that looks like a button. */
export function ButtonLink({ variant, size, icon, iconRight, fullWidth, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={classes({ variant, size, fullWidth }, className)} {...rest}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible name; also shown as a tooltip. Required: icon-only buttons need a label. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  tooltip?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "ghost", size = "md", tooltip = true, className, type = "button", ...rest },
  ref,
) {
  const button = (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={classes({ variant, size }, cx(s.icon, className))}
      {...rest}
    >
      {icon}
    </button>
  );
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
});
